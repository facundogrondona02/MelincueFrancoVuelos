"use client";
import React, { useState } from "react";
import { FlightForm } from "./flightForm";
import { Mensaje, FormData } from "./types/types";
import { MostrarDestinos } from "./mostrarDestinos";

export default function Home() {
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [verForm, setVerForm] = useState<boolean>(false); // Función para enviar datos al backend para scraping

  const fetching = async (data: Mensaje) => {
    setLoading(true);
    console.log("Enviando mensaje al backend para scraping:", data);
    try {
      const res = await fetch("/api/route", {
        // <-- acá corregido
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      console.log("respuesta nashe ", json);

      if (json.result) {
        setMensaje(json.result);
      } else {
        setMensaje("Error: " + (json.error || "Error desconocido"));
      }
    } catch (e) {
      console.error("Error al conectar con el backend", e);
      setMensaje("Error de conexión");
    } finally {
      setLoading(false); // <-- importante para que se actualice la vista
    }
  };
  // Manejador para el envío del formulario de vuelo

  async function handleFlightFormSubmit(data: Mensaje) {
    console.log("Datos del formulario de vuelo recibidos en el cliente:", data);
    fetching(data);
  } // Función para guardar un nuevo destino (llamando al backend)

  async function guardarDestino(data: FormData) {
    console.log("Guardamos desde el front nashe:", data);
    try {
      const res = await fetch("/api/destino", {
        // <-- acá corregido
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      console.log("respuesta nashe ", json);

      console.log("Respuesta del servidor al crear destino:", res);
      if (json.ok) {
        console.log("Destino creado correctamente");
        setVerForm(false); // Vuelve a la vista del formulario de vuelo
      } else {
        console.error(
          "Error al crear el destino:",
          json.result
        );
      }

    } catch (e) {
        console.error(
          "Error al enviar la solicitud para crear destino:",
          e
        );
    } 
  }

  return (
   <main className="vuelo-main-container">
  <h1 className="vuelo-title">Formulario de búsqueda de vuelo</h1>

  {verForm ? (
    <div className="vuelo-card">
      <h2 className="vuelo-subtitle">Administrar Destinos</h2>
      <div className="vuelo-button-group">
        <button onClick={() => setVerForm(false)} className="vuelo-btn">
          Volver a Búsqueda
        </button>
      </div>
      <MostrarDestinos crearDestino={guardarDestino} />
    </div>
  ) : (
    <div className="vuelo-card">
      <div className="vuelo-button-group">
        <button onClick={() => setVerForm(true)} className="vuelo-btn">
          Administrar Destinos
        </button>
      </div>
      <FlightForm onSubmit={handleFlightFormSubmit} loading={loading} />

      {loading ? (
        <p className="vuelo-loading">Esperando respuesta del bot...</p>
      ) : (
        mensaje && (
          <div className="vuelo-result-box">
            <h2 className="vuelo-result-title">✈️ Detalles del vuelo</h2>
            <pre className="vuelo-result-content">
              {typeof mensaje === "string" ? mensaje : JSON.stringify(mensaje)}
            </pre>
          </div>
        )
      )}
    </div>
  )}
</main>
  );
}
