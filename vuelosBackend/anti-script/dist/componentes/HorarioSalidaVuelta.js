import convertirHoraAPixeles from "../funciones/convertirHoraAPixeles.js";
export default async function HorarioSalidaVuelta({ page, inicioHoraVuelta, finHoraVuelta }) {
    // 1. Obtener el bounding box del slider de horario de salida
    const sliderVuelta = page.locator('.input-slider').nth(1); // el índice comienza en 0
    const boxVuelta = await sliderVuelta.boundingBox();
    if (!boxVuelta)
        throw new Error("No se pudo encontrar el slider");
    const anchoSliderVuelta = boxVuelta.width;
    const inicioXVuelta = convertirHoraAPixeles(inicioHoraVuelta, anchoSliderVuelta);
    const finXVuelta = convertirHoraAPixeles(finHoraVuelta, anchoSliderVuelta);
    // Obtener los spans hijos del slider usando locator
    const spans = await sliderVuelta.locator('span').all();
    // 3. Obtener los handles
    const startHandleVuelta = spans[1];
    const endHandleVuelta = spans[2];
    // 4. Calcular las coordenadas absolutas y mover
    await startHandleVuelta.hover();
    await page.mouse.down();
    await page.mouse.move(boxVuelta.x + inicioXVuelta, boxVuelta.y + boxVuelta.height / 2);
    await page.mouse.up();
    await endHandleVuelta.hover();
    await page.mouse.down();
    await page.mouse.move(boxVuelta.x + finXVuelta, boxVuelta.y + boxVuelta.height / 2);
    await page.mouse.up();
}
