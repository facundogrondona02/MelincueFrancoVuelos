"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const playwright_1 = require("playwright");
(0, test_1.test)('scraping hoteles', () => __awaiter(void 0, void 0, void 0, function* () {
    const browser = yield playwright_1.chromium.launch({ headless: false });
    const context = yield browser.newContext();
    const page = yield context.newPage();
    yield page.goto("https://navigator.towertravel.com.ar/mainPage/hotels#!/hotel", {
        waitUntil: "networkidle"
    });
    yield page.locator('.control').first().click();
    yield page.getByRole('textbox', { name: 'Usuario o e-mail usuario@' }).fill('MELINCUE EVT');
    yield page.locator('div:nth-child(4)').first().click();
    yield page.getByRole('textbox', { name: 'Contraseña' }).fill('Evtleg@14211');
    yield page.getByRole('button', { name: 'Ingresar' }).click();
    yield page.getByRole('textbox', { name: 'Buscar ciudad, aeropuerto,' }).click();
    yield page.getByRole('textbox', { name: 'Buscar ciudad, aeropuerto,' }).fill('Punta Cana');
    yield page.getByText('Punta Cana - República Dominicana', { exact: true }).dblclick();
    yield page.getByRole('textbox', { name: 'Entrada' }).click();
    yield page.locator('div:nth-child(2) > .ui-datepicker-calendar > tbody > tr:nth-child(3) > td:nth-child(2) > .ui-state-default').click();
    yield page.locator('div:nth-child(2) > .ui-datepicker-calendar > tbody > tr:nth-child(4) > td:nth-child(5) > .ui-state-default').click();
    yield page.locator('div').filter({ hasText: /^Listo$/ }).click();
    yield page.getByRole('button', { name: 'Buscar' }).click();
    yield page.getByRole('textbox', { name: 'Nombre del Hotel' }).click();
    yield page.getByRole('textbox', { name: 'Nombre del Hotel' }).fill('Iberostar Waves Dominicana');
    yield page.locator('li > .input-group > .input-group-addon').first().click();
    const page1Promise = page.waitForEvent('popup');
    yield page.getByRole('button', { name: 'Ver detalle' }).first().click();
    const page1 = yield page1Promise;
    yield page1.getByText('Premium Upper Floor').click();
    yield page1.getByText('ALL INCLUSIVE').first().click();
    yield page1.getByText('2.849,24').click();
    yield page1.getByText('Premium Ocean View').click();
    yield page1.getByText('ALL INCLUSIVE').nth(1).click();
    yield page1.getByText('3.496,74').click();
    yield page.pause();
}));
