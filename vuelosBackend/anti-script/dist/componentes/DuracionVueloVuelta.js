import calcularPixelesDesdeHoraMinima from "../funciones/calcularPixelesDesdeHoraMinima.js";
////////////////////
export async function ajustarSliderVueloVuelta({ page, horaDeseada, }) {
    var _a, _b, _c, _d;
    const slider = page.locator('.input-slider').nth(3);
    const boxSlider = await slider.boundingBox();
    if (!boxSlider)
        throw new Error("No se pudo encontrar el slider");
    const ancho = boxSlider.width;
    const horaMinimaParts = page.locator(".row-filter-content-slider").nth(1);
    const divs = await horaMinimaParts.locator("div").all();
    // Buscar el div que contiene exactamente dos span
    const targetDiv = [];
    for (const div of divs) {
        const spans = await div.locator("span").all();
        if (spans.length === 2) {
            targetDiv.push(div);
        }
    }
    // Ahora podés trabajar con targetDiv
    const horaMinimaText = targetDiv.length > 0 ? await targetDiv[1].locator("span").nth(0).textContent() : null;
    const horamaximaText = targetDiv.length > 0 ? await targetDiv[1].locator("span").nth(1).textContent() : null;
    const horaMinimaTextTrimmed = (_b = (_a = horaMinimaText === null || horaMinimaText === void 0 ? void 0 : horaMinimaText.split("hs")[0]) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "";
    const horamaximaTextTrimmed = (_d = (_c = horamaximaText === null || horamaximaText === void 0 ? void 0 : horamaximaText.split("hs")[0]) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : "";
    const pixelesDesdeMinima = calcularPixelesDesdeHoraMinima(horaMinimaTextTrimmed, horaDeseada, horamaximaTextTrimmed, ancho);
    const destinoX = boxSlider.x + pixelesDesdeMinima;
    const spans = await slider.locator('span').all();
    const endHandle = spans[2]; // Asumiendo que este es el handle derecho
    const boxHandle = await endHandle.boundingBox();
    if (!boxHandle)
        throw new Error("No se pudo obtener el handle");
    const handleX = boxHandle.x + boxHandle.width / 2;
    const handleY = boxHandle.y + boxHandle.height / 2;
    await endHandle.hover();
    await page.mouse.move(handleX, handleY);
    await page.mouse.down();
    await page.mouse.move(destinoX, handleY, { steps: 10 });
    await page.mouse.up();
}
