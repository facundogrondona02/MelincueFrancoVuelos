import { spawn } from "child_process";

export async function generarArrayMultibusqueda(mensaje) {
  return new Promise((resolve, reject) => {
    const process = spawn("python", ["./IA/IAMultiBusqueda.py", mensaje]);

    let result = "";
    process.stdout.on("data", (data) => {
      result += data.toString();
    });

    process.stderr.on("data", (data) => {
      console.error("Error en Python:", data.toString());
    });

    process.stdout.on("end", () => {
      try {
        // console.log("resultado ", result);
        const limpio = result.trim().replace(/^\s+|\s+$/g, "");
        const json = JSON.parse(limpio);
        resolve(json);
      } catch (e) {
        console.warn("No se pudo parsear JSON, se devuelve texto plano.", e);
        resolve(result);
      }
    });

    process.on("error", (err) => {
      reject(err);
    });
  });
}
