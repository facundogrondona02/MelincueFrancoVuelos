import sys
import io
import json
from collections import defaultdict # Para agrupar vuelos
import traceback # Importar traceback para imprimir la pila de llamadas
# from openai import OpenAI
import os
import openai
openai.api_key = os.getenv("OPENAI_API_KEY")


# Configurar la salida estándar para UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def generar_texto_pasajeros(adults, children, infants):
    partes = []
    if adults == 1:
        partes.append("1 adulto")
    else:
        partes.append(f"{adults} adultos")
    if children == 1:
        partes.append("1 menor")
    elif children > 1:
        partes.append(f"{children} menores")
    if infants == 1:
        partes.append("1 infante")
    elif infants > 1:
        partes.append(f"{infants} infantes")
    return "Cotización de viaje para " + " y ".join(partes) + "."

def formatear_vuelo(v, is_grouped=False):
    fechas_disponibles_str = ""
    if is_grouped and 'fechas_alternativas_ida' in v and 'fechas_alternativas_vuelta' in v:
        # Asegurarse de que las fechas estén ordenadas al unirlas
        fechas_ida = ", ".join(sorted(list(v['fechas_alternativas_ida'])))
        fechas_vuelta = ", ".join(sorted(list(v['fechas_alternativas_vuelta'])))
        fechas_disponibles_str = f"\nFechas de salida disponibles: {fechas_ida}\nFechas de regreso disponibles: {fechas_vuelta}"
        
    # --- Construcción de la línea de escala para IDA ---
    escala_ida_line = ""
    # Se considera escala si escalasIda no es "Non Stop", "N/A" o "0 escalas"
    if v.get('escalasIda') and v.get('escalasIda') not in ['Non Stop', 'N/A', '0 escalas']:
        horario_llegada_ida_escala = v.get('horarioLlegadaIdaEscala', 'N/A')
        fecha_llegada_ida_escala = v.get('fechaLlegadaIdaEscala', 'N/A')
        horario_salida_ida_escala = v.get('horarioSalidaIdaEscala', 'N/A')
        fecha_salida_ida_escala = v.get('fechaSalidaIdaEscala', 'N/A')
        
        escala_ida_line = (
            f"Escala: {horario_llegada_ida_escala} -> {fecha_llegada_ida_escala} "
            f"|| {horario_salida_ida_escala} -> {fecha_salida_ida_escala}"
        )
        # Agrega la ubicación de la escala si está en 'escalasIda' (ej. "1 escalas (LIM)")
        if '(' in v.get('escalasIda', ''):
            escala_location_ida = v['escalasIda'].split('(')[1].replace(')', '').strip()
            escala_ida_line += f" ({escala_location_ida})"
        escala_ida_line = f"    {escala_ida_line}\n" # Añadir indentación y salto de línea


    # --- Construcción de la línea de escala para VUELTA ---
    escala_vuelta_line = ""
    # Se considera escala si escalasVuelta no es "Non Stop", "N/A" o "0 escalas"
    if v.get('escalasVuelta') and v.get('escalasVuelta') not in ['Non Stop', 'N/A', '0 escalas']:
        horario_llegada_vuelta_escala = v.get('horarioLlegadaVueltaEscala', 'N/A')
        fecha_llegada_vuelta_escala = v.get('fechaLlegadaVueltaEscala', 'N/A')
        horario_salida_vuelta_escala = v.get('horarioSalidaVueltaEscala', 'N/A')
        fecha_salida_vuelta_escala = v.get('fechaSalidaVueltaEscala', 'N/A')
        
        escala_vuelta_line = (
            f"Escala: {horario_llegada_vuelta_escala} -> {fecha_llegada_vuelta_escala} "
            f"|| {horario_salida_vuelta_escala} -> {fecha_salida_vuelta_escala}"
        )
        # Agrega la ubicación de la escala si está en 'escalasVuelta' (ej. "1 escalas (LIM)")
        if '(' in v.get('escalasVuelta', ''):
            escala_location_vuelta = v['escalasVuelta'].split('(')[1].replace(')', '').strip()
            escala_vuelta_line += f" ({escala_location_vuelta})"
        escala_vuelta_line = f"    {escala_vuelta_line}\n" # Añadir indentación y salto de línea


    # Formatear el precioFinal de nuevo a string con coma decimal para la salida
    # Reemplaza '.' por 'X' temporalmente, luego ',' por '.', luego 'X' por ','
    # Esto convierte 1234.56 a 1.234,56
    precio_final_str = f"{v.get('precioFinal', 0.0):,.2f}".replace('.', 'X').replace(',', '.').replace('X', ',')

    return f"""✈️ Aéreo de {v.get('aerolinea', 'N/A')} con equipaje de mano de 10kg + bolso de mano.

Horarios:

ida:
    Salida:  {v.get('aeropuertoIda', 'N/A')} {v.get('horarioSalidaIda', 'N/A')} | {v.get('fechaSalidaIda', 'N/A')}
    {escala_ida_line.strip()}
    Llegada: {v.get('aeropuertoDestinoIda', 'N/A')} {v.get('horarioLlegadaIda', 'N/A')} | {v.get('fechaLlegadaIda', 'N/A')}
    (Duración: {v.get('horarioSupongoDuracionIda', 'N/A')}) || {v.get('escalasIda', 'N/A')}

vuelta:
    Salida:  {v.get('aeropuertoVuelta', 'N/A')} {v.get('horarioSalidaVuelta', 'N/A')} | {v.get('fechaSalidaVuelta', 'N/A')}
    {escala_vuelta_line.strip()}
    Llegada: {v.get('aeropuertoDestinoVuelta', 'N/A')} {v.get('horarioLlegadaVuelta', 'N/A')} | {v.get('fechaLlegadaVuelta', 'N/A')}
    (Duración: {v.get('horarioSupongoDuracionVuelta', 'N/A')}) || {v.get('escalasVuelta', 'N/A')}

💰 Precio final: {precio_final_str} USD{fechas_disponibles_str}
"""

def generar_respuesta(mensaje):
    try:
        if isinstance(mensaje, str):
            vuelos = json.loads(mensaje)
        else:
            print("Error: El mensaje recibido no es un string.")
            return
    except json.JSONDecodeError as e:
        print(f"Error: el mensaje no es un JSON válido. Detalles: {e}")
        print(f"Mensaje recibido (primeros 500 chars): {mensaje[:500]}...")
        return

    if not isinstance(vuelos, list) or not vuelos:
        print("Error: No se encontró una lista válida de vuelos o la lista está vacía.")
        return

    try: # Bloque try-except general para la lógica principal
        # --- INICIO DE LA LÓGICA DE PRE-PROCESAMIENTO Y AGRUPACIÓN ---
        # Limpiar y convertir precioFinal a float para ordenar
        for vuelo in vuelos:
            if 'precioFinal' in vuelo and isinstance(vuelo['precioFinal'], str):
                cleaned_price = vuelo['precioFinal'].replace('.', '').replace(',', '.')
                try:
                    vuelo['precioFinal'] = float(cleaned_price)
                except ValueError:
                    print(f"Advertencia: No se pudo convertir '{vuelo['precioFinal']}' a float. Asignando un valor alto para ordenamiento.")
                    vuelo['precioFinal'] = float('inf') 

        # Función auxiliar para convertir duración a minutos para un ordenamiento numérico
        def parse_duration_to_minutes(duration_str):
            if not duration_str:
                return float('inf')
            if 'h' in duration_str and 'm' in duration_str:
                try:
                    parts = duration_str.replace('h', '').replace('m', '').strip().split()
                    if len(parts) == 2:
                        return int(parts[0]) * 60 + int(parts[1])
                except ValueError:
                    pass
            if ':' in duration_str:
                try:
                    parts = duration_str.split(':')
                    if len(parts) == 2:
                        return int(parts[0]) * 60 + int(parts[1])
                except ValueError:
                    pass
            return float('inf')

        # Agrupar vuelos por sus características principales (ignorando las fechas por ahora)
        vuelos_agrupados = defaultdict(lambda: {
            'count': 0,
            'representative_vuelo': None,
            'fechas_alternativas_ida': set(),
            'fechas_alternativas_vuelta': set()
        })

        for vuelo in vuelos:
            # Crea una tupla con las características clave para identificar vuelos "idénticos"
            # Usar .get() para mayor robustez si alguna clave pudiera faltar
            # Incluir los nuevos campos de escala en la clave para una agrupación precisa
            key_tuple = (
                vuelo.get('ciudadDestinoIda'),
                vuelo.get('aerolinea'),
                vuelo.get('aeropuertoIda'),
                vuelo.get('horarioSalidaIda'),
                vuelo.get('aeropuertoDestinoIda'),
                vuelo.get('horarioLlegadaIda'), # Ahora usamos horarioLlegadaIda
                vuelo.get('horarioSupongoDuracionIda'),
                vuelo.get('escalasIda'),
                vuelo.get('horarioLlegadaIdaEscala'), # Nuevo en la clave
                vuelo.get('horarioSalidaIdaEscala'), # Nuevo en la clave
                vuelo.get('aeropuertoVuelta'),
                vuelo.get('horarioSalidaVuelta'),
                vuelo.get('aeropuertoDestinoVuelta'),
                vuelo.get('horarioLlegadaVuelta'), # Ahora usamos horarioLlegadaVuelta
                vuelo.get('horarioSupongoDuracionVuelta'),
                vuelo.get('escalasVuelta'),
                vuelo.get('horarioLlegadaVueltaEscala'), # Nuevo en la clave
                vuelo.get('horarioSalidaVueltaEscala'), # Nuevo en la clave
                vuelo.get('precioFinal') # El precio final es clave para la agrupación
            )
            
            group = vuelos_agrupados[key_tuple]
            group['count'] += 1
            if group['representative_vuelo'] is None:
                group['representative_vuelo'] = vuelo # El primer vuelo que cumple es el representante
            
            # Añade las fechas de este vuelo a las alternativas del grupo
            group['fechas_alternativas_ida'].add(vuelo.get('fechaSalidaIda'))
            group['fechas_alternativas_vuelta'].add(vuelo.get('fechaSalidaVuelta')) 

        # Convertir los grupos en una lista de "vuelos representativos"
        lista_vuelos_representativos = []
        for key, group_data in vuelos_agrupados.items():
            rep_vuelo = group_data['representative_vuelo']
            if rep_vuelo:
                # Crear una copia del vuelo representativo para no modificar el original en el defaultdict
                processed_rep_vuelo = rep_vuelo.copy() 
                if group_data['count'] > 1:
                    processed_rep_vuelo['fechas_alternativas_ida'] = sorted(list(group_data['fechas_alternativas_ida']))
                    processed_rep_vuelo['fechas_alternativas_vuelta'] = sorted(list(group_data['fechas_alternativas_vuelta']))
                    processed_rep_vuelo['is_grouped'] = True 
                    processed_rep_vuelo['num_grouped_options'] = group_data['count'] 
                else:
                    processed_rep_vuelo['is_grouped'] = False 
                    processed_rep_vuelo['num_grouped_options'] = 1
                lista_vuelos_representativos.append(processed_rep_vuelo)

        cantidad_representativos = len(lista_vuelos_representativos)
        
        # Ordenar vuelos representativos para la selección final
        vuelos_ordenados = sorted(lista_vuelos_representativos, key=lambda x: (
            x.get('precioFinal', float('inf')),
            parse_duration_to_minutes(x.get('horarioSupongoDuracionIda', '')) +
            parse_duration_to_minutes(x.get('horarioSupongoDuracionVuelta', '')),
            # Prioriza menos escalas al contar "escalas" en la cadena
            x.get('escalasIda', 'Non Stop').count('escalas') + x.get('escalasVuelta', 'Non Stop').count('escalas')
        ))
        
        vuelos_para_ollama = vuelos_ordenados[:5] # Selecciona solo los 5 mejores grupos/opciones

        # --- FIN DE LA LÓGICA DE PRE-PROCESAMIENTO Y AGRUPACIÓN ---

        # Formatear los vuelos seleccionados para Ollama
        vuelos_formateados_para_ollama = []
        for v in vuelos_para_ollama:
            vuelos_formateados_para_ollama.append(formatear_vuelo(v, v.get('is_grouped', False)))
        
        vuelos_formateados = "\n\n".join(vuelos_formateados_para_ollama)

        # El pasajero_vuelos_adults, children e infants se toman del primer vuelo de la lista ORIGINAL
        # Suponiendo que estos datos son consistentes en todos los vuelos
        pasajero_vuelos_adults = vuelos[0]['adults'] 
        pasajero_vuelos_children = vuelos[0]['children']
        pasajero_vuelos_infants = vuelos[0]['infants']

        texto_pasajeros = generar_texto_pasajeros(pasajero_vuelos_adults, pasajero_vuelos_children, pasajero_vuelos_infants)
        
        # Construcción dinámica del prompt basada en la cantidad de opciones
        prompt = "" 
        if cantidad_representativos == 1:
            prompt = f"""
Este es el único vuelo disponible actualmente. Redacta un mensaje claro y directo para enviar al cliente por WhatsApp.

 **Redactar el mensaje final para el cliente:**
    * **Tono:** Natural, humano, directo y conciso.
    * **Formato de cada vuelo:** **ESTRICTAMENTE** el siguiente formato. Rellena los `{{...}}` con los datos correspondientes de cada vuelo.
        ```
        ✈️ Aéreo de {{aerolinea}} con equipaje de mano de 10kg + bolso de mano.

        Horarios:

        ida:
            Salida:  {{aeropuertoIda}} {{horarioSalidaIda}} | {{fechaSalidaIda}}
            Escala: {{horarioLlegadaIdaEscala}} -> {{fechaLlegadaIdaEscala}} || {{horarioSalidaIdaEscala}} -> {{fechaSalidaIdaEscala}} (UBICACION_ESCALA)
            Llegada: {{aeropuertoDestinoIda}} {{horarioLlegadaIda}} | {{fechaLlegadaIda}}
            (Duración: {{horarioSupongoDuracionIda}}) || {{escalasIda}}

        vuelta:
            Salida:  {{aeropuertoVuelta}} {{horarioSalidaVuelta}} | {{fechaSalidaVuelta}}
            Escala: {{horarioLlegadaVueltaEscala}} -> {{fechaLlegadaVueltaEscala}} || {{horarioSalidaVueltaEscala}} -> {{fechaSalidaVueltaEscala}} (UBICACION_ESCALA)
            Llegada: {{aeropuertoDestinoVuelta}} {{horarioLlegadaVuelta}} | {{fechaLlegadaVuelta}}
            (Duración: {{horarioSupongoDuracionVuelta}}) || {{escalasVuelta}}
        
        💰 Precio final: {{precioFinal}} USD


Requisitos:
- No compares con otros vuelos.
- No uses frases como "es la mejor opción" ni "comparando".
- No cierres con sugerencias.
- Usa un tono natural, humano y conciso.
- El mensaje debe ser listo para copiar y pegar al cliente.

{vuelos_formateados}
"""
        elif cantidad_representativos <= 5: 
            prompt = f"""
Estas son las opciones de vuelos disponibles. Redacta un único mensaje para enviar al cliente por WhatsApp.
Presenta las opciones de forma clara, listadas del 1 al {cantidad_representativos} .
Si alguna opción agrupa varias fechas con las mismas características (precio, escalas, duración, horarios de salida y llegada), indícalo claramente y muestra las fechas de salida disponibles para esa opción, sin repetir toda la información del vuelo.
Al final del mensaje, indica cuál de estas {cantidad_representativos} opciones es la que recomiendas y por qué, de manera muy breve y directa.
Tenes que mostrar todas las opciones de vuelos que llegan en orden segun la fecha de mas porximo a la fecha de hoy.

 **Redactar el mensaje final para el cliente:**
    * **Tono:** Natural, humano, directo y conciso.
    * **Formato de cada vuelo:** **ESTRICTAMENTE** el siguiente formato. Rellena los `{{...}}` con los datos correspondientes de cada vuelo.
        ```
        ✈️ Aéreo de {{aerolinea}} con equipaje de mano de 10kg + bolso de mano.

        Horarios:

        ida:
            Salida:  {{aeropuertoIda}} {{horarioSalidaIda}} | {{fechaSalidaIda}}
            Escala: {{horarioLlegadaIdaEscala}} -> {{fechaLlegadaIdaEscala}} || {{horarioSalidaIdaEscala}} -> {{fechaSalidaIdaEscala}} (UBICACION_ESCALA)
            Llegada: {{aeropuertoDestinoIda}} {{horarioLlegadaIda}} | {{fechaLlegadaIda}}
            (Duración: {{horarioSupongoDuracionIda}}) || {{escalasIda}}

///////////

        vuelta:
            Salida:  {{aeropuertoVuelta}} {{horarioSalidaVuelta}} | {{fechaSalidaVuelta}}
            Escala: {{horarioLlegadaVueltaEscala}} -> {{fechaLlegadaVueltaEscala}} || {{horarioSalidaVueltaEscala}} -> {{fechaSalidaVueltaEscala}} (UBICACION_ESCALA)
            Llegada: {{aeropuertoDestinoVuelta}} {{horarioLlegadaVuelta}} | {{fechaLlegadaVuelta}}
            (Duración: {{horarioSupongoDuracionVuelta}}) || {{escalasVuelta}}
        
        💰 Precio final: {{precioFinal}} USD


Requisitos:
- Compara las opciones considerando duración, precio y escalas.
- Recomienda la mejor opción, priorizando el precio y luego la duración total (ida + vuelta) y menos escalas.
- No expliques que estás recomendando, simplemente hazlo.
- No repitas información obvia ni detalles técnicos.
- No cierres con preguntas ni sugerencias.
- El mensaje debe ser directo y apto para cliente.

{vuelos_formateados}

Escribe una única respuesta como si fueras un asesor humano que ya analizó todo y ahora redacta el mensaje final.
""" 
        else: # Esto se ejecuta cuando hay más de 5 opciones representativas
            prompt = f"""
Sos un asistente de viajes experto y conciso, especializado en encontrar y recomendar las mejores opciones de vuelos para enviar a clientes por WhatsApp. Recibirás una lista de vuelos en formato JSON y tu tarea es analizarla y responder con exactamente 5 opciones de vuelo, en un formato muy específico, listo para copiar y pegar en WhatsApp.

1. Análisis y priorización interna
Convertí el campo `precioFinal` a número (reemplazá la coma por punto, ej: '651,30' → 651.30).

Calculá la duración total del vuelo sumando la duración de ida y vuelta (convertí strings como "07h 30m" a minutos).

Contá la cantidad total de escalas (ida + vuelta). "Non Stop" equivale a 0 escalas.

2. Selección de las 5 mejores opciones
Seleccioná las 5 mejores opciones de vuelo según este orden de prioridad:

1. Menor **precioFinal**
2. Menor **duración total**
3. Menor **cantidad total de escalas**

Agrupá las fechas si hay varias combinaciones con el mismo vuelo (misma aerolínea, mismo itinerario y precio), listando las fechas en una sola línea al final como:

`Fechas disponibles: {{lista_de_fechas_ida}}`

3. Formato del mensaje
Respetá exactamente este formato por opción:
✈️ Aéreo de {{aerolinea}} con equipaje de mano de 10kg + bolso de mano.

Horarios:

ida:
Salida: {{aeropuertoIda}} {{horarioSalidaIda}} | {{fechaSalidaIda}}
Escala: {{horarioLlegadaIdaEscala}} -> {{fechaLlegadaIdaEscala}} || {{horarioSalidaIdaEscala}} -> {{fechaSalidaIdaEscala}} (UBICACION_ESCALA)
Llegada: {{aeropuertoDestinoIda}} {{horarioLlegadaIda}} | {{fechaLlegadaIda}}
(Duración: {{horarioSupongoDuracionIda}}) || {{escalasIda}}

vuelta:
Salida: {{aeropuertoVuelta}} {{horarioSalidaVuelta}} | {{fechaSalidaVuelta}}
Escala: {{horarioLlegadaVueltaEscala}} -> {{fechaLlegadaVueltaEscala}} || {{horarioSalidaVueltaEscala}} -> {{fechaSalidaVueltaEscala}} (UBICACION_ESCALA)
Llegada: {{aeropuertoDestinoVuelta}} {{horarioLlegadaVuelta}} | {{fechaLlegadaVuelta}}
(Duración: {{horarioSupongoDuracionVuelta}}) || {{escalasVuelta}}

💰 Precio final: {{precioFinal}} USD

4. Resultado esperado
✅ Exactamente 5 bloques de vuelo distintos  
✅ Ordenados de mejor a menos mejor  
✅ No repitas vuelos idénticos con distinta fecha, agrupalos  
✅ Al final, agregá una recomendación concreta (Ej: “La mejor opción es la 1 por ser la más económica con buena duración y pocas escalas.”)  
✅ No incluyas ningún otro texto

📦 JSON a analizar:  
{vuelos_formateados}

""" 
        try:
             
            res = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=4096
            )
            texto = res.choices[0].message.content
            print(texto)
        except Exception as e:
            print(f"Error al generar respuesta con Ollama: {e}")
            traceback.print_exc() # Imprime el traceback completo para depuración

    except Exception as e:
        print(f"Error inesperado durante el procesamiento de vuelos: {e}")
        traceback.print_exc() # Imprime el traceback completo para depuración

if __name__ == "__main__":
    try:
        mensaje = sys.stdin.read()
        generar_respuesta(mensaje)
    except Exception as e:
        print(f"Error al leer stdin o generar respuesta en main: {e}")
        sys.exit(1)