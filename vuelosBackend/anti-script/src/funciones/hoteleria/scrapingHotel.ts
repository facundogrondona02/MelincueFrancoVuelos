// getContextConSesionValida.ts
import { BrowserContext, chromium, Page } from "playwright";


export async function getContextConSesionValida() {
    const browser = await chromium.launch({ headless: true });
    const context: BrowserContext = await browser.newContext();
    const page: Page = await context.newPage();

    await page.goto("https://navigator.towertravel.com.ar/mainPage/hotels#!/hotel", {
        waitUntil: "networkidle"
    });

        await page.pause();

}
    

