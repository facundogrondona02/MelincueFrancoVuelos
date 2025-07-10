import sys
import json
import json
import re
from rapidfuzz import process, fuzz
from concurrent.futures import ThreadPoolExecutor
from openai import OpenAI
import json
import os
key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=key)


def generar_ambas_llamadas(mensaje):
    with ThreadPoolExecutor(max_workers=2) as executor:
        future_fechas = executor.submit(generar_multi_busqueda, mensaje)
        future_parametros = executor.submit(generar_todo_lo_demas, mensaje)
        fechas = future_fechas.result()
        parametros = future_parametros.result()
    return fechas, parametros
import json
# Si la función limpiar_json no está definida en este archivo, asegúrate de importarla
# from .utils import limpiar_json 
# (o donde sea que la tengas definida)
def limpiar_mensaje_usuario(mensaje):
    """
    Normaliza el mensaje del usuario para reducir la sensibilidad del LLM
    a variaciones de espacios y puntuación.
    """
    # Estandariza el espacio después de la coma: ",X" se convierte en ", X"
    mensaje = mensaje.replace(",", ", ")
    # Normaliza múltiples espacios a uno solo
    mensaje = " ".join(mensaje.split())
    # Elimina espacios al inicio y al final
    mensaje = mensaje.strip()
    return mensaje


def generar_multi_busqueda(mensaje):
    mensaje_procesado = limpiar_mensaje_usuario(mensaje)
    prompt = f"""
Eres una IA especializada en interpretar intenciones de viaje y devolver FECHAS en un formato JSON muy específico.
NO ERES UN CHATBOT. NO HABLES. NO EXPLICUES NADA. NO AGREGUES TEXTO INTRODUCTORIO NI FINAL.
**TU ÚNICA TAREA ES GENERAR UN ARRAY JSON VÁLIDO Y NO VACÍO.**

---

### REGLA DE FORMATO MÁS IMPORTANTE (CRÍTICA):

Cada objeto JSON dentro del array debe estar **SIEMPRE** envuelto en **DOBLE LLAVE `{{` y `}}`**. Esto es **OBLIGATORIO** para que tu sistema lo procese correctamente.

El formato final de tu salida **DEBE SER EXACTAMENTE ASÍ**:

```json
[
  {{"departureDate": "DDMMM", "returnDate": "DDMMM"}},
  {{"departureDate": "DDMMM", "returnDate": "DDMMM"}},
  // ... y así sucesivamente para CADA combinación de fecha.
]
REPITO ENFÁTICAMENTE: La salida debe ser SOLO EL ARRAY JSON PURO. Contendrá SOLAMENTE objetos con las claves "departureDate" y "returnDate". CADA UNO DE ESTOS OBJETOS ESTARÁ ENCERRADO EN DOBLE LLAVE {{}}. NO SE PERMITE NINGUNA OTRA CLAVE (ej. 'mail', 'password', 'origenIda', 'adults', 'currency', 'stops', etc.). CERO TEXTO ADICIONAL, CERO EXPLICACIONES, CERO CÓDIGO FUERA DEL JSON.

LÓGICA DE INTERPRETACIÓN DE FECHAS (PRIORIDAD DE CASOS):
FECHA DE REGRESO EXPLÍCITA (PRIORIDAD ALTA):

Si el mensaje especifica una fecha de regreso exacta y fija (ej. "vuelvo el 25", "hasta el 10 de octubre"), esa fecha será el returnDate para TODAS las departureDate posibles.

La duración se ignora si hay un returnDate explícito.

Ejemplo:

Mensaje: "puedo salir entre el 8 y el 11 de AGOSTO y vuelvo el 25"

JSON de salida (SOLO JSON):

[
  {{"departureDate": "08AUG", "returnDate": "25AUG"}},
  {{"departureDate": "09AUG", "returnDate": "25AUG"}},
  {{"departureDate": "10AUG", "returnDate": "25AUG"}},
  {{"departureDate": "11AUG", "returnDate": "25AUG"}}
]
RANGO DE DÍAS DE SALIDA CON DURACIÓN (PRIORIDAD MEDIA):

Si el mensaje da un rango específico de días de salida dentro de un mes (ej. "entre el 15 y 20", "del 2 al 5") y una duración ("7 noches", "8 días").

departureDate será cada día dentro del rango.

returnDate se calcula sumando la duración a cada departureDate.

Ejemplo:

Mensaje: "me quiero ir una semana a Cancún y puedo salir entre el 15 y 20 de ENERO"

JSON de salida (SOLO JSON):

[
  {{"departureDate": "15JAN", "returnDate": "22JAN"}},
  {{"departureDate": "16JAN", "returnDate": "23JAN"}},
  {{"departureDate": "17JAN", "returnDate": "24JAN"}},
  {{"departureDate": "18JAN", "returnDate": "25JAN"}},
  {{"departureDate": "19JAN", "returnDate": "26JAN"}},
  {{"departureDate": "20JAN", "returnDate": "27JAN"}}
]
CUALQUIER FECHA DEL MES CON DURACIÓN FIJA (PRIORIDAD BAJA):

Si solo se menciona un mes general y una duración (ej. "7 noches en mayo", "5 días en diciembre", "3 noches en enero",  "8 días en agosto", "11 dias en noviembre"), y no hay un rango de días de salida o fecha de regreso explícita.

DEBES generar TODAS LAS COMBINACIONES POSIBLES de salida, día por día, desde el día 01 del mes hasta el ÚLTIMO DÍA NATURAL de ese mes.

returnDate se calcula sumando la duración exacta a cada departureDate. Este cálculo debe manejar correctamente los cruces de mes.

Ejemplo:

Mensaje: "me quiero ir 7 noches en mayo a cancun"

JSON de salida (SOLO JSON):

[
  {{"departureDate": "01MAY", "returnDate": "08MAY"}},
  {{"departureDate": "02MAY", "returnDate": "09MAY"}},
  {{"departureDate": "03MAY", "returnDate": "10MAY"}},
  {{"departureDate": "04MAY", "returnDate": "11MAY"}},
  {{"departureDate": "05MAY", "returnDate": "12MAY"}},
  {{"departureDate": "06MAY", "returnDate": "13MAY"}},
  {{"departureDate": "07MAY", "returnDate": "14MAY"}},
  {{"departureDate": "08MAY", "returnDate": "15MAY"}},
  {{"departureDate": "09MAY", "returnDate": "16MAY"}},
  {{"departureDate": "10MAY", "returnDate": "17MAY"}},
  {{"departureDate": "11MAY", "returnDate": "18MAY"}},
  {{"departureDate": "12MAY", "returnDate": "19MAY"}},
  {{"departureDate": "13MAY", "returnDate": "20MAY"}},
  {{"departureDate": "14MAY", "returnDate": "21MAY"}},
  {{"departureDate": "15MAY", "returnDate": "22MAY"}},
  {{"departureDate": "16MAY", "returnDate": "23MAY"}},
  {{"departureDate": "17MAY", "returnDate": "24MAY"}},
  {{"departureDate": "18MAY", "returnDate": "25MAY"}},
  {{"departureDate": "19MAY", "returnDate": "26MAY"}},
  {{"departureDate": "20MAY", "returnDate": "27MAY"}},
  {{"departureDate": "21MAY", "returnDate": "28MAY"}},
  {{"departureDate": "22MAY", "returnDate": "29MAY"}},
  {{"departureDate": "23MAY", "returnDate": "30MAY"}},
  {{"departureDate": "24MAY", "returnDate": "31MAY"}},
  {{"departureDate": "25MAY", "returnDate": "01JUN"}},
  {{"departureDate": "26MAY", "returnDate": "02JUN"}},
  {{"departureDate": "27MAY", "returnDate": "03JUN"}},
  {{"departureDate": "28MAY", "returnDate": "04JUN"}},
  {{"departureDate": "29MAY", "returnDate": "05JUN"}},
  {{"departureDate": "30MAY", "returnDate": "06JUN"}},
  {{"departureDate": "31MAY", "returnDate": "07JUN"}}
]


Mensaje: "me quiero ir 5 noches en agosto a cancun"

JSON de salida (SOLO JSON):
[
  {{"departureDate": "01AUG", "returnDate": "06AUG"}},
  {{"departureDate": "02AUG", "returnDate": "07AUG"}},
  {{"departureDate": "03AUG", "returnDate": "08AUG"}},
  {{"departureDate": "04AUG", "returnDate": "09AUG"}},
  {{"departureDate": "05AUG", "returnDate": "10AUG"}},
  {{"departureDate": "06AUG", "returnDate": "11AUG"}},
  {{"departureDate": "07AUG", "returnDate": "12AUG"}},
  {{"departureDate": "08AUG", "returnDate": "13AUG"}},
  {{"departureDate": "09AUG", "returnDate": "14AUG"}},
  {{"departureDate": "10AUG", "returnDate": "15AUG"}},
  {{"departureDate": "11AUG", "returnDate": "16AUG"}},
  {{"departureDate": "12AUG", "returnDate": "17AUG"}},
  {{"departureDate": "13AUG", "returnDate": "18AUG"}},
  {{"departureDate": "14AUG", "returnDate": "19AUG"}},
  {{"departureDate": "15AUG", "returnDate": "20AUG"}},
  {{"departureDate": "16AUG", "returnDate": "21AUG"}},
  {{"departureDate": "17AUG", "returnDate": "22AUG"}},
  {{"departureDate": "18AUG", "returnDate": "23AUG"}},
  {{"departureDate": "19AUG", "returnDate": "24AUG"}},
  {{"departureDate": "20AUG", "returnDate": "25AUG"}},
  {{"departureDate": "21AUG", "returnDate": "26AUG"}},
  {{"departureDate": "22AUG", "returnDate": "27AUG"}},
  {{"departureDate": "23AUG", "returnDate": "28AUG"}},
  {{"departureDate": "24AUG", "returnDate": "29AUG"}},
  {{"departureDate": "25AUG", "returnDate": "30AUG"}},
  {{"departureDate": "26AUG", "returnDate": "31AUG"}},
  {{"departureDate": "27AUG", "returnDate": "01SEP"}},
  {{"departureDate": "28AUG", "returnDate": "02SEP"}},
  {{"departureDate": "29AUG", "returnDate": "03SEP"}},
  {{"departureDate": "30AUG", "returnDate": "04SEP"}},
  {{"departureDate": "31AUG", "returnDate": "05SEP"}}
]
Mensaje:"tenemos disponibilidad en Septiembre. Queremos viajar a Santiago 3 noches"
JSON de salida (SOLO JSON):

[
  {{"departureDate": "01AUG", "returnDate": "04AUG"}},
  {{"departureDate": "02AUG", "returnDate": "05AUG"}},
  {{"departureDate": "03AUG", "returnDate": "06AUG"}},
  {{"departureDate": "04AUG", "returnDate": "07AUG"}},
  {{"departureDate": "05AUG", "returnDate": "08AUG"}},
  {{"departureDate": "06AUG", "returnDate": "09AUG"}},
  {{"departureDate": "07AUG", "returnDate": "10AUG"}},
  {{"departureDate": "08AUG", "returnDate": "11AUG"}},
  {{"departureDate": "09AUG", "returnDate": "12AUG"}},
  {{"departureDate": "10AUG", "returnDate": "13AUG"}},
  {{"departureDate": "11AUG", "returnDate": "14AUG"}},
  {{"departureDate": "12AUG", "returnDate": "15AUG"}},
  {{"departureDate": "13AUG", "returnDate": "16AUG"}},
  {{"departureDate": "14AUG", "returnDate": "17AUG"}},
  {{"departureDate": "15AUG", "returnDate": "18AUG"}},
  {{"departureDate": "16AUG", "returnDate": "19AUG"}},
  {{"departureDate": "17AUG", "returnDate": "20AUG"}},
  {{"departureDate": "18AUG", "returnDate": "21AUG"}},
  {{"departureDate": "19AUG", "returnDate": "22AUG"}},
  {{"departureDate": "20AUG", "returnDate": "23AUG"}},
  {{"departureDate": "21AUG", "returnDate": "24AUG"}},
  {{"departureDate": "22AUG", "returnDate": "25AUG"}},
  {{"departureDate": "23AUG", "returnDate": "26AUG"}},
  {{"departureDate": "24AUG", "returnDate": "27AUG"}},
  {{"departureDate": "25AUG", "returnDate": "28AUG"}},
  {{"departureDate": "26AUG", "returnDate": "29AUG"}},
  {{"departureDate": "27AUG", "returnDate": "30AUG"}},
  {{"departureDate": "28AUG", "returnDate": "31AUG"}},
  {{"departureDate": "29AUG", "returnDate": "01SEP"}},
  {{"departureDate": "30AUG", "returnDate": "02SEP"}},
  {{"departureDate": "31AUG", "returnDate": "03SEP"}}
]

REGLAS DE CÁLCULO Y FORMATO ESTRICTO:
Extracción de duración: Busca un número seguido de "noches", "días", "semana" (7 días), o "quincena" (15 días).

SOLO SI no hay duración explícita Y no hay fecha de regreso fija, asume por defecto: 7 días.

Cálculo de fechas: Calcula returnDate sumando la duración a departureDate. Maneja correctamente los cruces de mes.

Formato de Fechas (DDMMM): DD (día con dos dígitos, ej. "01", "15"), MMM (mes abreviado en MAYÚSCULAS).

Meses: JAN, FEB, MAR, APR, MAY, JUN, JUL, AUG, SEP, OCT, NOV, DIC.

Días por mes (FIJOS): ENE: 31, FEB: 28, MAR: 31, ABR: 30, MAY: 31, JUN: 30, JUL: 31, AGO: 31, SEP: 30, OCT: 31, NOV: 30, DIC: 31.

GENERACIÓN EXACTA:

NUNCA devuelvas un array vacío. Siempre genera al menos una opción.

NO inventes meses o fechas. El mensaje debe contener un mes.

La respuesta debe ser SOLO EL ARRAY JSON PURO. NI UNA LETRA MÁS.

MENSAJE A PROCESAR:
{mensaje_procesado}
"""
    # La carga de un archivo JSON 'ejemplos_fechas_completos' no es necesaria aquí,
    # ya que la IA no lo "lee" como un archivo. Su conocimiento se basa en los ejemplos
    # y reglas que le proporcionamos directamente en el prompt.
    # El archivo json_fechas_completos.json es útil para TI como referencia o para un futuro
    # pre-entrenamiento si el modelo lo permite, pero no para este prompt directo.
    res = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=3000
        )
    texto = res.choices[0].message.content

    try:
        # Asegúrate de que limpiar_json sea robusto y maneje casos donde la IA podría
        # añadir texto antes o después del JSON, o generar un JSON malformado.
        limpio = limpiar_json(texto)
        fechas = json.loads(limpio)
        if not fechas:
            raise ValueError("Array JSON vacío o inesperado después de limpieza.")
    except json.JSONDecodeError as e:
        print(f"Error al decodificar JSON de la respuesta de la IA: {e}")
        print(f"Contenido problemático recibido: {texto}")
        fechas = []  # Devolver una lista vacía en caso de error de parseo.
    except ValueError as e: # Captura el error de array vacío
        print(f"Error de validación del JSON: {e}")
        print(f"Contenido recibido: {texto}")
        fechas = []
    except Exception as e:
        print(f"Ocurrió un error inesperado: {e}")
        print(f"Contenido recibido: {texto}")
        fechas = []
    return fechas
# NOTA: La función 'limpiar_json' debe estar definida en algún lugar y ser capaz de
# extraer el JSON puro de la cadena 'content' que devuelve la IA.
# Un ejemplo básico de limpiar_json podría ser:
# def limpiar_json(text):
#     # Busca el primer '[' y el último ']' para intentar extraer el JSON
#     start = text.find('[')
#     end = text.rfind(']')
#     if start != -1 and end != -1 and start < end:
#         return text[start : end + 1]
#     return "[]" # Si no encuentra un JSON válido, retorna un array vacío.
def generar_todo_lo_demas(mensaje):
       
    prompt2= f"""
Sos una IA que recibe mensajes en español y debe devolver solo un único objeto JSON con las siguientes claves exactas:

- origenVuelta: lugar de destino, puede ser un ciudad o pais
- adults: cantidad de adultos (mayores de 12 años)
- children: cantidad de niños (3 a 11 años)
- infants: cantidad de bebés menores de 3 años


Reglas:

IMPORTANTE:  
- Cada vez que se mencione "mi esposa", "mi marido", "mi pareja", "mi mujer", etc., sumá 1 adulto adicional.  
- No devuelvas arrays ni listas: SOLO un único objeto JSON con los campos requeridos.  
- Si se mencionan “mis hijos”, “los chicos”, “mis nenes” y **no hay edad explícita**, asumí que son `children` (entre 3 y 11 años).
- Nunca asumas que un hijo es adulto a menos que se indique su edad (mayor a 12) o se diga explícitamente que es adolescente o mayor.

- Frases como "mi esposa", "mi marido", "mi pareja", "mi amigo","mi mujer", etc., suman 1 adulto cada una.  
- Menciones de “mi hijo”, “mis hijos”, “los nenes”, “mi bebé” indican niños o infantes según contexto.  
- Completar todos los campos obligatorios, ningún campo vacío o nulo.  
- Somos 2 personas, son 2 adultos. Siempre.
=======================
1. INTERPRETACIÓN ROBUSTA DE PASAJEROS
=======================

🧠 Tu tarea es detectar con precisión cuántas personas viajan, clasificadas como:
- adults (12 años o más)
- children (de 2 a 11 años)
- infants (menores de 2 años)

✈️ CLAVES:
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

IMPORTANTE:  
- Cada vez que se mencione "mi esposa", "mi marido", "mi pareja", "mi mujer", etc., sumá 1 adulto adicional.  
- Nunca devolvés valores cero para adultos si el mensaje indica "me quiero ir" o frases similares; al menos 1 adulto siempre debe estar presente.  
- No devuelvas arrays ni listas: SOLO un único objeto JSON con los campos requeridos.  
- Si se mencionan “mis hijos”, “los chicos”, “mis nenes” y **no hay edad explícita**, asumí que son `children` (entre 3 y 11 años).
- Nunca asumas que un hijo es adulto a menos que se indique su edad (mayor a 12) o se diga explícitamente que es adolescente o mayor.
- 🔒 Si no se especifica edad, asumí por defecto que los “hijos”, “nenes”, “chicos”, etc. tienen entre 3 y 11 años → contalos como children.
❌ Nunca interpretes que un hijo es adult a menos que:

se indique una edad mayor a 12

se diga explícitamente que es adolescente, mayor o tiene más de 12 años

👤 Ejemplos:

| Mensaje                                                            | adults | children | infants |
| ------------------------------------------------------------------ | ------ | -------- | ------- |
| "viajo con mi esposa y mis 2 hijos"                                | 2      | 2        | 0       |
| "yo, mi mamá y mis dos hijos, uno es menor y otro de 23"           | 3      | 1        | 0       |
| "nos vamos mi señora, mi hijo de 10 y el bebé"                     | 2      | 1        | 1       |
| "viajamos mi hija de 14 y yo"                                      | 2      | 0        | 0       |
| "voy con mi esposa, mi hijo de 2 años y el bebé"                   | 2      | 1        | 1       |
| "me voy solo"                                                      | 1      | 0        | 0       |
| "me quiero ir ..."                                                 | 1      | 0        | 0       |
| "me quiero ir con mi esposa"                                       | 2      | 0        | 0       |
| "me quiero ir con mi hijo"                                         | 1      | 1        | 0       |
| "me quiero ir con mi hijo de 22"                                   | 2      | 0        | 0       |
| "me quiero ir con mi hijo de 22 y mi mamá"                         | 3      | 0        | 0       |
| "quiero un viaje para 2 mayores y un menor"                        | 2      | 1        | 0       |
| "quiero ir a cancun 2 semanas"                                     | 1      | 0        | 0       |
| "me quiero ir con mi mujer y 2 hijos"                              | 2      | 2        | 0       |
| "me quiero ir con mi mujer y 2 hijos, uno de 3 y otro de 10"       | 2      | 1        | 1       |
| "me quiero ir con mi mamá y mi esposa"                             | 3      | 0        | 0       |
| "viajamos con mi esposa, nuestros 3 hijos y el bebé"               | 2      | 3        | 1       |
| "somos 4 adultos, 2 chicos y un bebé"                              | 4      | 2        | 1       |
| "vamos mi pareja, mis dos hijos de 5 y 8 años"                     | 2      | 2        | 0       |
| "voy con mis hijos, uno de 1 año y otro de 12"                     | 2      | 0        | 1       |
| "vamos 2 adultos y un nene de 7"                                   | 2      | 1        | 0       |
| "yo, mi hermana y nuestras 3 hijas"                                | 2      | 3        | 0       |
| "mi esposa, yo, mi hija de 6 y mi bebé de 6 meses"                 | 2      | 1        | 1       |
| "nos vamos con mi pareja y nuestros dos nenes de 4 y 6"            | 2      | 2        | 0       |
| "viajo con mi esposa y mi hijo de 1 año y medio"                   | 2      | 0        | 1       |
| "somos dos adultos, un chico de 10 y una nena de 8"                | 2      | 2        | 0       |
| "me quiero ir con mi novia y su hijo de 5 años"                    | 2      | 1        | 0       |
| "viajamos yo, mi mujer, nuestro hijo de 2 y nuestra beba"          | 2      | 1        | 1       |
| "voy con mis tres hijos, dos son chicos y uno es bebé"             | 1      | 2        | 1       |
| "vamos 3 adultos y una nena de 9"                                  | 3      | 1        | 0       |
| "nos vamos 2 adultos con gemelos de 3 años"                        | 2      | 2        | 0       |
| "viajamos mi esposo, yo y nuestros mellizos bebés"                 | 2      | 0        | 2       |
| "soy yo con mi hija de 11 y mi hijo de 13"                         | 2      | 1        | 0       |
| "voy con mi papá y mi hijo de 4 años"                              | 2      | 1        | 0       |
| "viajo con mi hermana, mi cuñado y su hijo de 6"                   | 3      | 1        | 0       |
| "me quiero ir con mi esposa, mis dos hijos adolescentes y la beba" | 2      | 2        | 1       |
| "vamos 2 adultos y un hijo de 2 años y otro de 1"                  | 2      | 1        | 1       |
| "mi mujer, mi hija de 10, mi hijo de 7 y yo"                       | 2      | 2        | 0       |
| "yo y mis dos hijos: uno de 15 y el otro de 10"                    | 2      | 1        | 0       |
| "yo, mi pareja, su hijo de 4 y el mío de 6"                        | 2      | 2        | 0       |
| "me voy con mi abuela y mi hija de 5"                              | 2      | 1        | 0       |
| "viajamos dos mamás con tres chicos y un bebé"                     | 2      | 3        | 1       |
| "yo, mi esposa y nuestra hija recién nacida"                       | 2      | 0        | 1       |
----------------------------------------------------------------------------------------------------
Ejemplo 1:  
Mensaje: "me quiero ir con mi esposa y mis 2 hijos 7 noches en septiembre a cancun"  
Respuesta:  
{{  
  "origenVuelta": "cancun",  
  "adults": 2,  
  "children": 2,  
  "infants": 0  
}}

Ejemplo 2:
Mensaje: "viajo solo a madrid la próxima semana"
Respuesta:
{{
  "origenVuelta": "madrid",
  "adults": 1,
  "children": 0,
  "infants": 0
}}

Ejemplo 3
Mensaje:"voy con mi marido y nuestros dos hijos a barcelona"
Respuesta JSON:
{{
  "origenVuelta": "barcelona",
  "adults": 2,
  "children": 2,
  "infants": 0
}}

Ejemplo 4
Mensaje:"quiero viajar con mi pareja y mi bebé a cancún"
Respuesta JSON:
{{
  "origenVuelta": "cancún",
  "adults": 2,
  "children": 0,
  "infants": 1
}}

Ejemplo 5
Mensaje:"nos vamos con mi esposa, mi mamá y mis dos hijos a roma"
Respuesta JSON:
{{
  "origenVuelta": "roma",
  "adults": 3,
  "children": 2,
  "infants": 0
}}

Ejemplo 6
Mensaje: "viajo con mis tres hijos, dos chicos y un bebé, destino cancun"
Respuesta JSON:
{{
  "origenVuelta": "cancun",
  "adults": 1,
  "children": 2,
  "infants": 1
}}

------------
Para determinar el origenVuelta:
Tenes que interpretar el lugar donde quiere ir el cliente segun el mensaje, puede ser madrid, Cancun, o lo que sea tenes que ver el destino y rempazarlo en 'origenVuelta' del objeto final

Solo devolver un único objeto JSON, sin texto adicional ni explicaciones.

MENSAJE DEL CLIENTE:
{mensaje}


"""

    res = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt2}],
            max_tokens=3000
        )


    content = res.choices[0].message.content
    try:
       limpio = limpiar_json(content)
       params = json.loads(limpio)
    except Exception as e:
        print("Error al parsear parámetros:", e)
        params = {}

    return params

def fusionar_resultados(fechas, parametros):
    resultado_semifinal = []
    if not fechas or not parametros:
        return fechas  # retorno vacío si falló algo antes

    # Si parametros no es lista, lo transformo a lista para evitar errores
    if not isinstance(parametros, list):
        parametros = [parametros]

    for fecha in fechas:
        for param in parametros:
            combinado = param.copy()  # copio el dict para no modificar el original
            combinado['departureDate'] = fecha['departureDate']
            combinado['returnDate'] = fecha['returnDate']
            resultado_semifinal.append(combinado)

    return resultado_semifinal


def obtener_codigos_iata_lista(destinos):
    if not isinstance(destinos, list):
        print("Error: Se esperaba una lista de objetos destino.")
        return destinos

    try:
        with open("data/codigoIATA.json", "r", encoding="utf-8") as f:
            destinos_data = json.load(f)
    except Exception as e:
        print(f"Error cargando {f}: {e}")
        return destinos

    ciudades = [d["ciudad"].lower().strip() for d in destinos_data]

    for destino_obj in destinos:
        if not isinstance(destino_obj, dict):
            continue

        destino_usuario = destino_obj.get("origenVuelta", "").lower().strip()
        if not destino_usuario:
            continue

        mejor_coincidencia = process.extractOne(
            destino_usuario,
            ciudades,
            scorer=fuzz.WRatio
        )

        if mejor_coincidencia:
            ciudad_match, score, _ = mejor_coincidencia
            if score >= 70:
                for d in destinos_data:
                    if d["ciudad"].lower().strip() == ciudad_match:
                        destino_obj["origenVuelta"] = d["codigoIATA"]
                        break
            else:
                print(f"No coincidencia confiable para '{destino_usuario}' (score={score})")
        else:
            print(f"No se encontró ninguna coincidencia para '{destino_usuario}'")

    return destinos


def cargar_destinos():
    with open("data/destinos.json", "r", encoding="utf-8") as f:
        destinos = json.load(f)
    # Devolvemos un diccionario con clave origenVuelta para buscar fácil después
    return { destino["origenVuelta"]: destino for destino in destinos }

def completar_objetos_finales(lista_vuelos):
    # Acá ya no va hardcodeado, lo cargamos dinámicamente
    tabla_destinos = cargar_destinos()

    resultado_final = []

    for vuelo in lista_vuelos:
        origen = vuelo.get("origenVuelta", "")

        datos_destino = tabla_destinos.get(origen, {
            "maxDuracionIda": "",
            "maxDuracionVuelta": "",
            "horarioIdaEntre": "",
            "horarioIdaHasta": "",
            "horarioVueltaEntre": "",
            "horarioVueltaHasta": "",
            "stops": ""
        })

        vuelo_completo = {
            "mail": "franco@melincue.tur.ar",
            "password": "Francomase12!",
            "origenIda": "BUE",
            "origenVuelta": origen,
            "departureDate": vuelo.get("departureDate", ""),
            "returnDate": vuelo.get("returnDate", ""),
            "adults": vuelo.get("adults", 0),
            "children": vuelo.get("children", 0),
            "infants": vuelo.get("infants", 0),
            "currency": "USD",
            "checkedBaggage": False,
            "maxDuracionIda": datos_destino.get("maxDuracionIda", ""),
            "maxDuracionVuelta": datos_destino.get("maxDuracionVuelta", ""),
            "horarioIdaEntre": datos_destino.get("horarioIdaEntre", ""),
            "horarioIdaHasta": datos_destino.get("horarioIdaHasta", ""),
            "horarioVueltaEntre": datos_destino.get("horarioVueltaEntre", ""),
            "horarioVueltaHasta": datos_destino.get("horarioVueltaHasta", ""),
            "stops": datos_destino.get("stops", "")
        }

        resultado_final.append(vuelo_completo)

    return resultado_final


def limpiar_json(content):
    """
    Limpia el contenido de Ollama para dejar solo el JSON puro.
    """
    # Si viene envuelto en ```json ... ```
    content = re.sub(r"```json", "", content, flags=re.IGNORECASE)
    content = content.replace("```", "")
    
    # Sacar espacios y saltos innecesarios
    content = content.strip()
    
    return content



if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Error: falta el mensaje como argumento.")
        sys.exit(1)

    mensaje = sys.argv[1]
    fechas, parametros = generar_ambas_llamadas(mensaje)
    resultado = fusionar_resultados(fechas, parametros)
    destinoFinal =obtener_codigos_iata_lista(resultado)
    resultadoFinal = completar_objetos_finales(destinoFinal)
    print(json.dumps(resultadoFinal, indent=2, ensure_ascii=False))