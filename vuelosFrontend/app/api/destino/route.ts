// app/api/mensaje/route.ts
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("Intentando guardar destino desde el Home:", data);

    const response = await fetch(`http://backend:3030/crearDestino`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data), // ✅ ¡Ahora sí!
    });

    const res = await response.json();
    console.log("Respuesta del servidor al crear destino:", res);

    if (res.ok) {
      console.log("Destino creado correctamente");
      return NextResponse.json({ ok: true, result: res.result }, { status: 200 });
    } else {
      return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
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

    const response = await fetch(`http://backend:3030/modificarDestinos`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data), // ✅ ¡Ahora sí!
    });

    const res = await response.json();
    console.log("Respuesta del servidor al crear destino:", res);

    if (res.ok) {
      console.log("Destino actualizado correctamente");
      return NextResponse.json({ ok: true, result: res.result }, { status: 200 });
    } else {
      return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
    }
  } catch (error) {
    console.error("Error al enviar la solicitud para crear destino:", error);
    return NextResponse.json({ ok: false, error: "Error interno del servidor" }, { status: 500 });
  }
}


export async function GET() {
  try {
    const res = await fetch(
      `http://backend:3030/destinos`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    console.log("Respuesta del servidor (destinos):", data);
    return NextResponse.json({ ok: true, result: data.destinos }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json(
        { ok: true, result: err.message },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { ok: true, result: "Error desconocido al cargar destinos." },
        { status: 500 }
      );
    }
  }
}

export async function DELETE(request: Request) {

  const ciudad = await request.json();
  console.log("ELiminar la siguiente ciudad=> ", ciudad)
  try {
    const res = await fetch(`http://backend:3030/eliminarDestino`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ciudad ),
    });
    const data = await res.json();
    console.log(data);
    if (res.ok) {
      console.log("Destino creado correctamente");
      return NextResponse.json({ ok: true, result: data }, { status: 200 });
    } else {
      return NextResponse.json({ ok: false, error: data }, { status: 400 });
    }
  } catch (error) {
    console.error("Error al enviar la solicitud de eliminación:", error);
    // Aquí podrías mostrar un mensaje de error al usuario
  }
}
