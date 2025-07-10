import recorroListaVuelos from './recorroListaVuelos.js';
import DuracionVueloIda from '../componentes/DuracionVueloIda.js';
import { ajustarSliderVueloVuelta } from '../componentes/DuracionVueloVuelta.js';
import HorarioSalidaIda from '../componentes/HorarioSalidaIda.js';
// import HorarioSalidaVuelta from './componentes/HorarioSalidaVuelta';
import type { BrowserContext } from 'playwright';
import HorarioSalidaVuelta from '../componentes/HorarioSalidaVuelta.js';

// ... (tus interfaces y tipos)

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

// Asegúrate de importar o definir la interfaz/tipo VueloFinal antes de usarla
// Ejemplo de importación (ajusta la ruta según corresponda):
// import type { VueloFinal } from '../../componentes/TiposVuelo';

// O define un tipo temporal si no tienes el tipo aún:
type VueloFinal = any;

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

  // 1. Crear una NUEVA PÁGINA para cada operación de scraping
  const page = await context.newPage();

  try {
    console.log(`Iniciando scraping para ${origenIda} a ${origenVuelta} el ${departureDate}.`);

    // 2. Navegar directamente a la URL de búsqueda (o de inicio) y esperar carga completa
    // Esto asegura que cada página comience desde un estado limpio y conocido.
    await page.goto("https://aereos.sudameria.com/search", { waitUntil: "networkidle" });
    // Espera adicional para que los elementos iniciales de la página de búsqueda estén presentes
    // === ORIGEN Y DESTINO ===
    await page.waitForSelector('input[placeholder]', { state: 'visible', timeout: 15000 });
    await page.waitForLoadState('domcontentloaded'); // Asegura que el DOM está listo
    await page.waitForTimeout(1000); // Pequeña pau

    const origenInput = page.getByRole('textbox', { name: 'BUE' });
    if (await origenInput.isVisible()) {
      await origenInput.fill(origenIda);
    }

    const destinoInput = page.getByRole('textbox', { name: 'MIA' });
    if (await destinoInput.isVisible()) {
      await destinoInput.dblclick();
      await destinoInput.fill(origenVuelta);
    }

    // === FECHAS ===
    // --- INTERACCIÓN CON FECHAS (MUY CRÍTICO) ---
    // Selector para el campo de salida (puedes verificar si es '24SEP' o 'DDMMM')
    const salidaInput = page.getByPlaceholder('24SEP'); // Este placeholder puede cambiar, verifica el HTML
    await salidaInput.waitFor({ state: 'visible', timeout: 20000 });
    await salidaInput.click(); // Click para activar el input y posible calendario/selector
    await salidaInput.fill(departureDate);
    await page.keyboard.press('Escape'); // Intenta cerrar cualquier calendario emergente que pueda interferir
    await page.waitForTimeout(1000); // Espera que el input de fecha se asiente

    const regresoInput = page.getByPlaceholder('10OCT'); // Este placeholder puede cambiar
    await regresoInput.waitFor({ state: 'visible', timeout: 10000 });
    await regresoInput.click();
    await regresoInput.fill(returnDate);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    //*[@id="frm"]/div[1]/div[4]/div //*[@id="frm"]/div[1]/div[4]/div/div[1]/div[1]/span[1]/input[1]    //*[@id="meRAIlqldU"]/span/button   meRAIlqldU
    //     // === PASAJEROS ===   
    const adultosInput = page.locator("//input[@placeholder='1' and contains(@class,'input search-input')]");
    const ninosInput = page.locator("//input[@placeholder='0' and contains(@class,'input search-input')]").nth(0);
    const infantesInput = page.locator("//input[@placeholder='0' and contains(@class,'input search-input')]").nth(1);

    await adultosInput.fill(String(adults));

    await ninosInput.fill(String(children));

    await infantesInput.fill(String(infants));

    // === BÚSQUEDA AVANZADA ===
    await page.locator("//a[@title='Búsqueda avanzada (Ctrl+Shift+A)' and contains(@class,'link-btn')]").click();

    await page.locator("//*[@id='app']/div[3]/div[1]/div[2]/div[1]/div/div[4]/div").click();

    await page.locator("div.input-cont[data-bind*='allowedAlternateCurrencyCodes'] select").selectOption('USD');
    await page.locator('//*[@id="app"]/div[3]/div[1]/div[2]/div[2]/button[2]').click();

    // === ENVIAR BÚSQUEDA ===
    await page.locator('#lnkSubmit').click();

    // === FILTROS DE ESCALAS ===

    await page.locator('//*[@id="content"]/div/div[1]/div/div[2]/div[1]/button').click();

    const dropdown = page.locator('div.rz-dropdown').filter({ hasText: 'Seleccionar' }).first();
    await dropdown.click();

    await page.getByRole('option').filter({ hasText: stops }).click();

    if (checkedBaggage) {
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
      // await page.locator('div.rz-chkbox-box').nth(15).click();
      // await page.locator('div.rz-chkbox-box').nth(17).click();
      const filas = await page.locator('div.rz-display-flex').all();

      for (const fila of filas) {
        const label = fila.locator('label');

        const textoLabel = await label.textContent();
        if (textoLabel?.trim() === 'Con CarryOn') {
          // Ir al hermano: <div class="rz-chkbox-box"> dentro de <div class="rz-chkbox">
          const box = fila.locator('.rz-chkbox-box');
          await box.click();
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
          // Ir al hermano: <div class="rz-chkbox-box"> dentro de <div class="rz-chkbox">
          const box = fila.locator('.rz-chkbox-box');
          await box.click();
        }
      }
    }


    // === APLICAR FILTROS ===
    await page.locator('//*[@id="app"]/div[3]/div[1]/div[2]/div[2]/button[3]').click();


    // === ESPERAR RESULTADOS ===
    await page.waitForLoadState('networkidle');
    // await page.waitForTimeout(3000);

    const tablaCount = await page.locator('//*[@id="content"]/div/div[2]/table/tbody').count();
    const isVisible = await page.locator('//*[@id="content"]/div/div[2]/table/tbody').first().isVisible();

    if (tablaCount === 0 || !isVisible) {
      console.warn("⚠ No se encontraron resultados visibles.");
      return;
    }

    // === RECORRER LISTA DE VUELOS ===
    // await page.waitForTimeout(3000);

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
    // await page.close();
  }
}