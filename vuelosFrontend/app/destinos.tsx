import { useState } from "react";
// NO IMPORTAR './globals.css' AQUÍ. Se importa globalmente en layout.tsx

import { DestinoForm } from "./destinoForm"; // Asume que este componente también será estilizado

// Definición del tipo Destino
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
  onSubmit: () => Promise<void>; // Función para recargar los destinos
}

export function Destinos({ destinos, onSubmit }: DestinosProps) {
  console.log("Destinos recibidos en componente Destinos:", destinos); // <- Este log es clave
  const [modificar, setModificar] = useState(false);
  // Usamos el objeto Destino completo para la fila seleccionada y para modificar
  const [selectedDestino, setSelectedDestino] = useState<Destino | null>(null); 

  // Maneja la selección de una fila
  const handleRowClick = (destino: Destino) => {
    setSelectedDestino(destino);
    setModificar(false); // Asegurarse de que no esté en modo modificar al seleccionar una nueva fila
  };

  // Activa el modo de modificación para el destino seleccionado
  const handleModificarClick = () => {
    if (selectedDestino) {
      setModificar(true);
    }
  };

  // Maneja los cambios en los campos de input durante la modificación
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

  // Envía los cambios de modificación al backend
  const modificacionFinal = async () => {
    if (!selectedDestino) return; // No hacer nada si no hay destino seleccionado

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/modificarDestinos`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedDestino),
      });
      const data = await res.json();

      console.log("Respuesta del servidor:", data);
      if (res.ok) {
        console.log("Destino modificado correctamente");
        onSubmit(); // Recargar la lista de destinos
        setModificar(false);
        setSelectedDestino(null); // Deseleccionar
      } else {
        console.error("Error al modificar el destino:", data.mensaje || res.statusText);
        // Aquí podrías mostrar un mensaje de error al usuario
      }
    } catch (error) {
      console.error("Error al enviar la solicitud de modificación:", error);
      // Aquí podrías mostrar un mensaje de error al usuario
    }
  };

  // Elimina el destino seleccionado
  const eliminarFinal = async () => {
    if (!selectedDestino) return; // No hacer nada si no hay destino seleccionado

    console.log("Eliminando ciudad: ", selectedDestino.ciudad);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/eliminarDestino`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ciudad: selectedDestino.ciudad }),
      });
      const data = await res.json();
      console.log(data);
      if (res.ok) {
        onSubmit(); // Recargar la lista de destinos
        setModificar(false);
        setSelectedDestino(null); // Deseleccionar
      } else {
        console.error("Error al eliminar el destino:", data.mensaje || res.statusText);
        // Aquí podrías mostrar un mensaje de error al usuario
      }
    } catch (error) {
      console.error("Error al enviar la solicitud de eliminación:", error);
      // Aquí podrías mostrar un mensaje de error al usuario
    }
  };

  // Si no hay destinos, muestra un mensaje
  if (destinos.length === 0) {
    return <p className="app-text-loading">No hay destinos disponibles. ¡Crea uno!</p>;
  }

  return (
    <div className="table-data-wrapper"> {/* Nuevo nombre de clase */}
      {/* Grupo de botones de acción para la tabla */}
      <div className="table-actions-group"> {/* Nuevo nombre de clase */}
        <button
          onClick={() => {
            setSelectedDestino(null); // Deseleccionar
            setModificar(false); // Salir del modo modificar
          }}
          className="app-btn-primary" // Nuevo nombre de clase
        >
          Salir
        </button>
        <button
          onClick={handleModificarClick}
          disabled={!selectedDestino || modificar} // Deshabilitado si no hay selección o ya está modificando
          className="app-btn-secondary" // Nuevo nombre de clase
        >
          Modificar
        </button>
        <button
          onClick={eliminarFinal}
          disabled={!selectedDestino || modificar} // Deshabilitado si no hay selección o está modificando
          className="app-btn-danger" // Nuevo nombre de clase
        >
          Eliminar
        </button>
      </div>

      <table className="table-main"> {/* Nuevo nombre de clase */}
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
          {destinos.map((destino, index) => ( // Usamos index como key temporal
            <tr
              key={index}
              onClick={() => handleRowClick(destino)}
              className={selectedDestino?.ciudad === destino.ciudad ? "table-row-selected" : ""} 
            >
              {/* Columna de Ciudad: Siempre muestra el texto del destino */}
              <td>
                {destino.ciudad}
              </td>

              {/* Resto de las columnas: Siempre muestran el texto del destino */}
              <td>{destino.origenVuelta}</td>
              <td>{destino.maxDuracionIda}</td>
              <td>{destino.maxDuracionVuelta}</td>
              <td>{destino.horarioIdaEntre}</td>
              <td>{destino.horarioIdaHasta}</td>
              <td>{destino.horarioVueltaEntre}</td>
              <td>{destino.horarioVueltaHasta}</td>
              <td>{destino.stops}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
