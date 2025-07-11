import { BrowserContext, chromium } from "playwright";
import { hacerLogin } from "./hacerLogin.js";

const sessionPath = 'session.json';

interface GetContextParams {
  mail: string;
  password: string;
}

export async function getContextConSesionValida({ mail, password }: GetContextParams) {
  const browser = await chromium.launch({ headless: true ,
  args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  let context: BrowserContext;

  try {
    const fs = await import('fs/promises');
    await fs.access(sessionPath);

    // Si el archivo existe, probamos cargar la sesión
    context = await browser.newContext({ storageState: sessionPath });
    const page = await context.newPage();
    await page.goto("https://aereos.sudameria.com/search", { waitUntil: "networkidle" });

    const storageUser = await page.evaluate(() => {
      try {
        const data = localStorage.getItem('user');
        if (!data) return null;
        const parsed = JSON.parse(data);
        return {
          logueado: parsed.IsUserSuccessfullyLogedIn,
          token: parsed.AccessToken,
          mail: parsed.Email,
        };
      } catch {
        return null;
      }
    });

    await page.close();

    if (storageUser?.logueado && !!storageUser?.token) {
      return { browser, context, estaLogueado: true };
    } else {
      // Sesión inválida: cerramos y hacemos login
      await context.close();
      context = await browser.newContext();
      const pageLogin = await context.newPage();
      await hacerLogin(pageLogin, mail, password);
      await pageLogin.close();
      return { browser, context, estaLogueado: true };
    }

  } catch (error) {
    // Si algo falla (archivo no existe o error), creamos nuevo contexto y login
    console.error("Error al acceder al archivo de sesión:", error);
    context = await browser.newContext();
    const page = await context.newPage();
    await hacerLogin(page, mail, password);
    await page.close();
    return { browser, context, estaLogueado: true };
  }
}
