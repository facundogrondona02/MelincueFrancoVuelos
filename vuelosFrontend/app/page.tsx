"use client";
import React, { useState } from "react";
import { FlightForm } from "./flightForm";
import { Mensaje, FormData } from "./types/types";
import { MostrarDestinos } from "./mostrarDestinos";

export default function Home() {
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [verForm, setVerForm] = useState<boolean>(false);

  // Función para enviar datos al backend para scraping
  const fetching = (data: Mensaje) => {
    setLoading(true);
    console.log("Enviando mensaje al backend para scraping:");
    fetch(`http://ia-api:3020/mensaje`, {
      method: "POST",
      body: JSON.stringify({ data }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Respuesta del servidor de scraping:", data.status);
        if (data.status === "recibido") {
          setMensaje(
            data.data || "Scraping exitoso, pero no se devolvió mensaje."
          );
        } else {
          setMensaje("El scraping falló: " + data.mensaje);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error al enviar el formulario de scraping:", error);
        setMensaje("Ocurrió un error al enviar el formulario de scraping.");
        setLoading(false);
      });
  };

  // Manejador para el envío del formulario de vuelo
  async function handleFlightFormSubmit(data: Mensaje) {
    console.log("Datos del formulario de vuelo recibidos en el cliente:", data);
    fetching(data);
  }

  // Función para guardar un nuevo destino (llamando al backend)
  async function guardarDestino(data: FormData) {
    console.log("Intentando guardar destino desde el Home:", data);
    await fetch(`http://backend:3030/crearDestino`, { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((res) => {
        console.log("Respuesta del servidor al crear destino:", res);
        if (res.ok) {
          console.log("Destino creado correctamente");
          setVerForm(false); // Vuelve a la vista del formulario de vuelo
        } else {
          console.error("Error al crear el destino:", res.mensaje || res.result);
        }
      })
      .catch((error) => {
        console.error("Error al enviar la solicitud para crear destino:", error);
      });
  }

  return (
    <main className="app-main-container"> {/* Clase actualizada */}
      <h1 className="app-main-title">Bienvenido a Vuelo Frontend</h1> {/* Clase actualizada */}

      {verForm ? (
        <div className="app-card-box"> {/* Clase actualizada */}
          <h2 className="app-card-title">Administrar Destinos</h2> {/* Clase actualizada */}
          <div className="app-button-group-main"> {/* Clase actualizada */}
            <button
              onClick={() => setVerForm(false)}
              className="app-btn-primary" 
            >
              Volver a Búsqueda
            </button>
          </div>
          <MostrarDestinos crearDestino={guardarDestino} />
        </div>
      ) : (
        <div className="app-card-box"> {/* Clase actualizada */}
          <h2 className="app-card-title">Formulario de búsqueda de vuelo</h2> {/* Clase actualizada */}
          <div className="app-button-group-main"> {/* Clase actualizada */}
            <button
              onClick={() => setVerForm(true)}
              className="app-btn-primary" 
            >
              Administrar Destinos
            </button>
          </div>
          <FlightForm onSubmit={handleFlightFormSubmit} loading={loading} />
          {loading ? (
            <p className="app-text-loading">Esperando respuesta del bot...</p> 
          ) : (
            mensaje && (
              <div className="app-result-flex-container"> {/* Clase actualizada */}
                <div className="app-card-box"> {/* Clase actualizada (result-box se combina con card-container) */}
                  <h2 className="app-result-title"> {/* Nueva clase específica para el título de resultado */}
                    ✈️ Detalles del vuelo
                  </h2>
                  <pre className="app-result-code"> {/* Clase actualizada */}
                    {typeof mensaje === "string"
                      ? mensaje
                      : JSON.stringify(mensaje)}
                  </pre>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </main>
  );
}
