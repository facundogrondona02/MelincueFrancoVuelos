import sys
import json
import ollama
import json
import re
import os
from rapidfuzz import process, fuzz



def generar_multi_busqueda(mensaje):
    with open('IA/ejemplos_multi.json', 'r', encoding='utf-8') as f:
        ejemplos_json = json.load(f)

    prompt = f"""
⚠️ SOS UNA IA EXPERTA EN INTERPRETACIÓN DE FECHAS DE VIAJE DESDE LENGUAJE NATURAL EN ESPAÑOL.  Me voy con mi mujer y dos hijos a cancun entre el 8 y 11  hasta el 25 noviembre 
NO SOS UN CHATBOT, NO RESPONDÉS CON TEXTO, NO PROGRAMÁS, NO ACLARÁS NADA. SOLO TRANSFORMÁS.

TU ÚNICA FUNCIÓN es transformar un mensaje de una persona en un ARRAY JSON válido y NO VACÍO que contenga fechas posibles de salida y regreso, en el siguiente formato ESTRICTO:

[
  {{"departureDate": "DDMMM", "returnDate": "DDMMM"}},
  ...
]

PRIMERO INTERPRETAS EL MENSAJE DEL CLIENTE Y ANALIZA QUE PUNTO DE LOS SIGUIENTES CUMPLE Y UTILIZAS SU LOGICA
---

### LÓGICA FUNDAMENTAL QUE TENÉS QUE ENTENDER:
8️⃣⚠️CLAVE: Si El mensaje no menciona fechas específicas solamente una duración de estadía, 
→ DEBÉS asumir que la persona quiere viajar en cualquier fecha del mes indicado,
 Si el mensaje menciona algo como:
“me quiero ir 7 noches en septiembre”

“cualquier fecha de octubre, 10 noches”
...y NO hay fechas puntuales ni rangos específicos,

→ DEBÉS generar 5 combinaciones distribuidas uniformemente a lo largo del mes indicado, respetando la duración expresada  
(📌 Ej: 7 noches = 7 días, 10 noches = 10 días, etc.)

⚠️ No debés generar una secuencia corrida de días. Solo 5 combinaciones, **espaciadas y distribuidas a lo largo del mes** para cubrir distintas semanas posibles.

📌 Ejemplo:
Mensaje: “queremos viajar cualquier fecha de septiembre 7 noches a punta cana”
→ Respuesta esperada:
[
  {{"departureDate": "04SEP", "returnDate": "11SEP"}},
  {{"departureDate": "08SEP", "returnDate": "15SEP"}},
  {{"departureDate": "13SEP", "returnDate": "20SEP"}},
  {{"departureDate": "18SEP", "returnDate": "25SEP"}},
  {{"departureDate": "23SEP", "returnDate": "30SEP"}}
]
------
⚠️ REGLA CRÍTICA PARA VIAJES EN "CUALQUIER FECHA" DEL MES:
Si el mensaje dice algo como “cualquier fecha de [mes], [X] noches” o “nos queremos ir en cualquier momento de [mes]”,
⚠️ DEBÉS generar exactamente 5 combinaciones, bien distribuidas en semanas distintas del mes.

❌ NO GENERES fechas seguidas como 01, 02, 03, 04, 05…
✅ SÍ GENERÁS opciones como:
[
  {{"departureDate": "03SEP", "returnDate": "10SEP"}},
  {{"departureDate": "08SEP", "returnDate": "15SEP"}},
  {{"departureDate": "13SEP", "returnDate": "20SEP"}},
  {{"departureDate": "18SEP", "returnDate": "25SEP"}},
  {{"departureDate": "23SEP", "returnDate": "30SEP"}}
]
------
⚠️ Si el mensaje contiene únicamente una duración (como "7 noches en enero", "10 noches en septiembre") sin fechas específicas ni rangos:
- DEBÉS generar **exactamente 5 combinaciones distintas de ida y vuelta**.
- **Cada salida debe estar espaciada al menos 4 o 5 días de la anterior.**
- Las fechas deben estar **distribuidas equitativamente a lo largo del mes** (no todas en la misma semana).
- No generes fechas corridas día por día.  

✅ Ejemplo correcto para “7 noches en enero”:
[
  {{"departureDate": "03JAN", "returnDate": "10JAN"}},
  {{"departureDate": "08JAN", "returnDate": "15JAN"}},
  {{"departureDate": "13JAN", "returnDate": "20JAN"}},
  {{"departureDate": "18JAN", "returnDate": "25JAN"}},
  {{"departureDate": "23JAN", "returnDate": "30JAN"}}
]


1️⃣ **Detectar todas las fechas de salida posibles** (departureDate) expresadas en el mensaje.  
   - Pueden ser días puntuales (ej: "el 4 de septiembre", "2 o 3 de agosto").  
   - Pueden ser rangos de días (ej: "entre el 10 y el 15 de julio").  
   - Pueden ser semanas o quincenas ("primera quincena de marzo", "segunda semana de mayo").  
   - Pueden ser expresiones genéricas de tiempo ("principios de agosto", "últimos días de enero").

2️⃣ **Detectar fechas de regreso posibles** (returnDate).

   Existen DOS ESCENARIOS POSIBLES:

   ▶️ CASO A: Fecha de regreso explícita
   - Si el mensaje menciona directamente una fecha de regreso, usando expresiones como:  
     "hasta el 25", "vuelvo el 10", "regreso el 3 de octubre", "vuelvo el domingo 24", etc.  
   - En ese caso, la fecha de regreso (returnDate) es FIJA y debe mantenerse igual en todos los objetos,  
     independientemente de cuántas fechas de salida haya.

   ✅ EJEMPLO:
   "puedo salir entre el 8 y el 11 de noviembre y vuelvo el 25"  
   → returnDate fijo: "25NOV"  
   → Resultado:
   [
     {{"departureDate": "08NOV", "returnDate": "25NOV"}},
     {{"departureDate": "09NOV", "returnDate": "25NOV"}},
     {{"departureDate": "10NOV", "returnDate": "25NOV"}},
     {{"departureDate": "11NOV", "returnDate": "25NOV"}}
   ]

   ⚠️ En este caso NO debe sumarse una duración ficticia. La fecha indicada prevalece.

   ▶️ CASO B: No hay fecha de regreso explícita, pero sí duración
   - Si el mensaje indica una duración (ej: "2 semanas", "10 días", "una semana y media") pero no una fecha exacta de vuelta,
     entonces el returnDate debe calcularse de forma dinámica y VARIABLE para cada fecha de salida.
   - Es decir, a cada departureDate se le suma la cantidad de días especificada para obtener un returnDate diferente por salida.

   ✅ EJEMPLO:
   "puedo salir entre el 15 y el 20 de septiembre y me quedo 2 semanas"  
   → Generar un returnDate para cada departureDate, sumando 14 días:
   [
     {{"departureDate": "15SEP", "returnDate": "29SEP"}},
     {{"departureDate": "16SEP", "returnDate": "30SEP"}},
     {{"departureDate": "17SEP", "returnDate": "01OCT"}},
     ...
   ]


3️⃣ **Si la suma de días para la fecha de regreso supera el límite del mes de salida, DEBÉS calcular correctamente la fecha que corresponde en el siguiente mes.**  
   - Por ejemplo, salir el 20SEP y quedarse 14 días → volver el 04OCT.  
   - Esta suma debe considerar la duración variable de cada mes y no generar fechas inválidas.

4️⃣ **Generar un objeto para cada combinación posible de salida y regreso** según lo que el mensaje sugiere o implica.  
   - Por ejemplo, si hay dos días de salida posibles y un rango de días de regreso, generá todas las combinaciones posibles.  
   - Siempre asegurate que las fechas sean válidas y no generes fechas fuera de calendario (ej: no 31FEB).

5️⃣ **Formato estricto y exacto**:  
   - Día con dos dígitos (01 a 31).  
   - Mes en inglés y en MAYÚSCULAS: JAN, FEB, MAR, APR, MAY, JUN, JUL, AUG, SEP, OCT, NOV, DEC.  
   - La respuesta debe ser SOLO el array JSON puro, sin texto, sin markdown, sin explicaciones, sin comillas extras ni caracteres adicionales.

6️⃣ **Nunca devolvés un array vacío.**  
   - Si no encontrás fechas claras, hacé un esfuerzo para interpretar el mensaje y generar al menos una opción plausible basada en duración o lógica.  
   - El objetivo es siempre devolver fechas válidas y consistentes.

7️⃣ **No inventar meses o fechas.**  
   - Si no se especifica mes o es ambiguo, NO adivinar.  
   - Solo procesar y devolver fechas que estén claras en el mensaje o que puedan inferirse razonablemente.


⚠️ CLAVE:  
Si el mensaje menciona explícitamente la fecha de regreso (ej: "hasta el 25", "vuelvo el 10 de agosto"),  
esa fecha debe usarse como valor fijo de `returnDate` en **todos** los objetos generados, sin excepción.

Solo cuando NO haya una fecha explícita, y haya una duración de estadía,  
el `returnDate` debe calcularse sumando los días correspondientes a cada `departureDate`.

NO mezclar lógicas ni hacer ambas a la vez. Detectá bien el caso y aplicá solo una:

✅ Si hay fecha explícita de vuelta → returnDate fijo para todas las fechas de salida.  
✅ Si NO hay fecha de regreso pero sí duración → returnDate se calcula por suma, individualmente.

Nunca uses los dos criterios al mismo tiempo.

---

### EJEMPLOS DETALLADOS:

Ejemplo 1:  
Mensaje: "quiero ir a miami 2 semanas y puedo salir el 4 o 5 de septiembre"  
Respuesta:  
[  
  {{"departureDate": "04SEP", "returnDate": "18SEP"}},  
  {{"departureDate": "05SEP", "returnDate": "19SEP"}}  
]

Ejemplo 2:  
Mensaje: "puedo salir entre el 10 y el 12 de julio y volver el 20"  
Respuesta:  
[  
  {{"departureDate": "10JUL", "returnDate": "20JUL"}},  
  {{"departureDate": "11JUL", "returnDate": "20JUL"}},  
  {{"departureDate": "12JUL", "returnDate": "20JUL"}}  
]

Ejemplo 3:  
Mensaje: "salgo la primera quincena de marzo y me quedo 10 días"  
Respuesta:  
[  
  {{"departureDate": "01MAR", "returnDate": "11MAR"}},  
  {{"departureDate": "02MAR", "returnDate": "12MAR"}},  
  ...  
  {{"departureDate": "15MAR", "returnDate": "25MAR"}}  
]

Ejemplo 4:  
Mensaje: "solo puedo salir el 15 de agosto"  
Respuesta:  
[  
  {{"departureDate": "15AUG", "returnDate": "22AUG"}}  
]

Ejemplo 5:  
Mensaje: "entre el 20 y el 22 de septiembre y quiero quedarme dos semanas"  
Respuesta:  
[  
  {{"departureDate": "20SEP", "returnDate": "04OCT"}},  
  {{"departureDate": "21SEP", "returnDate": "05OCT"}},  
  {{"departureDate": "22SEP", "returnDate": "06OCT"}}  
]

Ejemplo 6:  
Mensaje: "entre el 5 y el 8 de octubre o el 12, vuelvo el 20"  
Respuesta:  
[  
  {{"departureDate": "05OCT", "returnDate": "20OCT"}},  
  {{"departureDate": "06OCT", "returnDate": "20OCT"}},  
  {{"departureDate": "07OCT", "returnDate": "20OCT"}},  
  {{"departureDate": "08OCT", "returnDate": "20OCT"}},  
  {{"departureDate": "12OCT", "returnDate": "20OCT"}}  
]

Ejemplo 7:  
Mensaje: "me gustaría salir principios de noviembre y quedarme dos semanas"  
Respuesta:  
[  
  {{"departureDate": "01NOV", "returnDate": "15NOV"}},  
  {{"departureDate": "02NOV", "returnDate": "16NOV"}},  
  {{"departureDate": "03NOV", "returnDate": "17NOV"}},  
  {{"departureDate": "04NOV", "returnDate": "18NOV"}},  
  {{"departureDate": "05NOV", "returnDate": "19NOV"}}  
]

Ejemplo 8:
Mensaje: “nos queremos ir en cualquier fecha de octubre, 10 noches a punta cana”
Respuesta:
[
  {{"departureDate": "02OCT", "returnDate": "12OCT"}},
  {{"departureDate": "08OCT", "returnDate": "18OCT"}},
  {{"departureDate": "14OCT", "returnDate": "24OCT"}},
  {{"departureDate": "20OCT", "returnDate": "30OCT"}},
  {{"departureDate": "25OCT", "returnDate": "04NOV"}}
]


Ejemplo 9:
Mensaje: “cualquier fecha de enero 5 noches a cancun”
Respuesta:
[
  {{"departureDate": "03JAN", "returnDate": "08JAN"}},
  {{"departureDate": "08JAN", "returnDate": "13JAN"}},
  {{"departureDate": "13JAN", "returnDate": "18JAN"}},
  {{"departureDate": "18JAN", "returnDate": "23JAN"}},
  {{"departureDate": "23JAN", "returnDate": "28JAN"}}
]

Ejemplo 10:
Mensaje: “cualquier fecha de septiembre, 7 noches”
Respuesta:
[
  {{"departureDate": "03SEP", "returnDate": "10SEP"}},
  {{"departureDate": "08SEP", "returnDate": "15SEP"}},
  {{"departureDate": "13SEP", "returnDate": "20SEP"}},
  {{"departureDate": "18SEP", "returnDate": "25SEP"}},
  {{"departureDate": "23SEP", "returnDate": "30SEP"}}
]

Ejemplo 11:
Mensaje: “nos queremos ir a fines de agosto, 10 noches”
Respuesta:
[
  {{"departureDate": "20AUG", "returnDate": "30AUG"}},
  {{"departureDate": "23AUG", "returnDate": "02SEP"}},
  {{"departureDate": "25AUG", "returnDate": "04SEP"}},
  {{"departureDate": "27AUG", "returnDate": "06SEP"}},
  {{"departureDate": "29AUG", "returnDate": "08SEP"}}
]
---

### NOTAS IMPORTANTES:  
- "una semana" = 7 días  
- "7 noches" = 7 días
- "10 noches" = 10 días
- "dos semanas" = 14 días  
- Si hay varias fechas de salida y un rango de regreso, generá la combinación completa.  
- Si la duración no está explícita y no hay fecha de regreso, asumí 7 días.  
- Si la fecha de regreso es anterior a la salida, descartá esa combinación.  
- No agregar texto extra, solo el array JSON válido con doble llave en los objetos.

---
###################

Sos una IA que recibe mensajes en español y debe devolver solo un único objeto JSON con las siguientes claves exactas:

- origenVuelta: lugar de destino, puede ser un ciudad o pais
- adults: cantidad de adultos (mayores de 12 años)
- children: cantidad de niños (3 a 11 años)
- infants: cantidad de bebés menores de 3 años


Reglas:

IMPORTANTE:  
- Siempre cuenta como 1 adulto la persona que envía el mensaje, aunque no lo diga explícitamente.  
- Cada vez que se mencione "mi esposa", "mi marido", "mi pareja", "mi mujer", etc., sumá 1 adulto adicional.  
- Nunca devolvés valores cero para adultos si el mensaje indica "me quiero ir" o frases similares; al menos 1 adulto siempre debe estar presente.  
- No devuelvas arrays ni listas: SOLO un único objeto JSON con los campos requeridos.  
- Si no detectás destino, origenVuelta queda vacío, pero no dejes campos vacíos ni con ceros que no correspondan a la lógica.  
- Inferí la cantidad de pasajeros con sentido común, incluso sin números explícitos.

- La persona que escribe viaja (1 adulto) salvo que se indique otra cosa.  
- Frases como "mi esposa", "mi marido", "mi pareja", "mi amigo","mi mujer", etc., suman 1 adulto cada una.  
- Menciones de “mi hijo”, “mis hijos”, “los nenes”, “mi bebé” indican niños o infantes según contexto.  
- Inferí cantidades aunque no haya números exactos, con sentido común.  
- Si no detectás ciudad destino o pasajeros, usar valores por defecto (1 adulto y origenVuelta vacío).  
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

IMPORTANTE:  
- Siempre cuenta como 1 adulto la persona que envía el mensaje, aunque no lo diga explícitamente.  
- Cada vez que se mencione "mi esposa", "mi marido", "mi pareja", "mi mujer", etc., sumá 1 adulto adicional.  
- Nunca devolvés valores cero para adultos si el mensaje indica "me quiero ir" o frases similares; al menos 1 adulto siempre debe estar presente.  
- No devuelvas arrays ni listas: SOLO un único objeto JSON con los campos requeridos.  
- Si no detectás destino, origenVuelta queda vacío, pero no dejes campos vacíos ni con ceros que no correspondan a la lógica.  
- Inferí la cantidad de pasajeros con sentido común, incluso sin números explícitos.

👤 Ejemplos:

| Mensaje                                                            | adults | children | infants |
| ------------------------------------------------------------------ | ------ | -------- | ------- |
| "viajo con mi esposa y mis 2 hijos"                                | 2      | 2        | 0       |
| "yo, mi mamá y mis dos hijos, uno es menor y otro de 23"           | 3      | 1        | 0       |
| "nos vamos mi señora, mi hijo de 10 y el bebé"                     | 2      | 1        | 1       |
| "viajamos mi hija de 14 y yo"                                      | 2      | 0        | 0       |
| "voy con mi esposa, mi hijo de 2 años y el bebé"                   | 2      | 1        | 1       |
| "me voy solo"                                                      | 1      | 0        | 0       |
| "me quiero ir"                                                     | 1      | 0        | 0       |
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
Mensaje: "me quiero ir con mi esposa 7 noches en septiembre a cancun"  
Respuesta:  
{{  
  "origenVuelta": "cancun",  
  "adults": 2,  
  "children": 0,  
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



Junta los dos Json que creaste en uno solo, el primero con las fechas y el segundo con los pasajeros, y devolvelo como un array de objetos JSON.
### MENSAJE A PROCESAR:

"{mensaje}"

    """

    response = ollama.chat(
        model="llama3.2",
        messages=[{"role": "user", "content": prompt}],
        options={"temperature": 0}
    )
    content = response["message"]["content"]

    try:
        limpio = limpiar_json(content)  # asumí que limpia el string para obtener JSON válido
        fechas = json.loads(limpio)     # antes usabas json.loads(content) directamente, que fallaba
        if not fechas:
            raise ValueError("Array vacío")
    except Exception as e:
        print(f"Error parseando JSON: {e}")
        fechas = []  # devolver un array vacío o un fallback válido
    return fechas

def obtener_codigos_iata_lista(destinos, ruta_json="data/codigoIATA.json"):
    if not isinstance(destinos, list):
        print("Error: Se esperaba una lista de objetos destino.")
        return destinos

    try:
        with open(ruta_json, "r", encoding="utf-8") as f:
            destinos_data = json.load(f)
    except Exception as e:
        print(f"Error cargando {ruta_json}: {e}")
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
    ruta_archivo = r'C:\Users\facun\FrancoMonolitico\vuelos-front\data\destinos.json'
    with open(ruta_archivo, 'r') as f:
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
    todo = generar_multi_busqueda(mensaje)
    # parametros = generar_todo_lo_demas(mensaje)
    destinoFinal = obtener_codigos_iata_lista(todo)
    resultadoFinal = completar_objetos_finales(destinoFinal)
    print(json.dumps(resultadoFinal, indent=2, ensure_ascii=False))