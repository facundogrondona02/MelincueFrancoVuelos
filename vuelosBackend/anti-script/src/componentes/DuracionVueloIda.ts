import { Page } from "@playwright/test";
import calcularPixelesDesdeHoraMinima from "../funciones/calcularPixelesDesdeHoraMinima.js";

export default async function DuracionVueloIda({
  page,
  horaDeseada,
}: {
  page: Page,
  horaDeseada: string
}) {

  // 1. Localizar el slider
  const sliderVueloIda = page.locator('.input-slider').nth(2); 
  const boxVueloIda = await sliderVueloIda.boundingBox();
  if (!boxVueloIda) throw new Error("No se pudo encontrar el slider de duración de vuelo");

  const anchoVueloIda = boxVueloIda.width;

  const horaMinimaParts = await page.locator(".row-filter-content-slider").nth(1)
  const divs = await horaMinimaParts.locator("div").all();

  // Buscar el div que contiene exactamente dos span
  const targetDiv: typeof divs = [];
  for (const div of divs) {
    const spans = await div.locator("span").all();
    
    if (spans.length === 2) {
      targetDiv.push(div);
      break;
    }
  }

  // Ahora podés trabajar con targetDiv
  const horaMinimaText = targetDiv.length > 0 ? await targetDiv[0].locator("span").nth(0).textContent() : null;
  const horamaximaText = targetDiv.length > 0 ? await targetDiv[0].locator("span").nth(1).textContent() : null;

  const horaMinimaTextTrimmed = horaMinimaText?.split("hs")[0]?.trim()
  const horamaximaTextTrimmed = horamaximaText?.split("hs")[0]?.trim() 
 if (
  typeof horaMinimaTextTrimmed !== 'string' ||
  typeof horaDeseada !== 'string' ||
  typeof horamaximaTextTrimmed !== 'string'
) {
  throw new Error(`Al menos una hora no es string: 
    horaMinima='${horaMinimaTextTrimmed}', 
    horaDeseada='${typeof(horaDeseada) }', 
    horaMaxima='${horamaximaTextTrimmed}'`);
}

  const pixelesDeseados = calcularPixelesDesdeHoraMinima(horaMinimaTextTrimmed, horaDeseada, horamaximaTextTrimmed, anchoVueloIda);
  const destinoX = boxVueloIda.x + pixelesDeseados;

  // 4. Obtener los handles (spans internos del slider)
  const spansVueloIda = await sliderVueloIda.locator('span').all();
  const endHandleVueloIda = spansVueloIda[2]; // handle derecho

  // 5. Obtener posición actual del handle derecho
  const boxHandleDerecho = await endHandleVueloIda.boundingBox();
  if (!boxHandleDerecho) throw new Error("No se pudo obtener el handle derecho");

  const handleActualX = boxHandleDerecho.x + boxHandleDerecho.width / 2;
  const handleY = boxHandleDerecho.y + boxHandleDerecho.height / 2;
  // 6. Mover el handle derecho hasta la posición deseada
  await endHandleVueloIda.hover();
  await page.mouse.move(handleActualX, handleY);
  await page.mouse.down();
  await page.mouse.move(destinoX, handleY, { steps: 10 });//esta linea falla
  await page.mouse.up();

}
