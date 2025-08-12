import { generarArrayMultibusqueda } from './IA/IAMultibusqueda.js';
import { generarJsonDesdeMensaje } from './IA/IAVuelo.js';
import { generarRespuesta } from './IA/IAGeneracionRespuesta.js';
import express, { json } from 'express';
import path from 'path';
import cors from 'cors';
import { GoogleAuth } from 'google-auth-library';
import { Storage } from '@google-cloud/storage';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import ExcelJS from 'exceljs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const storage = new Storage();
const BUCKET_NAME = 'codigo-iata-bucket';
const DESTINOS_FILE = 'destinos.json';
const IATA_FILE = 'codigoIATA.json';
const BUCKET_MENSAJES_PREDEFINIDOS = "mensajes-predefinidos"
const FILE_MENSAJES_PREDEFINIDOS = "mensajes-predefinidos.json"

// const API_BACKEND = process.env.BACKEND_API_URL_FOR_IA_API || "http://backend:3030"

// const BACKEND_API_URL_FOR_IA_API_2 =   process.env.BACKEND_API_URL_FOR_IA_API_2
// const BACKEND_API_URL_FOR_IA_API_3 =   process.env.BACKEND_API_URL_FOR_IA_API_
const BACKENDS = [
  process.env.BACKEND_API_URL_FOR_IA_API,
  process.env.BACKEND_API_URL_FOR_IA_API_2
] || "http://backend:3030";

let currentIndex = 0;

const app = express();
const PORT = 3020;

app.use(cors());
app.use(json());

function dividirArrayEnPartes(arr, partes) {
  const resultado = [];
  const tamaño = Math.ceil(arr.length / partes);
  for (let i = 0; i < partes; i++) {
    const inicio = i * tamaño;
    const fin = inicio + tamaño;
    resultado.push(arr.slice(inicio, fin));
  }
  return resultado;
}

async function getAuthHeaders(targetAudience) {
  if (process.env.NODE_ENV === 'production' && targetAudience.startsWith('https://')) {
    try {
      const auth = new GoogleAuth();
      const client = await auth.getIdTokenClient(targetAudience);
      const resHeaders = await client.getRequestHeaders();
      const authHeader = resHeaders.get('Authorization');
      if (authHeader) {
        return { 'Authorization': authHeader };
      }
    } catch (error) {
      console.error('❌ Error al generar los headers de autenticación para:', targetAudience, error);
      return {};
    }
  }
  return {};
}


async function readJsonFromBucket(fileName) {
  const file = storage.bucket(BUCKET_NAME).file(fileName);
  const [contents] = await file.download();
  return JSON.parse(contents.toString());
}

async function writeJsonToBucket(fileName, data) {
  const file = storage.bucket(BUCKET_NAME).file(fileName);
  await file.save(JSON.stringify(data, null, 2), { contentType: 'application/json' });
}

app.post('/mensaje', async (req, res) => {

  console.log('Mensaje recibido:', req.body);
  const mensajeCliente = req.body.mensaje;
  const multiBusqueda = req.body.multibusqueda;
  const viajesLimitados = await generacionArrayPrueba(mensajeCliente, multiBusqueda)

  return await fetching(viajesLimitados, res);
});


/// Este es para el scheduler
// Este es el punto de entrada para los mensajes de Pub/Sub.
// Este es el código de tu endpoint en la API externa (francofinal-ia-api)
app.post('/mensajeFormateado', async (req, res) => {
    console.log("REQ BODYY => ", req.body);

    // Mantenemos el try-catch para manejar errores en el procesamiento
    try {
        const decodedMessage = req.body;
        console.log('--- Mensaje decodificado ---');
        console.log("Tipo:", typeof decodedMessage);
        console.log("Valor:", decodedMessage);

        const mensajeCliente = decodedMessage.mensaje;
        const multiBusqueda = decodedMessage.multibusqueda;

        // Await para que estas funciones terminen antes de enviar la respuesta
        const viajesLimitados = await generacionArrayPrueba(mensajeCliente, multiBusqueda);
        console.log("Arrray => ", viajesLimitados);

        const objetoFinal = await fetchingFormateado(viajesLimitados);
        console.log("OBJETO_FINAL => ", objetoFinal);
        console.log('--- Lógica de mensajeFormateado completada con éxito. ---');

        // Aquí se envía la respuesta, DESPUÉS de que toda la lógica ha terminado
        return res.status(200).send({
            status: "OK",
            mensaje: "Lógica de formato completada",
            resultado: objetoFinal // Puedes devolver el resultado final si es útil
        });
    } catch (error) {
        console.error(`Error durante el procesamiento en mensajeFormateado: ${error}`);
        // Si hay un error, se envía un 500 y se informa el error
        return res.status(500).send({
            status: "ERROR",
            mensaje: "Fallo en la lógica de formato",
            error: error.message
        });
    }
});



app.get('/api/destinos', async (req, res) => {
  try {
    const destinos = await readJsonFromBucket(DESTINOS_FILE);
    const IATAS = await readJsonFromBucket(IATA_FILE);
    return res.status(200).json({ ok: true, destinos, IATAS });
  } catch (error) {
    console.error("Error al leer desde el bucket:", error);
    return res.status(500).json({ ok: false, message: "Error al obtener los datos desde el bucket." });
  }
});

app.post('/api/destinos', async (req, res) => {
  const nuevoDestino = req.body;
  try {
    const destinos = await readJsonFromBucket(DESTINOS_FILE);
    const IATAS = await readJsonFromBucket(IATA_FILE);

    const destinoIndex = destinos.findIndex(d => d.ciudad === nuevoDestino.ciudad);
    if (destinoIndex !== -1) {
      destinos[destinoIndex] = nuevoDestino;
    } else {
      destinos.push(nuevoDestino);
    }

    const iataIndex = IATAS.findIndex(i => i.ciudad === nuevoDestino.ciudad);
    if (iataIndex !== -1) {
      IATAS[iataIndex].codigoIATA = nuevoDestino.origenVuelta;
    } else {
      IATAS.push({ ciudad: nuevoDestino.ciudad, codigoIATA: nuevoDestino.origenVuelta });
    }

    await writeJsonToBucket(DESTINOS_FILE, destinos);
    await writeJsonToBucket(IATA_FILE, IATAS);

    return res.status(201).json({ ok: true, result: "Destino agregado/actualizado correctamente en el bucket." });
  } catch (error) {
    console.error("Error al escribir en el bucket:", error);
    return res.status(500).json({ ok: false, result: "Error al guardar el nuevo destino en el bucket." });
  }
});

app.put('/api/destinos/:ciudad', async (req, res) => {
  const ciudadParam = req.params.ciudad;
  const nuevoDestino = req.body;

  if (ciudadParam !== nuevoDestino.ciudad) {
    return res.status(400).json({ ok: false, result: "La ciudad en la URL no coincide con la ciudad en el cuerpo de la solicitud." });
  }

  try {
    const destinos = await readJsonFromBucket(DESTINOS_FILE);
    const IATAS = await readJsonFromBucket(IATA_FILE);

    const destinoIndex = destinos.findIndex(d => d.ciudad === ciudadParam);
    if (destinoIndex === -1) {
      return res.status(404).json({ ok: false, result: `No se encontró la ciudad '${ciudadParam}' para modificar.` });
    }

    destinos[destinoIndex] = nuevoDestino;
    const iataIndex = IATAS.findIndex(i => i.ciudad === ciudadParam);
    if (iataIndex !== -1) {
      IATAS[iataIndex].codigoIATA = nuevoDestino.origenVuelta;
    }

    await writeJsonToBucket(DESTINOS_FILE, destinos);
    await writeJsonToBucket(IATA_FILE, IATAS);

    return res.status(200).json({ ok: true, result: "Destino actualizado correctamente en el bucket." });
  } catch (error) {
    console.error("Error al modificar destino en el bucket:", error);
    return res.status(500).json({ ok: false, result: "Error al guardar los cambios en el bucket." });
  }
});

app.delete('/api/destinos/:ciudad', async (req, res) => {
  const ciudadEliminar = req.params.ciudad;
  try {
    let destinos = await readJsonFromBucket(DESTINOS_FILE);
    let IATAS = await readJsonFromBucket(IATA_FILE);

    const nuevosDestinos = destinos.filter(d => d.ciudad !== ciudadEliminar);
    const nuevosIATAS = IATAS.filter(i => i.ciudad !== ciudadEliminar);

    if (nuevosDestinos.length === destinos.length && nuevosIATAS.length === IATAS.length) {
      return res.status(404).json({ ok: false, result: `No se encontró la ciudad '${ciudadEliminar}' para eliminar.` });
    }

    await writeJsonToBucket(DESTINOS_FILE, nuevosDestinos);
    await writeJsonToBucket(IATA_FILE, nuevosIATAS);

    return res.status(200).json({ ok: true, result: `Destino '${ciudadEliminar}' eliminado correctamente del bucket.` });
  } catch (error) {
    console.error("Error al eliminar destino del bucket:", error);
    return res.status(500).json({ ok: false, result: "Error al eliminar el destino del bucket." });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://ia-api:${PORT}`);
});
server.setTimeout(600000);
const generandoRespuesta = async (data) => {
  const response = await generarRespuesta(data);
  return response;
}

const fetching = async (data, expressRes) => {
  console.log("ANTES DE IR AL BACK");

  const partes = dividirArrayEnPartes(data, BACKENDS.length);
  try {
    const peticiones = BACKENDS.map(async (backendUrl, i) => {
      let parteData = partes[i] || [];
      console.log(`Enviando ${parteData.length} objetos a backend: ${backendUrl}`);

      if (backendUrl == BACKENDS[0]) {
        parteData = parteData.map(data => ({

          ...data,
          mail: "franco@melincue.tur.ar",
          password: "Francomase12!"

        }))
      } else {
        parteData = parteData.map(data => ({

          ...data,
          mail: "ventas@melincue.tur.ar",
          password: "Melincue2025!"

        }))
      }

      console.log("PARTES DATA DESPOUES=>>> ", parteData)

      if (parteData.length === 0) {
        console.log(`Omitiendo petición a ${backendUrl} (data vacía)`);
        return [];
      }

      const authHeaders = await getAuthHeaders(backendUrl);

      const respuesta = await fetch(`${backendUrl}/evento`, {
        method: "POST",
        body: JSON.stringify({ data: parteData }),
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
      });

      if (!respuesta.ok) {
        const textoError = await respuesta.text();
        throw new Error(`HTTP error! status: ${respuesta.status}, message: ${textoError}`);
      }

      const datos = await respuesta.json();
      console.log("RESPUESTA =>> ", datos)
      return datos.resultados;
    });

    const resultadosBackend = await Promise.all(peticiones);

    const resultadoFinal = resultadosBackend.flat();

    const respuestfinal = await generandoRespuesta(resultadoFinal);
    console.log("Respuesta final generada:", respuestfinal);

    return expressRes.json({ status: 'recibido', data: respuestfinal });

  } catch (error) {
    console.error("Error al enviar el formulario:", error);
    expressRes.status(500).json({ status: 'error', message: 'Error al procesar la solicitud.', detalle: error instanceof Error ? error.message : String(error) });
  }
};

const fetchingFormateado = async (data, expressRes) => {

  const partes = dividirArrayEnPartes(data, BACKENDS.length);
  try {
    const peticiones = BACKENDS.map(async (backendUrl, i) => {
      let parteData = partes[i] || [];
      console.log(`Enviando ${parteData.length} objetos a backend: ${backendUrl}`);

      if (backendUrl == BACKENDS[0]) {
        parteData = parteData.map(data => ({

          ...data,
          mail: "franco@melincue.tur.ar",
          password: "Francomase12!"

        }))
      } else {
        parteData = parteData.map(data => ({

          ...data,
          mail: "ventas@melincue.tur.ar",
          password: "Melincue2025!"

        }))
      }


      if (parteData.length === 0) {
        console.log(`Omitiendo petición a ${backendUrl} (data vacía)`);
        return [];
      }

      const authHeaders = await getAuthHeaders(backendUrl);

      const respuesta = await fetch(`${backendUrl}/evento`, {
        method: "POST",
        body: JSON.stringify({ data: parteData }),
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
      });

      if (!respuesta.ok) {
        const textoError = await respuesta.text();
        throw new Error(`HTTP error! status: ${respuesta.status}, message: ${textoError}`);
      }

      const datos = await respuesta.json();
      return datos.resultados;
    });

    const resultadosBackend = await Promise.all(peticiones);

    const resultadoFinal = resultadosBackend.flat();

    console.log("Respuesta final generada:", resultadoFinal);

    return  resultadoFinal 

  } catch (error) {
    console.error("Error al enviar el formulario:", error);
    expressRes.status(500).json({ status: 'error', message: 'Error al procesar la solicitud.', detalle: error instanceof Error ? error.message : String(error) });
  }
}



const generacionArrayPrueba = async (mensaje, multibusqueda) => {
  console.log('Mensaje recibido:', mensaje);
  console.log("Typeof mensaje => ", typeof (mensaje))
  const mensajeCliente = mensaje;
  const objetoViaje = [];
  console.log("Multi =>> ", multibusqueda)
  if (multibusqueda == false) {
    const generado = await generarJsonDesdeMensaje(mensajeCliente);
    console.log("OBJETO GENERADO => ", generado)
    let obj;
    if (typeof generado === "string") {
      try {
        obj = JSON.parse(generado);
      } catch (e) {
        console.error("❌ No se pudo parsear generado:", e);
        obj = generado;
      }
    } else {
      obj = generado;
    }
    objetoViaje.push(obj);
  } else {
    const array = await generarArrayMultibusqueda(mensajeCliente);
    if (Array.isArray(array)) {
      objetoViaje.push(...array);
    } else {
      objetoViaje.push(array);
    }
  }
  // Limitar a máximo 30 objetos
  const viajesLimitados = objetoViaje.slice(0, 30);
  return viajesLimitados
}




// /**
//  * Guarda datos como un archivo Excel en el bucket de Cloud Storage
//  * @param {Array} data - Array de objetos con datos de vuelos
//  * @param {string} fileName - Nombre del archivo a guardar en el bucket
//  */
// async function guardarExcelEnBucket(data, fileName) {
//   const workbook = new ExcelJS.Workbook();
//   const sheet = workbook.addWorksheet('Resultados');

//   if (!Array.isArray(data) || data.length === 0) {
//     throw new Error("No hay datos para guardar en Excel.");
//   }

//   // Encabezados
//   const headers = Object.keys(data[0]);
//   sheet.addRow(headers);


//   // Filas
//   data.forEach(item => {
//     sheet.addRow(headers.map(key => item[key]));
//   });

//   // Guardar en un buffer
//   const buffer = await workbook.xlsx.writeBuffer();

//   // Subir al bucket
//   const file = storage.bucket(BUCKET_MENSAJES_PREDEFINIDOS).file(fileName);
//   await file.save(buffer, { contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

//   console.log(`✅ Excel guardado en el bucket como '${fileName}'`);
// }




// const generacionArrayFormateado = async (objeto) => {
//   if (typeof objeto === "string") {
//     try {
//       objeto = JSON.parse(objeto);
//     } catch (e) {
//       console.error("❌ No se pudo parsear 'objeto' como JSON:", e);
//       return [];
//     }
//   }

//   const objetoViaje = [];

//   if (objeto.multibusqueda == false) {
//     console.log("Entra aca? multi = false")
//     const generado = await generarJsonDesdeMensaje(mensajeCliente);
//     console.log("Desoyes del generar json => ", generado)

//     let obj;
//     if (typeof generado === "string") {
//       try {
//         obj = JSON.parse(generado);
//       } catch (e) {
//         console.error("❌ No se pudo parsear generado:", e);
//         obj = generado;
//       }
//     } else {
//       obj = generado;
//     }
//     objetoViaje.push(obj);
//   } else {
//     console.log("Entro al multi =true")
//     const array = await generarArrayMultibusqueda(mensajeCliente);
//     if (Array.isArray(array)) {
//       objetoViaje.push(...array);
//     } else {
//       objetoViaje.push(array);
//     }
//   }
//   console.log("Salimoss")
//   // Limitar a máximo 30 objetos
//   const viajesLimitados = objetoViaje.slice(0, 30);
//   return viajesLimitados
// }



// const generacionArray = async (req) => {
//   console.log('Mensaje recibido:', req.body);
//   const mensajeCliente = req.body.mensaje;
//   const multiBusqueda = req.body.multibusqueda;
//   const objetoViaje = [];

//   if (req.body.multibusqueda == false) {
//     const generado = await generarJsonDesdeMensaje(mensajeCliente);
//     let obj;
//     if (typeof generado === "string") {
//       try {
//         obj = JSON.parse(generado);
//       } catch (e) {
//         console.error("❌ No se pudo parsear generado:", e);
//         obj = generado;
//       }
//     } else {
//       obj = generado;
//     }
//     objetoViaje.push(obj);
//   } else {
//     const array = await generarArrayMultibusqueda(mensajeCliente);
//     if (Array.isArray(array)) {
//       objetoViaje.push(...array);
//     } else {
//       objetoViaje.push(array);
//     }
//   }
//   // Limitar a máximo 30 objetos
//   const viajesLimitados = objetoViaje.slice(0, 30);
//   return viajesLimitados
// }





