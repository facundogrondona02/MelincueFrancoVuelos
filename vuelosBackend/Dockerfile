# Dockerfile para el servicio 'backend' (ubicado en vuelosBackend/Dockerfile)

# Usa la imagen base de Playwright con la versión requerida (v1.52.0-jammy)
FROM mcr.microsoft.com/playwright:v1.52.0-jammy

# Establece el directorio de trabajo dentro del contenedor.
# Aquí es donde se copiará el contenido relevante de tu aplicación 'anti-script'.
# Dado que el contexto de build es './vuelosBackend' y 'anti-script' es una subcarpeta,
# establecemos el WORKDIR dentro de '/app' (que es el default) a '/app/anti-script'.
WORKDIR /app/anti-script

# Copia los archivos de manifiesto de dependencias de la aplicación anti-script.
# Desde el contexto (./vuelosBackend), la ruta a estos archivos es 'anti-script/package.json'.
COPY anti-script/package.json anti-script/package-lock.json ./

# Instala las dependencias de Node.js definidas en el package.json de anti-script.
RUN npm install

# Instala los navegadores de Playwright dentro del contenedor.
# Esto es CRUCIAL para que Playwright encuentre sus ejecutables y no dé el error "Executable doesn't exist".
RUN npx playwright install --with-deps

# Eliminada la línea para instalar @types/playwright-test, ya que Playwright y Playwright Test
# incluyen sus propias definiciones de tipos.

# Copia el resto del código fuente de la aplicación anti-script.
# Desde el contexto (./vuelosBackend), la ruta a la carpeta 'anti-script' es 'anti-script/'.
# Copia todo el contenido de 'anti-script/' del host al WORKDIR actual ('/app/anti-script') del contenedor.
COPY anti-script/ .

# Si tu backend es un proyecto TypeScript, necesitas compilarlo dentro del contenedor.
# Esto asume que tienes un script 'build' en tu package.json que compila TypeScript a JavaScript en la carpeta 'dist'.
RUN npm run build

# Expone el puerto en el que la aplicación Express escucha.
EXPOSE 3030

# Comando para iniciar la aplicación.
# Asume que tu package.json en 'anti-script' tiene un script "start" que ejecuta tu aplicación principal.
CMD ["npm", "start"]
