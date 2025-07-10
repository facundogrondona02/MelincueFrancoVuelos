FROM node:18-alpine

# Instala Python, pip y herramientas para compilar extensiones Python (como las de openai)
RUN apk add --no-cache python3 py3-pip build-base python3-dev

WORKDIR /app

# Copia archivos de Node.js e instala dependencias primero para aprovechar cache de Docker
COPY package.json package-lock.json ./
RUN npm install

# Copia requirements.txt y instala dependencias de Python
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt --break-system-packages

# Copia el resto del código fuente después de instalar dependencias
COPY . .

# Expone el puerto en el que corre la app Node.js
EXPOSE 3020

# Comando para iniciar la app
CMD ["node", "index.js"]
