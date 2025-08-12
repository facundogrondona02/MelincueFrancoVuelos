// pages/api/mensaje/route.ts (o index.js en /mensaje)
import { NextResponse } from 'next/server';

const IA_API = process.env.IA_API_URL || 'http://localhost:5000'; // tu backend de IA

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("body ", body)
    const data = {
      mensaje: body.mensaje,
      multibusqueda: body.multibusqueda,
      carryon: body.carryon,
      bodega: body.bodega,
    };
console.log("DATA " , data)
    const authHeaders = {
      Authorization: req.headers.get('authorization') || '',
    };

    const response = await fetch(`${IA_API}/mensaje`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(data),
    });

    const rawText = await response.text(); // primero como texto
    let resData;

    try {
      resData = JSON.parse(rawText);
    } catch (jsonErr) {
      console.error('❌ Respuesta del backend IA no es JSON válido:', rawText);
      return NextResponse.json(
        {
          ok: false,
          error: 'Respuesta inválida del backend IA',
          details: rawText,
        },
        { status: response.status || 502 }
      );
    }

    if (response.ok && resData.status === 'recibido') {
      return NextResponse.json(
        {
          ok: true,
          result: resData.data,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          ok: false,
          error:
            resData.message ||
            resData.error ||
            'El scraping o el análisis falló',
          details: resData.details || resData.mensaje || rawText,
        },
        { status: response.status || 500 }
      );
    }
  } catch (err: any) {
    console.error('❌ Error general en /api/mensaje:', err);
    return NextResponse.json(
      {
        ok: false,
        error: 'Error interno en el endpoint /mensaje',
        details: err.message || 'Sin detalles',
      },
      { status: 500 }
    );
  }
}
