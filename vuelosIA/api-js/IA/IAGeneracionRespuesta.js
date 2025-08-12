// import { spawn } from "child_process";

// export async function generarRespuesta(mensaje) {
//   return new Promise((resolve, reject) => {
//     const process = spawn("python", ["./IA/IAGeneracionRespuesta.py"]);

//     let result = "";
//     process.stdout.on("data", (data) => {
//       result += data.toString();
//     });

//     process.stderr.on("data", (data) => {
//       console.error("Error en Python:", data.toString());
//     });

//     process.on("close", (code) => {
//       if (code === 0) {
//         try {
//           // const json = JSON.parse(result); // Intentás parsear si esperás un JSON
//           // resolve(json);
//           resolve(result.trim()); // ✅ Ya que es texto plano (mensaje para WhatsApp)
//         } catch (e) {
//           console.warn("No se pudo parsear JSON, se devuelve texto plano.", e);
//           resolve(result.trim()); // En caso de que no sea JSON válido
//         }
//       } else {
//         reject("El script de Python falló");
//       }
//     });
//     process.stdin.write(mensaje); // 🔥 Ya está en formato string válido
//     process.stdin.end();
//   });
// }

import { spawn } from "child_process";

// Asumo que 'mensaje' es el array de objetos que quieres enviar al script de Python
export async function generarRespuesta(dataResultados) { // Ajustar el tipo de 'mensaje' a Array<any> o al tipo de tu objeto vuelo
  return new Promise((resolve, reject) => {
    const process = spawn("python3", ["./IA/IAGeneracionRespuesta.py"]);

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
          // Si el script de Python devuelve JSON, parsea el resultado
          if( typeof result == JSON ){
          const json = JSON.parse(result); 
          resolve(json);

          }else{
            resolve(result)
          }
        } catch (e) {
          // Si el script devuelve texto plano (como un mensaje para WhatsApp), devuélvelo tal cual
          console.warn("No se pudo parsear JSON del script de Python. Devolviendo texto plano.", e);
          resolve(result.trim()); 
        }
      } else {
        reject(`El script de Python falló con código ${code}`);
      }
    });

    // --- 🔥 LA CORRECCIÓN CLAVE ESTÁ AQUÍ 🔥 ---
    // Convierte el array de objetos a una cadena JSON antes de escribirlo en stdin
    try {
      const jsonString = JSON.stringify(dataResultados);
      process.stdin.write(jsonString);
      process.stdin.end();
    } catch (e) {
      // Manejo de errores si JSON.stringify falla (aunque es poco probable para un array de objetos)
      reject("Error al serializar los datos a JSON para el script de Python: " + e.message);
    }
    // ------------------------------------------
  });
}