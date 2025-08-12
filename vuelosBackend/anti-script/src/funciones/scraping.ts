import recorroListaVuelos from './recorroListaVuelos.js';
import DuracionVueloIda from '../componentes/DuracionVueloIda.js';
import { ajustarSliderVueloVuelta } from '../componentes/DuracionVueloVuelta.js';
import HorarioSalidaIda from '../componentes/HorarioSalidaIda.js';
import HorarioSalidaVuelta from '../componentes/HorarioSalidaVuelta.js';
import type { BrowserContext, Page } from 'playwright'; // Asegúrate de importar 'Page' también

// Asegúrate de importar o definir la interfaz/tipo VueloFinal antes de usarla
type VueloFinal = any; // Ajusta esto a tu tipo real de VueloFinal si lo tienes

interface ScrapingVuelosParams {
  mail: string;
  password: string;
  origenIda: string;
  origenVuelta: string;
  departureDate: string;
  returnDate: string;
  adults: number;
  children: number;
  infants: number;
  stops: string;
  checkedBaggage: boolean;
  horarioIdaEntre: string;
  horarioIdaHasta: string;
  horarioVueltaEntre: string;
  horarioVueltaHasta: string;
  maxDuracionIda: string;
  maxDuracionVuelta: string;
  carryon: boolean;
  bodega: boolean;
}

// --- Funciones auxiliares para simular comportamiento humano ---

// Lista de User-Agents comunes para rotar (ahora solo Chromium-based)
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/83.0.4103.88 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/83.0.4103.88 Mobile/15E148 Safari/604.1',
  // Puedes añadir más si encuentras que el sitio es muy estricto
];

/**
 * Retorna un User-Agent aleatorio de la lista.
 */
function getRandomUserAgent(): string {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

/**
 * Pausa la ejecución por un tiempo aleatorio.
 * @param minMs Mínimo de milisegundos a esperar.
 * @param maxMs Máximo de milisegundos a esperar.
 */
function getRandomDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = Math.random() * (maxMs - minMs) + minMs;
  console.log(`[Delay] Pausando por ${delay.toFixed(0)} ms...`);
  return new Promise(resolve => setTimeout(resolve, delay));
}

// --- Fin de funciones auxiliares ---

export async function scrapingVuelos(params: ScrapingVuelosParams & { context: BrowserContext }): Promise<VueloFinal | undefined> {
  const {
    origenIda,
    origenVuelta,
    departureDate,
    returnDate,
    adults,
    children,
    infants,
    stops,
    checkedBaggage,
    horarioIdaEntre,
    horarioIdaHasta,
    horarioVueltaEntre,
    horarioVueltaHasta,
    maxDuracionIda,
    maxDuracionVuelta,
    carryon,
    bodega,
    context,
  } = params;

  // 1. Crear una NUEVA PÁGINA para cada operación de scraping con User-Agent aleatorio
  // Se usa una aserción de tipo 'any' para el contexto al llamar a newPage()
  // Esto bypassa el error de TypeScript si las definiciones de tipo no son correctas,
  // pero la funcionalidad de Playwright subyacente sí acepta las opciones.
  const page = await (context as any).newPage({ // <-- CAMBIO AQUÍ: Asertion de tipo 'any'
    userAgent: getRandomUserAgent(), // <-- Aplicar User-Agent aleatorio
  });

  // Aumentar el timeout predeterminado para todas las acciones de la página
  page.setDefaultTimeout(60000); // Establece el timeout a 60 segundos (60000 ms)

  try {
    console.log(`Iniciando scraping para ${origenIda} a ${origenVuelta} el ${departureDate}.`);

    // 2. Navegar directamente a la URL de búsqueda y esperar carga completa
    // Cambiado a "domcontentloaded" para una carga más rápida del DOM
    await page.goto("https://aereos.sudameria.com/search", { timeout: 60000, waitUntil: "domcontentloaded" });
    
    // --- Pausa estratégica después de la navegación inicial ---

    // Asegura que el DOM está listo y da un pequeño respiro
    await page.waitForLoadState('domcontentloaded'); 
    await page.waitForTimeout(1000); // Pequeña pausa adicional para renderizado inicial

    // === ORIGEN Y DESTINO ===
    // Añadir una espera explícita para que el input esté visible y habilitado antes de interactuar
    const origenInput = page.getByRole('textbox', { name: 'BUE' });
    await origenInput.waitFor({ state: 'visible', timeout: 60000 }); // Espera 60s a que sea visible
    await origenInput.fill(origenIda);

    const destinoInput = page.getByRole('textbox', { name: 'MIA' });
    await destinoInput.waitFor({ state: 'visible', timeout: 60000 }); // Asegurar visibilidad
    await destinoInput.dblclick();
    await destinoInput.fill(origenVuelta);

    // === FECHAS ===
    const salidaInput = page.getByRole('textbox', { name: '24SEP' });
    await salidaInput.waitFor({ state: 'visible', timeout: 60000 });
    await salidaInput.click();
    await salidaInput.fill(departureDate);
    await page.keyboard.press('Escape');

    const regresoInput = page.getByRole('textbox', { name: '10OCT' });
    await regresoInput.waitFor({ state: 'visible', timeout: 60000 });
    await regresoInput.click();
    await regresoInput.fill(returnDate);
    await page.keyboard.press('Escape');
    console.log("ESTO ES NUEVO")
    // === PASAJEROS ===  
    const adultosInput = page.locator("//input[@placeholder='1' and contains(@class,'input search-input')]");
    const ninosInput = page.locator("//input[@placeholder='0' and contains(@class,'input search-input')]").nth(0);
    const infantesInput = page.locator("//input[@placeholder='0' and contains(@class,'input search-input')]").nth(1);

    await adultosInput.waitFor({ state: 'visible', timeout: 60000 }); // Asegurar visibilidad
    await adultosInput.fill(String(adults));

    await ninosInput.waitFor({ state: 'visible', timeout: 60000 }); // Asegurar visibilidad
    await ninosInput.fill(String(children));

    await infantesInput.waitFor({ state: 'visible', timeout: 60000 }); // Asegurar visibilidad
    await infantesInput.fill(String(infants));

    // === BÚSQUEDA AVANZADA ===
    await page.locator("//a[@title='Búsqueda avanzada (Ctrl+Shift+A)' and contains(@class,'link-btn')]").click();

    await page.locator("//*[@id='app']/div[3]/div[1]/div[2]/div[1]/div/div[4]/div").click();

    await page.locator("div.input-cont[data-bind*='allowedAlternateCurrencyCodes'] select").selectOption('USD');

    await page.locator('//*[@id="app"]/div[3]/div[1]/div[2]/div[2]/button[2]').click();

    // === ENVIAR BÚSQUEDA ===
    await page.locator('#lnkSubmit').click();

    // === FILTROS DE ESCALAS ===
    await page.locator('//*[@id="content"]/div/div[1]/div/div[2]/div[1]/button').waitFor({ state: 'visible' });
    await page.locator('//*[@id="content"]/div/div[1]/div/div[2]/div[1]/button').click();

    const dropdown = page.locator('div.rz-dropdown').filter({ hasText: 'Seleccionar' }).first();
    await dropdown.waitFor({ state: 'visible', timeout: 60000 });
    await dropdown.click();

    await page.getByRole('option').filter({ hasText: stops }).waitFor({ state: 'visible', timeout: 60000 });
    await page.getByRole('option').filter({ hasText: stops }).click();

    if (checkedBaggage) {
      await page.locator('label[for="Baggage0"]').waitFor({ state: 'visible', timeout: 60000 });
      await page.locator('label[for="Baggage0"]').click();
    }

    // === HORARIOS SALIDA Y VUELTA ===
    await HorarioSalidaIda({ page, inicioHoraIda: horarioIdaEntre, finHoraIda: horarioIdaHasta });

    await HorarioSalidaVuelta({ page, inicioHoraVuelta: horarioVueltaEntre, finHoraVuelta: horarioVueltaHasta });

    // === DURACIÓN MAXIMA VUELOS ===
    await DuracionVueloIda({ page, horaDeseada: maxDuracionIda });

    await ajustarSliderVueloVuelta({ page, horaDeseada: maxDuracionVuelta });

    // === EQUIPAJE CARRYON ===
    if (carryon) {
      const filas = await page.locator('div.rz-display-flex').all();
      for (const fila of filas) {
        const label = fila.locator('label');
        const textoLabel = await label.textContent();
        if (textoLabel?.trim() === 'Con CarryOn') {
          const box = fila.locator('.rz-chkbox-box');
          await box.waitFor({ state: 'visible', timeout: 60000 });
          await box.click();
          break; // Asumo que solo hay un checkbox de CarryOn
        }
      }
    }

    // === EQUIPAJE DE BODEGA ===
    if (bodega) {
      const filas = await page.locator('div.rz-display-flex').all();
      for (const fila of filas) {
        const label = fila.locator('label');
        const textoLabel = await label.textContent();
        if (textoLabel?.trim() === 'Con equipaje en bodega') {
          const box = fila.locator('.rz-chkbox-box');
          await box.waitFor({ state: 'visible', timeout: 60000 });
          await box.click();
          break; // Asumo que solo hay un checkbox de Bodega
        }
      }
    }

    // === APLICAR FILTROS ===
    await page.locator('//*[@id="app"]/div[3]/div[1]/div[2]/div[2]/button[3]').waitFor({ state: 'visible', timeout: 60000 });
    await page.locator('//*[@id="app"]/div[3]/div[1]/div[2]/div[2]/button[3]').click();

    // === ESPERAR RESULTADOS ===
    await page.waitForLoadState('networkidle');
    // await page.waitForTimeout(3000); // Esta pausa puede ser innecesaria si networkidle es efectivo

    const tablaCount = await page.locator('//*[@id="content"]/div/div[2]/table/tbody').count();
    const isVisible = await page.locator('//*[@id="content"]/div/div[2]/table/tbody').first().isVisible();

    if (tablaCount === 0 || !isVisible) {
      console.warn("⚠ No se encontraron resultados visibles.");
      return undefined; // Retorna undefined en lugar de un return vacío
    }

    // === RECORRER LISTA DE VUELOS ===
    // await page.waitForTimeout(3000); // Puedes añadir una pausa aquí si recorroListaVuelos es muy rápido

    const res = await recorroListaVuelos(page);

    if (typeof res === "string") {
      if (res === "No hay ningun vuelo disponible con estas opciones") {
        console.warn("⚠ No hay ningún vuelo disponible con estas opciones.");
        return undefined;
      }
    } else {
      res.adults = adults;
      res.children = children;
      res.infants = infants;
    }

    return res;
  } catch (error) {
    console.error(`❌ Error durante la búsqueda para ${origenIda} a ${origenVuelta} el ${departureDate}:`, error);
    return undefined;
  } finally {
    // 4. Cerrar la página INDIVIDUALMENTE al finalizar cada scrapingVuelos
    // Esto es CRUCIAL para liberar recursos del navegador en cada operación.
    if (page) { // Asegúrate de que 'page' esté definido antes de intentar cerrarlo
      console.log(`🧹 Cerrando página para ${origenIda} a ${origenVuelta}...`);
      await page.close();
    }
  }
}
