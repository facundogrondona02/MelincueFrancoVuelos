export default function convertirHoraAPixeles(hora: string, anchoSlider: number): number {
  const maxIntentos = 4;
  let intentos = 0;

  while (intentos < maxIntentos) {
    try {
      const [h, m] = hora.split(':').map(Number);
      if (isNaN(h) || isNaN(m)) throw new Error('Formato inválido de hora');

      const minutos = h * 60 + m;
      const totalMinutos = 24 * 60;

      return (minutos / totalMinutos) * anchoSlider;
    } catch (error) {
      intentos++;
      if (intentos >= maxIntentos) {
        console.error(`Error al convertir la hora tras ${intentos} intentos:`, error);
        throw error; // o return 0, o -1, o lo que tenga sentido en tu app
      }
    }
  }

  // Este return es solo por seguridad, nunca debería llegar acá
  throw new Error('Fallo inesperado en convertirHoraAPixeles');
}
