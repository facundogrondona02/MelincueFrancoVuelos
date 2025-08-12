import { Storage } from '@google-cloud/storage';
import express from 'express';
import fetch from 'node-fetch'; // Asegúrate de que node-fetch esté instalado

const app = express();
app.use(express.json());

const BUCKET_NAME = 'mensajes-predefinidos'; // Bucket para los mensajes de entrada
const RESULTS_BUCKET_NAME = 'resultados-formateados'; // Nuevo bucket para los resultados
const MENSAJES_FILE = 'mensajes-predefinidos.json';
const storage = new Storage();
let mensajesPre = null;

// URL de tu Google Apps Script Web App (configúrala como variable de entorno en Cloud Run)
// Ejemplo: https://script.google.com/macros/s/AKfyc.../exec
const APPS_SCRIPT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx7dAh8MofIwwOHE_t8PLHMVWWDlog2XdmL1torkVax6ekRjI3iH4toFh7RvKfYVFcw_w/exec"

// Clave secreta para validar la llamada en tu Apps Script (configúrala como variable de entorno)
const APP_SCRIPT_SECRET_KEY = 'TU_SUPER_CLAVE_SECRETA'

// Función para leer el JSON del bucket
async function readJsonFromBucket(bucketName, fileName) { // Ahora recibe el nombre del bucket
  try {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);
    const [contents] = await file.download();
    return JSON.parse(contents.toString('utf8'));
  } catch (error) {
    // Si el archivo no existe o hay un error de lectura/parseo, retorna null o un array vacío
    console.warn(`Advertencia: No se pudo leer o parsear gs://${bucketName}/${fileName}. Iniciando con datos nuevos.`, error.message);
    return null; // Indica que no hay datos existentes válidos
  }
}

// Función para guardar datos en un bucket con lógica de archivo diario
async function saveDailyResultsToBucket(newData) {
  const today = new Date();
  // Formatea la fecha para el nombre del archivo (ej. 2025-08-11)
  const dateString = today.toISOString().split('T')[0];
  const outputFileName = `resultados_formateados_${dateString}.json`;

  try {
    // Intenta leer los datos de hoy del bucket de RESULTADOS
    let existingData = await readJsonFromBucket(RESULTS_BUCKET_NAME, outputFileName); 

    let dataToSave;
    if (existingData && Array.isArray(existingData)) {
      // Si ya hay datos y es un array, los combinamos
      dataToSave = existingData.concat(newData);
      console.log(`✅ Añadiendo datos a archivo existente: gs://${RESULTS_BUCKET_NAME}/${outputFileName}`);
    } else {
      // Si no hay datos existentes, o no es un array válido, usamos solo los datos nuevos
      dataToSave = newData;
      console.log(`✅ Creando o reescribiendo archivo para hoy: gs://${RESULTS_BUCKET_NAME}/${outputFileName}`);
    }

    const bucket = storage.bucket(RESULTS_BUCKET_NAME); // Usa el nuevo bucket aquí
    const file = bucket.file(outputFileName);
    await file.save(JSON.stringify(dataToSave, null, 2), {
      contentType: 'application/json',
    });
    console.log(`✅ Datos actualizados en gs://${RESULTS_BUCKET_NAME}/${outputFileName}`);
    return outputFileName; // Devuelve el nombre del archivo guardado
  } catch (error) {
    console.error(`❌ Error al guardar datos diarios en gs://${RESULTS_BUCKET_NAME}/${outputFileName}:`, error);
    throw error;
  }
}

// Definir la ruta POST para tu lógica
app.post('/publicarTarea', async (req, res) => {
  const allProcessedResults = []; // Para almacenar los resultados de cada llamada fetch exitosa
  const allResponsesDetails = []; // Para almacenar detalles de todas las respuestas (éxito/error)

  try {
    // Cargar mensajes predefinidos solo una vez si no están en caché
    // Ahora readJsonFromBucket necesita el nombre del bucket
    if (!mensajesPre) {
      mensajesPre = await readJsonFromBucket(BUCKET_NAME, MENSAJES_FILE); 
      console.log('Mensajes previos cargados:', mensajesPre);
    }

    // Asegúrate de que API_URL esté definido.
    // SE HA CORREGIDO EL FORMATO DE LA URL
    const API_URL = "https://francofinal-ia-api-1052426122489.southamerica-east1.run.app"; 

    // Iterar sobre cada elemento de mensajesPre y realizar la llamada fetch secuencialmente
    for (const element of mensajesPre) {
      try {
        const response = await fetch(`${API_URL}/mensajeFormateado`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(element),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error en respuesta de la API para elemento ${JSON.stringify(element)}:`, errorText);
          allResponsesDetails.push({ success: false, element, error: errorText, status: response.status });
        } else {
          const data = await response.json(); // 'data' contendrá el array que devuelve mensajeFormateado
          console.log(`✅ Mensaje enviado a formateado para elemento ${JSON.stringify(element)}:`, data);
          allProcessedResults.push({ originalElement: element, processedData: data }); // Guarda el elemento original y el resultado procesado
          allResponsesDetails.push({ success: true, element, data });
        }
      } catch (innerError) {
        console.error(`❌ Error al realizar fetch para elemento ${JSON.stringify(element)}:`, innerError);
        allResponsesDetails.push({ success: false, element, error: innerError.message });
      }
    }

    let finalOutputFileName = "No se guardó ningún archivo.";
    // Guardar todos los resultados procesados en el bucket con lógica diaria
    if (allProcessedResults.length > 0) {
        finalOutputFileName = await saveDailyResultsToBucket(allProcessedResults);
        
        // --- NUEVO: Llamada al Google Apps Script ---
        console.log("Intentando activar Google Apps Script...");
        if (APPS_SCRIPT_WEB_APP_URL && APP_SCRIPT_SECRET_KEY) {
            try {
                const appsScriptResponse = await fetch(APPS_SCRIPT_WEB_APP_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'importDataFromGCS', // Nombre de la acción que tu Apps Script espera
                        secret: APP_SCRIPT_SECRET_KEY // Tu clave secreta
                    })
                });

                if (!appsScriptResponse.ok) {
                    const errorText = await appsScriptResponse.text();
                    console.error(`❌ Error al activar Apps Script (Status ${appsScriptResponse.status}):`, errorText);
                    allResponsesDetails.push({ success: false, type: 'AppsScript_Activation', error: errorText, status: appsScriptResponse.status });
                } else {
                    const successText = await appsScriptResponse.text();
                    console.log(`✅ Apps Script activado exitosamente:`, successText);
                    allResponsesDetails.push({ success: true, type: 'AppsScript_Activation', message: successText });
                }
            } catch (appsScriptError) {
                console.error(`❌ Error de conexión al activar Apps Script:`, appsScriptError);
                allResponsesDetails.push({ success: false, type: 'AppsScript_Activation', error: appsScriptError.message });
            }
        } else {
            console.warn("⚠️ APPS_SCRIPT_WEB_APP_URL o APP_SCRIPT_SECRET_KEY no están configuradas. No se pudo activar Apps Script.");
            allResponsesDetails.push({ success: false, type: 'AppsScript_Activation', message: 'Variables de entorno faltantes.' });
        }
        // --- FIN DE NUEVO CÓDIGO ---

    } else {
        console.log("No hay resultados procesados para guardar en el bucket.");
    }

    // Respuesta final después de procesar todas las llamadas
    res.status(200).send({
      status: "OK",
      mensaje: "✅ Proceso de envío de tareas, guardado y activación de Apps Script completado",
      resultados_guardados_en: `gs://${RESULTS_BUCKET_NAME}/${finalOutputFileName}`, // Referencia al nuevo bucket
      detalle_respuestas: allResponsesDetails, // Devuelve los detalles de cada fetch (útil para depuración)
    });

  } catch (error) {
    console.error("❌ Error general en publicarTarea:", error);
    res.status(500).send({
      status: "ERROR",
      mensaje: "❌ Falló el proceso de envío de tareas",
      error: error.message,
      detalle_respuestas: allResponsesDetails // Si hay respuestas parciales antes del fallo general
    });
  }
});

// Definir el puerto de escucha (Cloud Run lo proporcionará en process.env.PORT)
const PORT = process.env.PORT || 8080;

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor Express escuchando en http://localhost:${PORT}`);
});
