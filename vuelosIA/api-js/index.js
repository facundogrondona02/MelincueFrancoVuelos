// index.js
import { generarArrayMultibusqueda } from './IA/IAMultibusqueda.js';
import { generarJsonDesdeMensaje } from './IA/IAVuelo.js';
import { generarRespuesta } from './IA/IAGeneracionRespuesta.js';
import express, { json } from 'express';
import path from 'path';
import fs from 'fs';
const fsPromises = fs.promises;
import cors from 'cors';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3020
const dataDirPath = path.join(__dirname, 'data');
const destinosFilePath = path.join(dataDirPath, 'destinos.json');
const codigosFilePath = path.join(dataDirPath, 'codigoIATA.json');
app.use(cors());
// Middleware para leer JSON
app.use(json());

// POST /mensaje
app.post('/mensaje', async (req, res) => {
  console.log('Mensaje recibido:', req.body);
  const mensajeCliente = req.body.mensaje

  const objetoViaje = [];

  console.log("Mensaje del cliente:", mensajeCliente);

  if (req.body.multibusqueda == false) {
    console.log("ENTRE AL IF")
    objetoViaje.push(await generarJsonDesdeMensaje(mensajeCliente));
  } else {
    console.log("ENTRE AL ELSE")
    const array = await generarArrayMultibusqueda(mensajeCliente);
    if (Array.isArray(array)) {
      objetoViaje.push(...array);
    } else {
      objetoViaje.push(array);
    }
  }
  console.log("Objetovich:", objetoViaje);
  // Pasamos el objeto 'res' de Express a la función fetching para que pueda responder al cliente
  return await fetching(objetoViaje, res);
});

app.post('/mensajeFomatedado', async (req, res) => {
  console.log('mensajeFomatedado recibido:', req.body.resultados);
  res.json({ status: 'recibido', data: req.body });

});

// GET de prueba
app.get('/mensaje', (req, res) => {
  res.json({ status: 'ok', mensaje: 'Hola desde JS puro' });
});

app.get('/api/destinos', async (req, res ) => {
    try {
        // 1. Construir la ruta absoluta al archivo
        // Ya están definidas arriba: destinosFilePath y codigosFilePath
      
        // 2. Leer el archivo de forma asíncrona
        const data = await fsPromises.readFile(destinosFilePath, 'utf-8');
        const iata = await fsPromises.readFile(codigosFilePath, 'utf-8');
        // 3. Parsear el JSON
        const destinos = JSON.parse(data);
        const IATAS = JSON.parse(iata);

        // 4. Enviar la respuesta
        return res.status(200).json({ ok: true, destinos, IATAS });
    } catch (error) {
        console.error("Error al leer destinos en IA API:", error);
        // Manejo de errores: si el archivo no existe o hay un problema,
        // puedes devolver un array vacío o un error 500
        if ((error).code === 'ENOENT') {
             // Archivo no encontrado
            return res.status(200).json({ ok: true, destinos: [] });
        }
        return res.status(500).json({ ok: false, message: "Error interno del servidor al obtener destinos." });
    }
});


    // POST /api/destinos - Para crear un nuevo destino
    app.post('/api/destinos', async (req, res) => {
        const nuevoDestino = req.body; // El cliente envía el objeto completo
        let destinosActuales= [];
        let codigosIATASActuales = [];

        try {
            const data = await fsPromises.readFile(destinosFilePath, 'utf-8');
            destinosActuales = JSON.parse(data);
            const cods = await fsPromises.readFile(codigosFilePath, 'utf-8');
            codigosIATASActuales = JSON.parse(cods);
        } catch (error) {
            if ((error).code === 'ENOENT') {
                destinosActuales = [];
                codigosIATASActuales = [];
            } else {
                console.error("Error leyendo archivos para crear destino:", error);
                return res.status(500).json({ ok: false, result: "Error al preparar la creación de destino." });
            }
        }

        // Validar si ya existe
        const existeDestino = destinosActuales.find(d => d.ciudad === nuevoDestino.ciudad);
        const existeCodigo = codigosIATASActuales.find(c => c.ciudad === nuevoDestino.ciudad);

        if (existeDestino || existeCodigo) {
            return res.status(400).json({ ok: false, result: "Ya existe un destino o código IATA con esa ciudad." });
        }

        destinosActuales.push(nuevoDestino);
        const objetoIATA = {
            ciudad: nuevoDestino.ciudad,
            codigoIATA: nuevoDestino.origenVuelta
        };
        codigosIATASActuales.push(objetoIATA);

        try {
            await fsPromises.writeFile(destinosFilePath, JSON.stringify(destinosActuales, null, 2), 'utf-8');
            await fsPromises.writeFile(codigosFilePath, JSON.stringify(codigosIATASActuales, null, 2), 'utf-8');
            return res.status(201).json({ ok: true, result: "Destino agregado correctamente." });
        } catch (error) {
            console.error("Error escribiendo archivos al crear destino:", error);
            return res.status(500).json({ ok: false, result: "Error al guardar el nuevo destino." });
        }
    });

    // PUT /api/destinos/:ciudad - Para modificar un destino
    app.put('/api/destinos/:ciudad', async (req, res) => {
        const ciudadParam = req.params.ciudad;
        const nuevoDestino = req.body; // El cliente envía el objeto completo

        if (ciudadParam !== nuevoDestino.ciudad) {
            return res.status(400).json({ ok: false, result: "La ciudad en la URL no coincide con la ciudad en el cuerpo de la solicitud." });
        }

        let destinosActuales= [];
        let codigosIATASActuales = [];

        try {
            const data = await fsPromises.readFile(destinosFilePath, 'utf-8');
            destinosActuales = JSON.parse(data);
            const cods = await fsPromises.readFile(codigosFilePath, 'utf-8');
            codigosIATASActuales = JSON.parse(cods);
        } catch (error) {
            console.error("Error leyendo archivos para modificar destino:", error);
            return res.status(500).json({ ok: false, result: "Error al preparar la modificación de destino." });
        }

        const indexDestino = destinosActuales.findIndex(d => d.ciudad === ciudadParam);
        const indexIATA = codigosIATASActuales.findIndex(c => c.ciudad === ciudadParam);

        if (indexDestino === -1 || indexIATA === -1) {
            return res.status(404).json({ ok: false, result: "No se encuentra esta ciudad para modificar." });
        }

        destinosActuales[indexDestino] = { ...nuevoDestino };
        codigosIATASActuales[indexIATA] = {
            ciudad: nuevoDestino.ciudad,
            codigoIATA: nuevoDestino.origenVuelta
        };

        try {
            await fsPromises.writeFile(destinosFilePath, JSON.stringify(destinosActuales, null, 2), 'utf-8');
            await fsPromises.writeFile(codigosFilePath, JSON.stringify(codigosIATASActuales, null, 2), 'utf-8');
            return res.status(200).json({ ok: true, result: "Destino actualizado correctamente." });
        } catch (error) {
            console.error("Error escribiendo archivos al modificar destino:", error);
            return res.status(500).json({ ok: false, result: "Error al guardar los cambios." });
        }
    });

    // DELETE /api/destinos/:ciudad - Para eliminar un destino
    app.delete('/api/destinos/:ciudad', async (req, res ) => {
        const ciudadEliminar = req.params.ciudad; // Se espera la ciudad en la URL

        let destinosActuales= [];
        let codigosIATASActuales= [];

        try {
            const data = await fsPromises.readFile(destinosFilePath, 'utf-8');
            destinosActuales = JSON.parse(data);
            const cods = await fsPromises.readFile(codigosFilePath, 'utf-8');
            codigosIATASActuales = JSON.parse(cods);
        } catch (error) {
            console.error("Error leyendo archivos para eliminar destino:", error);
            return res.status(500).json({ ok: false, result: "Error al preparar la eliminación de destino." });
        }

        const initialDestinosLength = destinosActuales.length;
        const initialCodigosLength = codigosIATASActuales.length;

        destinosActuales = destinosActuales.filter(d => d.ciudad !== ciudadEliminar);
        codigosIATASActuales = codigosIATASActuales.filter(c => c.ciudad !== ciudadEliminar);

        if (destinosActuales.length === initialDestinosLength && codigosIATASActuales.length === initialCodigosLength) {
            return res.status(404).json({ ok: false, result: `No se encontró la ciudad '${ciudadEliminar}' para eliminar.` });
        }

        try {
            await fsPromises.writeFile(destinosFilePath, JSON.stringify(destinosActuales, null, 2), 'utf-8');
            await fsPromises.writeFile(codigosFilePath, JSON.stringify(codigosIATASActuales, null, 2), 'utf-8');
            return res.status(200).json({ ok: true, result: `Destino '${ciudadEliminar}' eliminado correctamente.` });
        } catch (error) {
            console.error("Error escribiendo archivos al eliminar destino:", error);
            return res.status(500).json({ ok: false, result: "Error al guardar los cambios después de eliminar." });
        }
    });


app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://ia-api:${PORT}`);
});

const generandoRespuesta = async (data) => {
  const response = await generarRespuesta(data);
  return response;
}

const fetching = async (data, expressRes) => { // Renombrado 'res' a 'expressRes'
  await fetch("http://backend:3030/evento", {
    method: "POST",
    body: JSON.stringify({ data }),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((fetchResponse) => fetchResponse.json()) // Renombrado 'res' a 'fetchResponse'
    .then(async (data) => {
      console.log("Respuesta del servidor:", data);
      const respuestfinal = await generandoRespuesta(data.resultados)
      // await fetchinParaCliente(respuestfinal);
      console.log("Respuesta final generada:", respuestfinal);
      return expressRes.json({ status: 'recibido', data: respuestfinal }); // Usar 'expressRes' para enviar la respuesta al cliente
    })
    .catch((error) => {
      console.error("Error al enviar el formulario:", error);
      // Asegúrate de enviar una respuesta de error al cliente si algo falla en el fetch
      expressRes.status(500).json({ status: 'error', message: 'Error al procesar la solicitud.' });
    });
}
