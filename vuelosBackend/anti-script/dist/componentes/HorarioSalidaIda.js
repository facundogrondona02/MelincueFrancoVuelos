import convertirHoraAPixeles from "../funciones/convertirHoraAPixeles.js";
export default async function HorarioSalidaIda({ page, inicioHoraIda, finHoraIda }) {
    const slider = page.locator('.input-slider').nth(0);
    const box = await slider.boundingBox();
    if (!box)
        throw new Error("No se pudo encontrar el slider");
    const anchoSlider = box.width;
    const inicioX = convertirHoraAPixeles(inicioHoraIda, anchoSlider);
    const finX = convertirHoraAPixeles(finHoraIda, anchoSlider);
    // 3. Obtener los handles
    const handles = page.locator('.rz-slider .rz-slider-handle');
    const startHandle = handles.nth(0);
    const endHandle = handles.nth(1);
    // 4. Calcular las coordenadas absolutas y mover
    await startHandle.hover();
    await page.mouse.down();
    await page.mouse.move(box.x + inicioX, box.y + box.height / 2);
    await page.mouse.up();
    await endHandle.hover();
    await page.mouse.down();
    await page.mouse.move(box.x + finX, box.y + box.height / 2);
    await page.mouse.up();
}
