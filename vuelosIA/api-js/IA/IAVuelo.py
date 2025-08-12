import sys
import json
import re
import os
import pymysql.cursors # Importar PyMySQL para la conexión a la base de datos
from rapidfuzz import process, fuzz # Asegúrate de que rapidfuzz esté importado
import openai # Asegúrate de que openai esté importado
from openai import OpenAI # Importar OpenAI client
from google.cloud import storage
import json

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

BUCKET_NAME = "codigo-iata-bucket"  # Cambialo por el nombre real
IATA_FILE = "codigoIATA.json"
DESTINOS_FILE = "destinos.json"

storage_client = storage.Client()

def read_json_from_bucket(file_name):
    bucket = storage_client.bucket(BUCKET_NAME)
    blob = bucket.blob(file_name)
    content = blob.download_as_text()
    return json.loads(content)

MESES = {
    "enero": "JAN", "febrero": "FEB", "marzo": "MAR", "abril": "APR",
    "mayo": "MAY", "junio": "JUN", "julio": "JUL", "agosto": "AUG",
    "septiembre": "SEP", "octubre": "OCT", "noviembre": "NOV", "diciembre": "DEC"
}

def es_fecha_rango_concreto(frase):
    return bool(re.search(r"del?\s+\d{1,2}\s+(al|hasta)\s+\d{1,2}\s+de\s+\w+", frase.lower()))

def extraer_fechas_desde_frase(frase):
    match = re.search(r"del (\d{1,2}) al (\d{1,2}) de (\w+)", frase.lower())
    if match:
        dia_ini, dia_fin, mes = match.groups()
        if mes in MESES:
            return (f"{int(dia_ini):02d}{MESES[mes]}", f"{int(dia_fin):02d}{MESES[mes]}", "rango")
    match = re.search(r"el (\d{1,2}) de (\w+)", frase.lower())
    if match:
        dia, mes = match.groups()
        if mes in MESES:
            dep = f"{int(dia):02d}{MESES[mes]}"
            ret = f"{int(dia)+7:02d}{MESES[mes]}" # Asume una semana de duración
            return (dep, ret, "fechaExacta")
    return None, None, None

def match_fecha_concreta(frase, ejemplos, umbral=85):
    """
    Busca una coincidencia de fecha concreta en la lista de ejemplos.
    """
    if not ejemplos:
        return None
    frases_ejemplo = [ej["frase"] for ej in ejemplos if "frase" in ej]
    
    # Asegurarse de que frases_ejemplo no esté vacío antes de llamar a process.extractOne
    if not frases_ejemplo:
        print("⚠️ No hay frases de ejemplo válidas para el matching de fechas.")
        return None

    match = process.extractOne(frase, frases_ejemplo, scorer=fuzz.WRatio)
    if match and match[1] >= umbral:
        # Encontrar el objeto original del ejemplo que coincidió
        for ej in ejemplos:
            if ej.get("frase") == match[0]:
                return ej
    return None



def obtener_codigo_iata(obj):
    try:
        codigos_iata_db = read_json_from_bucket(IATA_FILE)
    except Exception as e:
        print(f"⚠️ Error leyendo códigos IATA del bucket: {e}")
        return obj

    if not codigos_iata_db:
        print("⚠️ No se encontraron códigos IATA en el bucket.")
        return obj

    ciudades = [d["ciudad"].lower().strip() for d in codigos_iata_db]
    dest_usuario = obj.get("origenVuelta", "").lower().strip()

    match = process.extractOne(dest_usuario, ciudades, scorer=fuzz.WRatio)

    if match and match[1] >= 70:  # Umbral de coincidencia
        for d in codigos_iata_db:
            if d["ciudad"].lower().strip() == match[0]:
                obj["origenVuelta"] = d["codigoIATA"]
                break
    else:
        print(f"❌ No se encontró código IATA para '{dest_usuario}' con el umbral dado.")

    return obj


def cargar_destinos():
    try:
        destinos_list = read_json_from_bucket(DESTINOS_FILE)
    except Exception as e:
        print(f"⚠️ Error leyendo destinos del bucket: {e}")
        return {}

    destinos = {}
    for d in destinos_list:
        key = d.get("origenVuelta")
        if key:
            destinos[key] = d
    return destinos


def completar_objetos_finales(base):
    destinos_config = cargar_destinos() # Ahora carga de la DB
    origen = base.get("origenVuelta", "")
    
    # Obtener configuración específica para el origen o valores por defecto
    config = destinos_config.get(origen, {
        "maxDuracionIda": "", "maxDuracionVuelta": "",
        "horarioIdaEntre": "", "horarioIdaHasta": "",
        "horarioVueltaEntre": "", "horarioVueltaHasta": "",
        "stops": "0" # Default a "0" o "Directo" si no se encuentra en la DB, para que coincida con VARCHAR
    })

    return {
        "mail": "franco@melincue.tur.ar",
        "password": "Francomase12!",
        "origenIda": "BUE",
        "origenVuelta": origen,
        "departureDate": base.get("departureDate", ""),
        "returnDate": base.get("returnDate", ""),
        "adults": base.get("adults", 0),
        "children": base.get("children", 0),
        "infants": base.get("infants", 0),
        "currency": "USD",
        "checkedBaggage": False,
        "maxDuracionIda": config.get("maxDuracionIda", ""),
        "maxDuracionVuelta": config.get("maxDuracionVuelta", ""),
        "horarioIdaEntre": config.get("horarioIdaEntre", ""),
        "horarioIdaHasta": config.get("horarioIdaHasta", ""),
        "horarioVueltaEntre": config.get("horarioVueltaEntre", ""),
        "horarioVueltaHasta": config.get("horarioVueltaHasta", ""),
        "stops": config.get("stops", "0") # Asegúrate de que el tipo coincida con lo que esperas (VARCHAR)
    }

def generar_json_desde_mensaje(mensaje):
    # Asegúrate de que tu clave de API de OpenAI esté configurada en las variables de entorno de Cloud Run
    # El cliente OpenAI ya está inicializado globalmente al principio del script.

    prompt = f"""
Sos una IA que recibe mensajes de clientes y devuelve un objeto  con los datos del vuelo.

Tu tarea es:
- Interpretar pasajeros
- Detectar fechas anbiguas y pasarlas a concretas
- Detectar el destino y devolver el lugar donde entendes que va a ir

Respondé SOLO con el objeto JSON puro (sin texto adicional, sin explicaciones).

- origenVuelta: lugar de destino, puede ser un ciudad o pais
- fraseFecha: pasar de la fecha ambigua a una concreta
- adults: cantidad de adultos (mayores de 12 años) 
- children: cantidad de niños (3 a 11 años) 
- infants: cantidad de bebés menores de 3 años 

---

**Reglas y detalles importantes:**
2. El destino (`origenVuelta`) debe ser un lugar valido⚠ IMPORTANTE:

---

=======================
1. INTERPRETACIÓN ROBUSTA DE PASAJEROS
=======================

🧠 Tu tarea es detectar con precisión cuántas personas viajan, clasificadas como:
- adults (12 años o más)
- children (de 2 a 11 años)
- infants (menores de 2 años)

✈️ CLAVES:
- Siempre asumí que la persona que escribe viaja → suma 1 adulto, **aunque no lo diga explícitamente**.
- Mencioná como adultos a cada persona nombrada con palabras como: "mi mamá", "mi papá", "mi esposa", "mi pareja", "mi amigo", "mi hijo de 20", etc.
- Detectá edades explícitas:  
  - Si dice “tiene 23 años”, o “mi hijo de 14” → contalo como **adulto**
  - Si dice “mi hija de 8” → contalo como **niño**
  - Si dice “mi bebé”, “de meses”, o edad menor a 2 → **infante**
- Si solo dice “menor”, “chiquito”, “nene” → asumí **niño**, salvo que diga claramente “bebé”
- Nunca mezcles categorías por error: un hijo de 23 **no puede ser niño**
- Si dice “mis 2 hijos, uno es bebé y otro de 13” → infante + adulto
- Si es ambiguo, asumí la interpretación más lógica y coherente con la edad o contexto.
- Cuando el mensaje dice "viajo a" o "quiero ir a" tenes que contar a la persona que escribio el mensaje como un adulto
👤 Ejemplos:

| Mensaje                                                     | adults | children | infants |
|-------------------------------------------------------------|--------|----------|---------|
| "viajo con mi esposa y mis 2 hijos"                         | 2      | 2        | 0       |
| "yo, mi mamá y mis dos hijos, uno es menor y otro de 23"    | 3      | 1        | 0       |
| "nos vamos mi señora, mi hijo de 10 y el bebé"              | 2      | 1        | 1       |
| "viajamos mi hija de 14 y yo"                               | 2      | 0        | 0       |
| "voy con mi esposa, mi hijo de 2 años y el bebé"            | 2      | 1        | 1       |
| "me voy solo"                                               | 1      | 0        | 0       |
| "me quiero ir"                                              | 1      | 0        | 0       |
| "me quiero ir con mi  hijo"                                 | 1      | 1        | 0       |
| "me quiero ir con mi  hijo de 22"                           | 2      | 0        | 0       |
| "me quiero ir con mi  hijo de 22 y mi mama"                 | 3      | 0        | 0       |
| "quiero un viaje para 2 mayore y un menor "                 | 2      | 1        | 0       |
| "viajo a "                                                  | 1      | 0        | 0       |


🛑 Nunca devuelvas números incorrectos. Detectar edades bien es crucial para la reserva.

Generá siempre las claves `"adults"`, `"children"` y `"infants"` correctamente.


=======================
2. Interpretación de fechas
=======================

Tu tarea es interpretar mensajes con fechas de viaje y devolver un JSON con los datos.

Devuelve un único objeto JSON, con estos campos:
- origenVuelta: destino interpretado
- fraseFecha: frase clara que resume la fecha o rango de fechas de salida y regreso, por ejemplo "segunda quincena de agosto" o "del 15 al 20 de agosto"
- tipoFecha: uno de ["semana", "quincena", "rango", "fechaExacta"]
- adults, children, infants: números de pasajeros.

Ejemplos:

Mensaje: "Quiero viajar la segunda quincena de agosto"
Respuesta JSON:
{{
  "origenVuelta": "MAD",
  "fraseFecha": "segunda quincena de agosto",
  "adults": 1,
  "children": 0,
  "infants": 0
}}

Mensaje: "Viajo del 15 al 20 de agosto"
Respuesta JSON:
{{
  "origenVuelta": "MAD",
  "fraseFecha": "del 15 al 20 de agosto",
  "adults": 1,
  "children": 0,
  "infants": 0
}}
---
=======================
3. Interpretacion codigo IATA
=======================

Tenes que interpretar el lugar donde quiere ir el cliente segun el mensaje, puede ser madrid, Cancun, o lo que sea tenes que ver el destino y rempazarlo en 'origenVuelta' del objeto final


=======================
🔁 Revisión final de fechas ANTES de generar el objeto JSON
=======================⚠️ No modifiques el JSON anterior ni generes uno nuevo. Solo revisá internamente que `departureDate` y `returnDate` cumplan estas reglas antes de mostrar el resultado.
✅ Interpretación de “quincenas”:

✅ Si ya lo hiciste bien, respondé con ese mismo objeto.  
❌ Si hay algún error en esas fechas, corregilo internamente antes de mostrar el resultado final.

⚠️ Respondé solamente con UN único objeto JSON. No expliques nada, no devuelvas más de un JSON.
ejemplo de resultado, llenar con los datos obtenidos:
{{
  "origenVuelta": "", 
  "fraseFecha": "",
  "adults": 0,
  "children": 0,
  "infants": 0,
}}
no te confundas los nombres de los atributos, tene mucho cuidado
Cuando termines de armar el objeto revisa nuevamente las fechas hasta que estes seguro de la respuesta
Tenes que revisar las fechas y segui los ejemplos que estan en la seecion 
todos los campos del objeto que tenes que retonar tienen que tener un valor si o si, si no encontraste un valor para alguno tenes que volver a buscar hasta que esten todos completados correctamente
No tenes que inventar fechas, segui el paso a paso de las instrucciones.
Cada campo a completar tiene un instructivo preciso de lo que se pide, seguilo al 100% siempre
Siempre devolve un solo json, nunca retornes 2, SIEMPRE RETORNA 1 SOLO JSON

⚠️ Respondé solamente con UN único objeto JSON. No expliques nada, no devuelvas más de un JSON.

-------------------

---
Mensaje del cliente:
\"\"\"{mensaje}\"\"\"
    """
    try:
        res = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1000
        )
        texto = res.choices[0].message.content
    except Exception as e:
        print("❌ Error llamando a la API de OpenAI:", e)
        return None

    match = re.search(r"\{[\s\S]*?\}", texto)
    if not match:
        print("❌ No se encontró objeto JSON en la respuesta:", texto)
        return None

    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        print("❌ JSON mal formado:", texto)
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("❗ Uso: python procesar_mensaje.py \"Tu mensaje\"")
        sys.exit(1)

    mensaje = sys.argv[1]
    vuelo_raw = generar_json_desde_mensaje(mensaje)

    if not vuelo_raw:
        print("❌ No se pudo generar un objeto base desde la IA.")
        sys.exit(1)

    frase = vuelo_raw.get("fraseFecha", "")
    
    # --- Lógica de carga de ejemplos para fechas desde un archivo JSON ---
    try:
        # Usando la ruta directa que indicaste
        ejemplos = json.load(open("IA/ejemplos.json", "r", encoding="utf-8"))["ejemplos"]
    except Exception as e:
        print(f"⚠️ Error cargando ejemplos.json: {e}")
        ejemplos = [] # Si hay un error, inicializa ejemplos como una lista vacía

    dep, ret, tipo = "", "", "" # Inicializar para evitar errores si no se asignan

    if es_fecha_rango_concreto(frase):
        dep, ret, tipo = extraer_fechas_desde_frase(frase)
    else:
        matched = match_fecha_concreta(frase, ejemplos)
        dep = matched.get("departureDate", "") if matched else ""
        ret = matched.get("returnDate", "") if matched else ""
        tipo = matched.get("tipoFecha", "") if matched else ""

    vuelo_raw["departureDate"] = dep
    vuelo_raw["returnDate"] = ret
    vuelo_raw["tipoFecha"] = tipo

    vuelo_cod = obtener_codigo_iata(vuelo_raw)
    vuelo_final = completar_objetos_finales(vuelo_cod)

    print(json.dumps(vuelo_final, ensure_ascii=False, indent=2))
