FROM mcr.microsoft.com/playwright:v1.52.0-jammy

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app/anti-script

# Copia los archivos de dependencias
COPY anti-script/package.json anti-script/package-lock.json ./
RUN npm install

# Instala los navegadores de Playwright
RUN npx playwright install --with-deps

# Copia el resto del código fuente
COPY anti-script/ .

# Da permiso de ejecución al compilador TypeScript
RUN chmod +x ./node_modules/.bin/tsc

# Compila TypeScript
RUN npx tsc

# Expone el puerto en el que corre tu backend
EXPOSE 3030

# Comando para iniciar la app
CMD ["npm", "start"]
