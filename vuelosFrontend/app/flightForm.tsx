"use client";
import React, { useState } from "react";
import { Mensaje } from "./types/types";
import "./globals.css";


const defaultMensaje: Mensaje = {
  mensaje: "",
  multibusqueda: false,
  carryon: true,
  bodega: false,
};

interface Props {
  onSubmit: (data: Mensaje) => void;
  loading?: boolean | null;
}

export function FlightForm({ onSubmit, loading }: Props) {
  const [formData, setFormData] = useState<Mensaje>(defaultMensaje);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const target = e.target as
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement;
    const { name, value, type } = target;
    setFormData((prev: Mensaje) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (target as HTMLInputElement).checked
          : type === "number"
          ? Number(value)
          : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("Datos del formulario de vuelo a enviar:", formData);
    onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="form-layout"> {/* Usa form-layout para el formulario completo */}
      {/* El título del formulario ya está en Home, así que lo quitamos de aquí si se muestra dentro de card-container */}
      {/* <h2 className="card-title">Formulario de búsqueda de vuelo</h2> */}

      <div className="form-group"> {/* Contenedor para el campo de mensaje */}
        <label htmlFor="mensaje" className="form-label">
          Mensaje cliente:
        </label>
        <textarea
          id="mensaje"
          name="mensaje"
          value={formData.mensaje}
          onChange={handleChange}
          required
          className="form-textarea"
          placeholder="Escribe tu mensaje aquí..."
        />
      </div>

      <div className="checkboxes-container"> {/* Contenedor para los checkboxes */}
        <div className="checkbox-group">
          <input
            id="multibusqueda"
            name="multibusqueda"
            type="checkbox"
            checked={formData.multibusqueda}
            onChange={handleChange}
            className="checkbox-input" 
          />
          <label htmlFor="multibusqueda" className="checkbox-label">Multi Búsqueda</label>
        </div>

        <div className="checkbox-group">
          <input
            id="carryon"
            name="carryon"
            type="checkbox"
            checked={formData.carryon}
            onChange={handleChange}
            className="checkbox-input"
          />
          <label htmlFor="carryon" className="checkbox-label">Carry on</label>
        </div>

        <div className="checkbox-group">
          <input
            id="bodega"
            name="bodega"
            type="checkbox"
            checked={formData.bodega}
            onChange={handleChange}
            className="checkbox-input"
          />
          <label htmlFor="bodega" className="checkbox-label">Equipaje de bodega</label>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading ? true : false}
        className="btn-primary form-submit-button" 
      >
        {loading ? "Buscando vuelos..." : "Buscar vuelos"}
      </button>
    </form>
  );
}
