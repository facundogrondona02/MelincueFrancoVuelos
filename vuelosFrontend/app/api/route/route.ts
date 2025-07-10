// app/api/mensaje/route.ts
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const data = await request.json()

    const response = await fetch('http://ia-api:3020/mensaje', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const resData = await response.json()

    console.log("Retornando al frontend:", resData)
    console.log("Retornando al status:", resData.status)
    console.log("Retornando al data:", resData.data)

    if (resData.status === 'recibido') {
      console.log("entramos para retornar")
      return NextResponse.json(
        { ok: true, result: resData.data },
        { status: 200 }
      );
    } else {
      console.log("entramos para no retornar")
      return NextResponse.json(
        {
          ok: false,
          error: 'El scraping falló',
          details: resData.mensaje,
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error en la API interna:', error)
    return NextResponse.json(
      { ok: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
