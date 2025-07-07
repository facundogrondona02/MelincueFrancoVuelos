import { useEffect, useState } from "react";
import { DestinoForm } from "./destinoForm"; // Asume que este componente también será estilizado
import { Destinos } from "./destinos"; // Asume que este componente también será estilizado
// import "./globals.css"; // NO IMPORTAR AQUÍ. Se importa globalmente en layout.tsx

type Destino = {
  ciudad: string;
  origenVuelta: string;
  maxDuracionIda: string; // Corregido: 'strings' a 'string'
  maxDuracionVuelta: string;
  horarioIdaEntre: string;
  horarioIdaHasta: string;
  horarioVueltaEntre: string;
  horarioVueltaHasta: string;
  stops: string;
};

interface MostrarDestinosProps {
  crearDestino: (destino: Destino) => void;
}

export function MostrarDestinos({ crearDestino }: MostrarDestinosProps) {
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [vista, setVista] = useState<"ver" | "crear">("ver"); // Usar uniones literales para mayor claridad

  async function fetchData() {
    setLoading(true); // Se debe establecer a true cada vez que se inicia un fetch
    setError(null); // Limpiar errores anteriores
    try {
      const res = await fetch(`http://backend:3030/destinos`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      console.log("Respuesta del servidor (destinos):", data);
      setDestinos(data.destinos || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error desconocido al cargar destinos.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <div className="app-text-loading">Cargando destinos...</div>; {/* Clase actualizada */}
  }

  if (error) {
    return <div className="app-text-error">Error: {error}</div>; {/* Clase actualizada */}
  }

  const verCrearDestino = () => {
    setVista("crear");
  };

  const verDestino = () => {
    setVista("ver");
    fetchData(); // Recargar los destinos al volver a la vista de "ver"
  };

  return (
    <div className="app-form-layout"> {/* Clase actualizada */}
      <h2 className="app-card-title">Destinos disponibles:</h2> {/* Clase actualizada */}

      <div className="app-button-group-main"> {/* Clase actualizada */}
        <button
          disabled={vista === "ver"}
          onClick={verDestino}
          className="app-btn-primary" // Clase actualizada
        >
          Ver Destinos
        </button>
        <button
          disabled={vista === "crear"}
          onClick={verCrearDestino}
          className="app-btn-primary" // Clase actualizada
        >
          Crear Destino
        </button>
      </div>
      {vista === "crear" ? (
        <DestinoForm onSubmit={crearDestino} />
      ) : (
        <Destinos destinos={destinos} onSubmit={fetchData} />
      )}
    </div>
  );
}
