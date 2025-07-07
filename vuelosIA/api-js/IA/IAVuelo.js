import { spawn } from "child_process";

export async function generarJsonDesdeMensaje(mensaje) {
  return new Promise((resolve, reject) => {
    console.log("ESTO LO MUESTRA?????")
    const process = spawn("python", ["./IA/IAVuelo.py", mensaje]);
    console.log("ESTO NO CREOOOO?????")
    let result = "";
    process.stdout.on("data", (data) => {
      result += data.toString();
    });
    console.log("ESTO NO RESULT?????", result)

    process.stderr.on("data", (data) => {
      console.error("Error en Python:", data.toString());
    });
    console.log("ESTO NO process?????", process)

    process.on("close", (code) => {
      if (code === 0) {
        try {
          // Extraer el JSON entre llaves (primer bloque válido)
          const jsonMatch = result.match(/\{[\s\S]*\}$/);
          if (!jsonMatch) throw new Error("No se encontró JSON válido en la salida");

          const jsonString = jsonMatch[0];
          const json = JSON.parse(jsonString);
          console.log("JSON parseado correctamente:", json);
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
