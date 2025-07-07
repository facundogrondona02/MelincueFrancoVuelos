import { spawn } from "child_process";

export async function generarJsonDesdeMensaje(mensaje) {
  return new Promise((resolve, reject) => {
    const process = spawn("python", ["./IA/IAVuelo.py", mensaje]);

    let result = "";
    process.stdout.on("data", (data) => {
      result += data.toString();
    });

    process.stderr.on("data", (data) => {
      console.error("Error en Python:", data.toString());
    });

    process.on("close", (code) => {
      if (code === 0) {
        try {
          const json = JSON.parse(result);
          resolve(json);
        } catch (e) {
          console.warn("No se pudo parsear JSON, se devuelve texto plano.", e);
          resolve(result);
        }
      } else {
        reject("El script de Python falló");
      }
    });
  });
}
