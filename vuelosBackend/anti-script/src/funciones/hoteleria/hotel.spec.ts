import { test } from '@playwright/test';
import { chromium, BrowserContext, Page } from 'playwright';




test('scraping hoteles', async () => {
 
    const browser = await chromium.launch({ headless: false });
    const context: BrowserContext = await browser.newContext();
    const page: Page = await context.newPage();

    await page.goto("https://navigator.towertravel.com.ar/mainPage/hotels#!/hotel", {
        waitUntil: "networkidle"
    });
  await page.locator('.control').first().click();
  await page.getByRole('textbox', { name: 'Usuario o e-mail usuario@' }).fill('MELINCUE EVT');
  await page.locator('div:nth-child(4)').first().click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('Evtleg@14211');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.getByRole('textbox', { name: 'Buscar ciudad, aeropuerto,' }).click();
  await page.getByRole('textbox', { name: 'Buscar ciudad, aeropuerto,' }).fill('Punta Cana');
  await page.getByText('Punta Cana - República Dominicana', { exact: true }).dblclick();
  await page.getByRole('textbox', { name: 'Entrada' }).click();
  await page.locator('div:nth-child(2) > .ui-datepicker-calendar > tbody > tr:nth-child(3) > td:nth-child(2) > .ui-state-default').click();
  await page.locator('div:nth-child(2) > .ui-datepicker-calendar > tbody > tr:nth-child(4) > td:nth-child(5) > .ui-state-default').click();
  await page.locator('div').filter({ hasText: /^Listo$/ }).click();
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.getByRole('textbox', { name: 'Nombre del Hotel' }).click();
  await page.getByRole('textbox', { name: 'Nombre del Hotel' }).fill('Iberostar Waves Dominicana');
  await page.locator('li > .input-group > .input-group-addon').first().click();
  const page1Promise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Ver detalle' }).first().click();
  const page1 = await page1Promise;
  await page1.getByText('Premium Upper Floor').click();
  await page1.getByText('ALL INCLUSIVE').first().click();
  await page1.getByText('2.849,24').click();
  await page1.getByText('Premium Ocean View').click();
  await page1.getByText('ALL INCLUSIVE').nth(1).click();
  await page1.getByText('3.496,74').click();

        await page.pause();

});

