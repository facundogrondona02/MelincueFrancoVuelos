// getContextConSesionValida.ts
import { chromium } from "playwright";
export async function getContextConSesionValida() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("https://navigator.towertravel.com.ar/mainPage/hotels#!/hotel", {
        waitUntil: "networkidle"
    });
    await page.pause();
}
