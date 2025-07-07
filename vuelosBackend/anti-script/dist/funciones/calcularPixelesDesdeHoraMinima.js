export default function calcularPixelesDesdeHoraMinima(horaMinima, horaDeseada, horaMaxima, anchoSlider) {
    const toMinutos = (hora) => {
        const [h, m] = hora.split(':').map(Number);
        return h * 60 + m;
    };
    const minMinutos = toMinutos(horaMinima);
    const deseadoMinutos = toMinutos(horaDeseada);
    const maxMinutos = toMinutos(horaMaxima);
    const rangoTotal = maxMinutos - minMinutos;
    const deltaDeseado = deseadoMinutos - minMinutos;
    const posicionX = (deltaDeseado * anchoSlider) / rangoTotal;
    return posicionX;
}
