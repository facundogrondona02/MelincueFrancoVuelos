import { NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library'; // Importar GoogleAuth

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://backend:3030";

/**
 * Función auxiliar para obtener los headers de autenticación con un ID Token de Google.
 * Esto es necesario para invocar servicios de Cloud Run que requieren autenticación.
 * Solo se activa en entorno de producción y para URLs HTTPS.
 * @param targetAudience La URL del servicio de Cloud Run al que se quiere llamar.
 * @returns Un objeto de headers con la propiedad 'Authorization' si se genera un token, o un objeto vacío.
 */
async function getAuthHeaders(targetAudience: string): Promise<HeadersInit> {
  // Verificar si estamos en producción y si la URL de destino es HTTPS (como las de Cloud Run)
  if (process.env.NODE_ENV === 'production' && targetAudience.startsWith('https://')) {
    try {
      const auth = new GoogleAuth();
      // Obtener un cliente que puede generar ID Tokens para la audiencia objetivo
      const client = await auth.getIdTokenClient(targetAudience);
      // Obtener los headers de la petición, que incluirán el Authorization header
      const resHeaders = await client.getRequestHeaders();
      const authHeader = resHeaders.get('Authorization'); // Usar .get() para extraer el valor

      if (authHeader) {
        return { 'Authorization': authHeader };
      }
    } catch (error) {
      console.error('❌ Error al generar los headers de autenticación para:', targetAudience, error);
      // En caso de error al generar el token, la petición fallará con 403 de todos modos.
      // Retornamos headers vacíos para que la petición se intente sin token.
      return {};
    }
  }
  return {}; // Para desarrollo o URLs no HTTPS, no se añaden headers de autenticación
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("Intentando guardar destino desde el Home:", data);

    // Obtener los headers de autenticación para la llamada al backend
    const authHeaders = await getAuthHeaders(BACKEND_API_URL);

    const response = await fetch(`${BACKEND_API_URL}/crearDestino`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders, // <-- ¡Añadir los headers de autenticación aquí!
      },
      body: JSON.stringify(data),
    });

    const res = await response.json();
    console.log("Respuesta del servidor al crear destino:", res);

    if (response.ok) { // Usar response.ok para verificar el status HTTP 2xx
      console.log("Destino creado correctamente");
      return NextResponse.json({ ok: true, result: res.result }, { status: response.status });
    } else {
      // Si la respuesta no es OK (ej. 400, 403, 500), pasar el error del backend
      console.error("Error del backend al crear destino:", res);
      return NextResponse.json({ ok: false, error: res.error || res.message || "Error desconocido del backend" }, { status: response.status });
    }
  } catch (error) {
    console.error("Error al enviar la solicitud para crear destino:", error);
    return NextResponse.json({ ok: false, error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    console.log("Intentando modificar destino desde el Home:", data);

    // Obtener los headers de autenticación
    const authHeaders = await getAuthHeaders(BACKEND_API_URL);

    const response = await fetch(`${BACKEND_API_URL}/modificarDestinos`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders, // <-- ¡Añadir los headers de autenticación aquí!
      },
      body: JSON.stringify(data),
    });

    const res = await response.json();
    console.log("Respuesta del servidor al modificar destino:", res);

    if (response.ok) {
      console.log("Destino actualizado correctamente");
      return NextResponse.json({ ok: true, result: res.result }, { status: response.status });
    } else {
      console.error("Error del backend al modificar destino:", res);
      return NextResponse.json({ ok: false, error: res.error || res.message || "Error desconocido del backend" }, { status: response.status });
    }
  } catch (error) {
    console.error("Error al enviar la solicitud para modificar destino:", error);
    return NextResponse.json({ ok: false, error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Obtener los headers de autenticación
    const authHeaders = await getAuthHeaders(BACKEND_API_URL);

    const res = await fetch(
      `${BACKEND_API_URL}/destinos`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders, // <-- ¡Añadir los headers de autenticación aquí!
        },
      }
    );

    if (!res.ok) {
      // Si la respuesta no es OK, intentar leer el cuerpo como JSON si es posible
      const errorBody = await res.text(); // Leer como texto primero para evitar errores de parseo
      console.error(`Error ${res.status}: ${res.statusText}. Cuerpo del error: ${errorBody}`);
      throw new Error(`Error ${res.status}: ${res.statusText}. Detalle: ${errorBody}`);
    }

    const data = await res.json();
    console.log("Respuesta del servidor (destinos):", data);
    return NextResponse.json({ ok: true, result: data.destinos }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json(
        { ok: false, error: err.message }, // Cambiado a 'error' para consistencia con otros endpoints
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { ok: false, error: "Error desconocido al cargar destinos." },
        { status: 500 }
      );
    }
  }
}

export async function DELETE(request: Request) {
  const ciudad = await request.json();
  console.log("Eliminar la siguiente ciudad:", ciudad);

  try {
    // Obtener los headers de autenticación
    const authHeaders = await getAuthHeaders(BACKEND_API_URL);

    const res = await fetch(`${BACKEND_API_URL}/eliminarDestino`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders, // <-- ¡Añadir los headers de autenticación aquí!
      },
      body: JSON.stringify(ciudad),
    });

    const data = await res.json();
    console.log(data);

    if (res.ok) {
      console.log("Destino eliminado correctamente");
      return NextResponse.json({ ok: true, result: data }, { status: res.status });
    } else {
      console.error("Error del backend al eliminar destino:", data);
      return NextResponse.json({ ok: false, error: data.error || data.message || "Error desconocido del backend" }, { status: res.status });
    }
  } catch (error) {
    console.error("Error al enviar la solicitud de eliminación:", error);
    return NextResponse.json({ ok: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
