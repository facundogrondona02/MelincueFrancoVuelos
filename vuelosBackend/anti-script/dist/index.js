import express, { json } from 'express';
import { GoogleAuth } from 'google-auth-library'; // <-- ¡IMPORTAR ESTO!
import { getContextConSesionValida } from './funciones/context.js';
import { scrapingVuelos } from './funciones/scraping.js';
import cors from 'cors';
import pLimit from 'p-limit';
const app = express();
const PORT = process.env.PORT || 3030; // Asegúrate de que esto esté así
app.use(cors());
app.use(json());
app.use(express.json()); // 👈 necesario para que req.body funcione
// Variable de entorno para la URL de la IA API.
// Asegúrate de que esta variable esté configurada en tu servicio 'francofinal-backend' en Cloud Run
const IA_API_BASE_URL = process.env.IA_API_BASE_URL || 'http://ia-api:3020/api';
// ----------------------------------------------------
// FUNCIÓN AUXILIAR PARA OBTENER LOS HEADERS DE AUTENTICACIÓN
// ----------------------------------------------------
/**
 * Función auxiliar para obtener los headers de autenticación con un ID Token de Google.
 * Esto es necesario para invocar servicios de Cloud Run que requieren autenticación.
 * Solo se activa en entorno de producción y para URLs HTTPS.
 * @param targetAudience La URL del servicio de Cloud Run al que se quiere llamar.
 * @returns Un objeto de headers con la propiedad 'Authorization' si se genera un token, o un objeto vacío.
 */
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
        }
        catch (error) {
            console.error('❌ Error al generar los headers de autenticación para:', targetAudience, error);
            return {}; // Retorna un objeto vacío en caso de error
        }
    }
    return {}; // Retorna un objeto vacío si no se necesita autenticación o no se puede obtener el token
}
// ----------------------------------------------------
// POST / RECIBE OBJETOS PARA HACER SCRAPING (Este no necesita auth para IA_API, solo usa funciones locales)
app.post('/evento', async (req, res) => {
    const objetoViaje = req.body.data;
    console.log("Tipo de datos recibidos:", typeof req.body);
    console.log("OBJETO COMPLETO RECIBIDO=> ", objetoViaje);
    try {
        const resultados = await haciendoScraping(objetoViaje);
        await res.status(200).json({ ok: true, resultados });
    }
    catch (error) {
        console.error("❌ Error en /evento:", error);
        return res.status(500).json({
            ok: false,
            mensaje: "Ocurrió un error inesperado durante el scraping.",
            detalle: error instanceof Error ? error.message : String(error),
        });
    }
});
// GET / MOSTRAR DESTINOS
app.get('/destinos', async (req, res) => {
    console.log("ENTRAMOS ACA EN BACKEND/DESTINOS"); // <-- Mensaje de log para depuración
    try {
        // Obtener headers de autenticación para la IA API
        let headers = { "Content-Type": "application/json" };
        const authHeaders = await getAuthHeaders(IA_API_BASE_URL); // <-- AUTENTICACIÓN
        headers = Object.assign(Object.assign({}, headers), authHeaders);
        const respuestaApi = await llamandoDestinos(headers); // Pasar los headers a la función llamandoDestinos
        if (respuestaApi && respuestaApi.ok && Array.isArray(respuestaApi.destinos)) {
            return res.status(200).json({ ok: true, destinos: respuestaApi.destinos });
        }
        else {
            console.error("❌ Formato de respuesta inesperado de la API de destinos:", respuestaApi);
            return res.status(500).json({ ok: false, mensaje: "Error al obtener destinos de la API externa." });
        }
    }
    catch (error) {
        console.log("Este error? ", error);
        return res.status(500).json({ ok: false, mensaje: "Error al conectar con la API de destinos.", detalle: error instanceof Error ? error.message : String(error) });
    }
});
// PUT / MODIFICAR DESTINOS
app.put('/modificarDestinos', async (req, res) => {
    const nuevoDestino = req.body;
    console.log("desde la backend (modificar)", nuevoDestino);
    try {
        let headers = { "Content-Type": "application/json" };
        const authHeaders = await getAuthHeaders(IA_API_BASE_URL); // <-- AUTENTICACIÓN
        headers = Object.assign(Object.assign({}, headers), authHeaders);
        const response = await fetch(`${IA_API_BASE_URL}/destinos/${nuevoDestino.ciudad}`, {
            method: "PUT",
            headers: headers, // <-- USAR HEADERS AUTENTICADOS
            body: JSON.stringify(nuevoDestino),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.result || `Error al modificar destino: ${response.status}`);
        }
        const result = await response.json();
        return res.status(200).json(result);
    }
    catch (error) {
        console.error("Error al modificar destino en IA API:", error);
        return res.status(500).json({ result: "Error al modificar el destino.", detalle: error instanceof Error ? error.message : String(error) });
    }
});
// POST / CREAR DESTINO
app.post('/crearDestino', async (req, res) => {
    const nuevoDestino = req.body;
    console.log("nuevo destino (crear)", nuevoDestino);
    try {
        let headers = { "Content-Type": "application/json" };
        const authHeaders = await getAuthHeaders(IA_API_BASE_URL); // <-- AUTENTICACIÓN
        headers = Object.assign(Object.assign({}, headers), authHeaders);
        const response = await fetch(`${IA_API_BASE_URL}/destinos`, {
            method: "POST",
            headers: headers, // <-- USAR HEADERS AUTENTICADOS
            body: JSON.stringify(nuevoDestino),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.result || `Error al crear destino: ${response.status}`);
        }
        const contentType = response.headers.get('content-type');
        let result;
        if (contentType && contentType.includes('application/json')) {
            result = await response.json();
        }
        else {
            const text = await response.text();
            console.error("La IA API devolvió una respuesta no JSON:", text);
            throw new Error("Respuesta no válida de IA API");
        }
        return res.status(201).json(result); // 201 Created
    }
    catch (error) {
        console.error("Error al crear destino en IA API:", error);
        return res.status(500).json({ result: "Error al crear el destino.", detalle: error instanceof Error ? error.message : String(error) });
    }
});
// DELETE / ELIMINAR DESTINOS
app.delete('/eliminarDestino', async (req, res) => {
    const ciudadEliminar = req.body;
    console.log("desde el backend (eliminar)", ciudadEliminar);
    try {
        let headers = { "Content-Type": "application/json" };
        const authHeaders = await getAuthHeaders(IA_API_BASE_URL); // <-- AUTENTICACIÓN
        headers = Object.assign(Object.assign({}, headers), authHeaders);
        const response = await fetch(`${IA_API_BASE_URL}/destinos/${ciudadEliminar.ciudad}`, {
            method: "DELETE",
            headers: headers, // <-- USAR HEADERS AUTENTICADOS
            // DELETE requests typically don't have a body, but if your IA API expects it, uncomment:
            // body: JSON.stringify(ciudadEliminar),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.result || `Error al eliminar destino: ${response.status}`);
        }
        const result = await response.json();
        return res.status(200).json(result);
    }
    catch (error) {
        console.error("Error al eliminar destino en IA API:", error);
        return res.status(500).json({ result: "Error al eliminar el destino.", detalle: error instanceof Error ? error.message : String(error) });
    }
});
// Levantar servidor
const server = app.listen(PORT, () => {
    console.log(`✅ Anti-script escuschando en http://backend:${PORT}`);
});
server.setTimeout(600000);
// ... (resto de tu código)
const haciendoScraping = async (objetoViaje) => {
    let browser;
    let context;
    const respuestas = [];
    console.log("ARRIBA DEL ONEJTO");
    console.log(objetoViaje[0].mail);
    try {
        const result = await getContextConSesionValida({
            mail: objetoViaje[0].mail,
            password: objetoViaje[0].password,
        });
        console.log("ACA LLEGA????");
        browser = result.browser;
        context = result.context;
        // Define el límite de concurrencia.
        // Empieza con un número bajo para probar, por ejemplo, 2 o 3.
        // Luego, puedes aumentar gradualmente.
        const concurrencyLimit = pLimit(15); // Permite 3 operaciones de scrapingVuelos concurrentes
        const scrapingPromises = objetoViaje.map((vueloOriginal) => {
            var _a, _b;
            const vuelo = Object.assign(Object.assign({}, vueloOriginal), { carryon: (_a = vueloOriginal.carryon) !== null && _a !== void 0 ? _a : true, bodega: (_b = vueloOriginal.bodega) !== null && _b !== void 0 ? _b : false, context });
            return concurrencyLimit(() => scrapingVuelos(vuelo));
        });
        const resultados = await Promise.all(scrapingPromises);
        respuestas.push(...resultados.filter(r => r !== undefined));
        console.log("✅ Resultados de scraping:", respuestas);
        return respuestas;
    }
    finally {
        if (browser) {
            console.log("🧹 Cerrando navegador...");
            await browser.close();
        }
    }
};
const llamandoDestinos = async (headers) => {
    try {
        const response = await fetch(`${IA_API_BASE_URL}/destinos`, {
            method: "GET",
            headers: headers, // <-- USAR HEADERS AUTENTICADOS
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const data = await response.json();
        console.log("Respuesta del servidor de destinos:", data);
        return data;
    }
    catch (error) {
        console.error("Error al llamar a la API de destinos:", error);
        throw error;
    }
};
