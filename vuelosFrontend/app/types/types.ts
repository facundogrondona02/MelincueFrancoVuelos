export type Currency = 'USD' | 'ARS' | 'EUR';

export type Stops = 'directo' | '1 escala' | '2 escalas';

export interface FlightFormData {
    mail: string;
    password: string;
    originDeparture: string;
    originReturn: string;
    departureDate: string;
    returnDate: string;
    adults: number;
    children: number;
    infants: number;
    currency: Currency;
    stops: Stops;
    checkedBaggage: boolean;
    horarioIdaEntre: string,
    horarioIdaHasta: string,
    horarioVueltaEntre: string,
    horarioVueltaHasta: string,
    maxDuracionIda: string; // horas
    maxDuracionVuelta: string;    // horas
}


export interface Mensaje{
    mensaje:string,
    multibusqueda:boolean,
    carryon:boolean,
    bodega:boolean
}

export interface FormData {
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