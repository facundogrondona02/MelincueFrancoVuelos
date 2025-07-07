import { Page } from "@playwright/test";

export async function hacerLogin(page: Page, mail: string, password: string): Promise<void> {

  try {
    await page.goto('https://aereos.sudameria.com/Login', { waitUntil: "domcontentloaded" });

    const usuarioInput = page.getByRole('textbox', { name: 'Usuario' });
    const contrasenaInput = page.getByRole('textbox', { name: 'Contraseña' });

    await Promise.all([
      usuarioInput.waitFor({ state: 'visible', timeout: 20000 }),
      contrasenaInput.waitFor({ state: 'visible', timeout: 20000 }),
    ]);

    await usuarioInput.fill(mail);
    await contrasenaInput.fill(password);
    await page.getByRole('button', { name: 'Entrar' }).click();

    // Confirmar que el login fue exitoso
    await page.waitForURL('**/search', { timeout: 10000 });

    // Esperar que se estabilice la página (opcional pero recomendable)
    await page.waitForLoadState("networkidle");

    // Guardar sesión solo si llegó hasta acá sin tirar error
    await page.context().storageState({ path: 'session.json' });

  } catch (error) {
    console.error("❌ Error durante el login:", error);
    throw error;
  }
}
