import { useState } from "react";

// Tipo de datos
type Destino = {
  ciudad: string;
  origenVuelta: string;
  maxDuracionIda: string;
  maxDuracionVuelta: string;
  horarioIdaEntre: string;
  horarioIdaHasta: string;
  horarioVueltaEntre: string;
  horarioVueltaHasta: string;
  stops: string;
};

interface DestinosProps {
  destinos: Destino[];
  onSubmit: () => Promise<void>;
}

export function Destinos({ destinos, onSubmit }: DestinosProps) {
  const [modificar, setModificar] = useState(false);
  const [selectedDestino, setSelectedDestino] = useState<Destino | null>(null);

  const handleRowClick = (destino: Destino) => {
    setSelectedDestino(destino);
    setModificar(false);
  };

  const handleModificarClick = () => {
    if (selectedDestino) setModificar(true);
  };

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    campo: keyof Destino
  ) => {
    setSelectedDestino((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [campo]: e.target.value,
      };
    });
  };

  const modificacionFinal = async () => {
    if (!selectedDestino) return;
    console.log("selectDestino ", selectedDestino);
    try {
      const res = await fetch(
        `/api/destino`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(selectedDestino),
        }
      );
      const data = await res.json();

      if (res.ok) {
        onSubmit();
        setModificar(false);
        setSelectedDestino(null);
      } else {
        console.error("Error al modificar:", data.mensaje || res.statusText);
      }
    } catch (error) {
      console.error("Error al enviar la solicitud:", error);
    }
  };

  const eliminarFinal = async () => {
    if (!selectedDestino) return;

    try {
      const res = await fetch(`/api/destino`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ciudad: selectedDestino.ciudad }),
      });
      const data = await res.json();

      if (res.ok) {
        onSubmit();
        setModificar(false);
        setSelectedDestino(null);
      } else {
        console.error("Error al eliminar:", data.mensaje || res.statusText);
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  if (destinos.length === 0) {
    return <p>No hay destinos disponibles. ¡Crea uno!</p>;
  }

  return (
    <div className="table-data-wrapper">
      <div className="table-actions-group">
        <button
          onClick={() => {
            setSelectedDestino(null);
            setModificar(false);
          }}
          className="app-btn-primary"
        >
          Salir
        </button>
        <button
          onClick={handleModificarClick}
          disabled={!selectedDestino || modificar}
          className="app-btn-secondary"
        >
          Modificar
        </button>
        <button
          onClick={eliminarFinal}
          disabled={!selectedDestino || modificar}
          className="app-btn-danger"
        >
          Eliminar
        </button>
        {modificar && (
          <button onClick={modificacionFinal} className="app-btn-success">
            Guardar cambios
          </button>
        )}
      </div>

      <table className="table-main">
        <thead>
          <tr>
            <th>Ciudad</th>
            <th>Origen Vuelta</th>
            <th>Max Duración Ida</th>
            <th>Max Duración Vuelta</th>
            <th>Horario Ida Entre</th>
            <th>Horario Ida Hasta</th>
            <th>Horario Vuelta Entre</th>
            <th>Horario Vuelta Hasta</th>
            <th>Escalas</th>
          </tr>
        </thead>
        <tbody>
          {destinos.map((destino, index) => (
            <tr
              key={index}
              onClick={() => handleRowClick(destino)}
              className={
                selectedDestino?.ciudad === destino.ciudad
                  ? "table-row-selected"
                  : ""
              }
            >
              <td>{destino.ciudad}</td>

              {modificar && selectedDestino?.ciudad === destino.ciudad ? (
                <>
                  <td>
                    <input
                      value={selectedDestino.origenVuelta}
                      onChange={(e) => onChange(e, "origenVuelta")}
                      onClick={(e) => e.stopPropagation()}
                      className="editable-input"
                    />
                  </td>
                  <td>
                    <input
                      value={selectedDestino.maxDuracionIda}
                      onChange={(e) => onChange(e, "maxDuracionIda")}
                      onClick={(e) => e.stopPropagation()}
                      className="editable-input"
                    />
                  </td>
                  <td>
                    <input
                      value={selectedDestino.maxDuracionVuelta}
                      onChange={(e) => onChange(e, "maxDuracionVuelta")}
                      onClick={(e) => e.stopPropagation()}
                      className="editable-input"
                    />
                  </td>
                  <td>
                    <input
                      value={selectedDestino.horarioIdaEntre}
                      onChange={(e) => onChange(e, "horarioIdaEntre")}
                      onClick={(e) => e.stopPropagation()}
                      className="editable-input"
                    />
                  </td>
                  <td>
                    <input
                      value={selectedDestino.horarioIdaHasta}
                      onChange={(e) => onChange(e, "horarioIdaHasta")}
                      onClick={(e) => e.stopPropagation()}
                      className="editable-input"
                    />
                  </td>
                  <td>
                    <input
                      value={selectedDestino.horarioVueltaEntre}
                      onChange={(e) => onChange(e, "horarioVueltaEntre")}
                      onClick={(e) => e.stopPropagation()}
                      className="editable-input"
                    />
                  </td>
                  <td>
                    <input
                      value={selectedDestino.horarioVueltaHasta}
                      onChange={(e) => onChange(e, "horarioVueltaHasta")}
                      onClick={(e) => e.stopPropagation()}
                      className="editable-input"
                    />
                  </td>
                  <td>
                    <input
                      value={selectedDestino.stops}
                      onChange={(e) => onChange(e, "stops")}
                      onClick={(e) => e.stopPropagation()}
                      className="editable-input"
                    />
                  </td>
                </>
              ) : (
                <>
                  <td>{destino.origenVuelta}</td>
                  <td>{destino.maxDuracionIda}</td>
                  <td>{destino.maxDuracionVuelta}</td>
                  <td>{destino.horarioIdaEntre}</td>
                  <td>{destino.horarioIdaHasta}</td>
                  <td>{destino.horarioVueltaEntre}</td>
                  <td>{destino.horarioVueltaHasta}</td>
                  <td>{destino.stops}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
