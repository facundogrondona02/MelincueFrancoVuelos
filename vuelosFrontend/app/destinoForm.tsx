import React, { useState, useEffect } from "react";

// Definición del tipo Destino (debe coincidir con los otros componentes)
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

interface DestinoFormProps {
  onSubmit: (data: Destino) => void;
  initialData?: Destino | null; // Nueva prop para datos iniciales (en caso de edición)
}

export function DestinoForm({ onSubmit, initialData }: DestinoFormProps) {
  const [formData, setFormData] = useState<Destino>(
    initialData || { // Si hay initialData, úsala; de lo contrario, usa valores vacíos
      ciudad: "",
      origenVuelta: "",
      maxDuracionIda: "",
      maxDuracionVuelta: "",
      horarioIdaEntre: "",
      horarioIdaHasta: "",
      horarioVueltaEntre: "",
      horarioVueltaHasta: "",
      stops: "",
    }
  );

  // useEffect para actualizar el formulario si initialData cambia (ej. al seleccionar otro destino para editar)
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      // Si initialData es null o undefined, resetea el formulario para una nueva creación
      setFormData({
        ciudad: "",
        origenVuelta: "",
        maxDuracionIda: "",
        maxDuracionVuelta: "",
        horarioIdaEntre: "",
        horarioIdaHasta: "",
        horarioVueltaEntre: "",
        horarioVueltaHasta: "",
        stops: "",
      });
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("DATA DEL NUEVO DESTINO ", formData)
    onSubmit(formData); // Llama a la función onSubmit pasada por props
  };

  return (
    <form onSubmit={handleSubmit} className="app-form-layout"> {/* Clase actualizada */}
      <div className="app-form-group"> {/* Clase actualizada */}
        <label htmlFor="ciudad" className="app-form-label">Ciudad:</label> {/* Clase actualizada */}
        <input
          type="text"
          id="ciudad"
          name="ciudad"
          value={formData.ciudad}
          onChange={handleChange}
          className="app-form-input" 
          required
          disabled={!!initialData} // Deshabilita la edición de la ciudad si es una modificación
        />
      </div>
      <div className="app-form-group">
        <label htmlFor="origenVuelta" className="app-form-label">Origen/Vuelta (Código IATA):</label>
        <input
          type="text"
          id="origenVuelta"
          name="origenVuelta"
          value={formData.origenVuelta}
          onChange={handleChange}
          className="app-form-input"
          required
        />
      </div>
      <div className="app-form-group">
        <label htmlFor="maxDuracionIda" className="app-form-label">Max Duración Ida (horas):</label>
        <input
          type="text"
          id="maxDuracionIda"
          name="maxDuracionIda"
          value={formData.maxDuracionIda}
          onChange={handleChange}
          className="app-form-input"
          required
        />
      </div>
      <div className="app-form-group">
        <label htmlFor="maxDuracionVuelta" className="app-form-label">Max Duración Vuelta (horas):</label>
        <input
          type="text"
          id="maxDuracionVuelta"
          name="maxDuracionVuelta"
          value={formData.maxDuracionVuelta}
          onChange={handleChange}
          className="app-form-input"
          required
        />
      </div>
      <div className="app-form-group">
        <label htmlFor="horarioIdaEntre" className="app-form-label">Horario Ida Entre (HH:MM):</label>
        <input
          type="text"
          id="horarioIdaEntre"
          name="horarioIdaEntre"
          value={formData.horarioIdaEntre}
          onChange={handleChange}
          className="app-form-input"
          required
        />
      </div>
      <div className="app-form-group">
        <label htmlFor="horarioIdaHasta" className="app-form-label">Horario Ida Hasta (HH:MM):</label>
        <input
          type="text"
          id="horarioIdaHasta"
          name="horarioIdaHasta"
          value={formData.horarioIdaHasta}
          onChange={handleChange}
          className="app-form-input"
          required
        />
      </div>
      <div className="app-form-group">
        <label htmlFor="horarioVueltaEntre" className="app-form-label">Horario Vuelta Entre (HH:MM):</label>
        <input
          type="text"
          id="horarioVueltaEntre"
          name="horarioVueltaEntre"
          value={formData.horarioVueltaEntre}
          onChange={handleChange}
          className="app-form-input"
          required
        />
      </div>
      <div className="app-form-group">
        <label htmlFor="horarioVueltaHasta" className="app-form-label">Horario Vuelta Hasta (HH:MM):</label>
        <input
          type="text"
          id="horarioVueltaHasta"
          name="horarioVueltaHasta"
          value={formData.horarioVueltaHasta}
          onChange={handleChange}
          className="app-form-input"
          required
        />
      </div>
      <div className="app-form-group">
        <label htmlFor="stops" className="app-form-label">Escalas (número):</label>
        <input
          type="text"
          id="stops"
          name="stops"
          value={formData.stops}
          onChange={handleChange}
          className="app-form-input"
          required
        />
      </div>
      <button type="submit" className="app-form-submit-btn"> {/* Clase actualizada */}
        {initialData ? "Modificar Destino" : "Crear Destino"}
      </button>
    </form>
  );
}
