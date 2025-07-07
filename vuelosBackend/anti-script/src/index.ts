
import express, { json, Request, Response } from 'express';
// Eliminar estas importaciones, ya no se usan para archivos locales
// import fs from 'fs';
// const fsPromises = fs.promises;
// import path from 'path';

import { getContextConSesionValida } from './funciones/context.js';
import { scrapingVuelos } from './funciones/scraping.js';
import cors from 'cors';

const app = express();
const PORT = 3030;

app.use(cors());
app.use(json());


const IA_API_BASE_URL = 'http://ia-api:3020/api'; 

interface ObjetoViaje {
  mail: string;
  password: string;
  carryon?: boolean;
  bodega?: boolean;
  [key: string]: any; // permite campos adicionales
}
interface DestinoActual {
  ciudad: string,
  origenVuelta: string,
  maxDuracionIda: string,
  maxDuracionVuelta: string,
  horarioIdaEntre: string,
  horarioIdaHasta: string,
  horarioVueltaEntre: string,
  horarioVuarioVueltaHasta: string,
  stops: string
}
interface codigoIATA {
  ciudad: string,
  codigoIATA: string
}

// POST / RECIBE OBJETOS PARA HACER SCRAPING
app.post('/evento', async (req: Request, res: Response) => {
  const objetoViaje: ObjetoViaje[] = req.body.data;
  console.log('📥 Evento recibido:', objetoViaje);
  try {
    const resultados = await haciendoScraping(objetoViaje);
    await res.status(200).json({ ok: true, resultados })
  } catch (error) {
    console.error("❌ Error en /evento:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Ocurrió un error inesperado durante el scraping.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// GET / MOSTRAR DESTINOS
app.get('/destinos', async (req: Request, res: Response) => {
    console.log("ENTRAMOS ACA????????????")
  try {
    const respuestaApi = await llamandoDestinos();
    if (respuestaApi && respuestaApi.ok && Array.isArray(respuestaApi.destinos)) {
      return res.status(200).json({ ok: true, destinos: respuestaApi.destinos });
    } else {
      console.error("❌ Formato de respuesta inesperado de la API de destinos:", respuestaApi);
      return res.status(500).json({ ok: false, mensaje: "Error al obtener destinos de la API externa." });
    }
  } catch (error) {
    console.log("Este error? ", error);
    return res.status(500).json({ ok: false, mensaje: "Error al conectar con la API de destinos.", detalle: error instanceof Error ? error.message : String(error) });
  }
});

// PUT / MODIFICAR DESTINOS
app.put('/modificarDestinos', async (req: Request, res: Response) => {
  const nuevoDestino: DestinoActual = req.body;
  console.log("desde la api (modificar)", nuevoDestino);

  try {
    const response = await fetch(`${IA_API_BASE_URL}/destinos/${nuevoDestino.ciudad}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevoDestino),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.result || `Error al modificar destino: ${response.status}`);
    }

    const result = await response.json();
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error al modificar destino en IA API:", error);
    return res.status(500).json({ result: "Error al modificar el destino.", detalle: error instanceof Error ? error.message : String(error) });
  }
});

// POST / CREAR DESTINO
app.post('/crearDestino', async (req: Request, res: Response) => {
  const nuevoDestino: DestinoActual = req.body;
  console.log("nuevo destino (crear)", nuevoDestino);
console.log("CREAMOOOOSSSSS")
  try {
    const response = await fetch(`${IA_API_BASE_URL}/destinos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevoDestino),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.result || `Error al crear destino: ${response.status}`);
    }

    const result = await response.json();
    return res.status(201).json(result); // 201 Created
  } catch (error) {
    console.error("Error al crear destino en IA API:", error);
    return res.status(500).json({ result: "Error al crear el destino.", detalle: error instanceof Error ? error.message : String(error) });
  }
});

// DELETE / ELIMINAR DESTINOS
app.delete('/eliminarDestino', async (req: Request, res: Response) => {
  const ciudadEliminar: { ciudad: string } = req.body; // Asumiendo que el body es { ciudad: "NombreCiudad" }
  console.log("desde la api (eliminar)", ciudadEliminar);

  try {
    const response = await fetch(`${IA_API_BASE_URL}/destinos/${ciudadEliminar.ciudad}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      // DELETE requests typically don't have a body, but if your IA API expects it, uncomment:
      // body: JSON.stringify(ciudadEliminar),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.result || `Error al eliminar destino: ${response.status}`);
    }

    const result = await response.json();
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error al eliminar destino en IA API:", error);
    return res.status(500).json({ result: "Error al eliminar el destino.", detalle: error instanceof Error ? error.message : String(error) });
  }
});

// Levantar servidor
app.listen(PORT, () => {
  console.log(`✅ Anti-script escuschando en http://backend:${PORT}`);
});

// Función principal de scraping
const haciendoScraping = async (objetoViaje: ObjetoViaje[]) => {
  let browser: any; // podés tipar mejor si usás types de Playwright
  let context: any;
  const respuestas: any[] = [];
 console.log("HACE EL SCARPING?=????????????")
  try {
    const result = await getContextConSesionValida({
      mail: objetoViaje[0].mail,
      password: objetoViaje[0].password,
    });
    console.log("ACA LLEGA????")
    browser = result.browser;
    context = result.context;




    const scrapingPromises = objetoViaje.map((vueloOriginal) => {
      const vuelo: any = {
        ...vueloOriginal,
        carryon: vueloOriginal.carryon ?? true,
        bodega: vueloOriginal.bodega ?? false,
        context,
      };
      return scrapingVuelos(vuelo);
    });

    const scrapingResults = await Promise.all(scrapingPromises);
    respuestas.push(...scrapingResults.filter((r) => r !== undefined));
    console.log("✅ Resultados de scraping:", respuestas);

    return respuestas;
  } finally {
    if (browser) {
      console.log("🧹 Cerrando navegador...");
      await browser.close();
    }
  }
};

const fetching = async (data: any) => {
  await fetch('http://localhost:3020/mensajeFormateado', {
    method: "POST",
    body: JSON.stringify({ data }),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("Respuesta del servidor:", data);
    })
    .catch((error) => {
      console.error("Error al enviar el formulario:", error);
    });

}

const llamandoDestinos = async () => {
  try {
    const response = await fetch(`${IA_API_BASE_URL}/destinos`, { // Usar IA_API_BASE_URL
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log("Respuesta del servidor de destinos:", data);
    return data;
  } catch (error) {
    console.error("Error al llamar a la API de destinos:", error);
    throw error;
  }
};
