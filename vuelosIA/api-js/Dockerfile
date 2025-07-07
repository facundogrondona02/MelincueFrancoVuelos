# Usa una imagen base que incluya Node.js.
# `node:18-alpine` es una imagen ligera de Node.js basada en Alpine Linux.
FROM node:18-alpine

# Instala Python y pip (el gestor de paquetes de Python) si la imagen base de Node.js no los trae.
# Para Alpine Linux, se usa `apk` para instalar paquetes del sistema.
# También instalamos `build-base` y `python3-dev` que son necesarios para compilar
# extensiones de Python (como las que usa fuzzywuzzy).
RUN apk add --no-cache python3 py3-pip build-base python3-dev

# Establece el directorio de trabajo dentro del contenedor.
# Esto significa que la carpeta `/app` dentro del contenedor será donde se copiará tu código.
WORKDIR /app

# Copia los archivos de configuración de Node.js (package.json y package-lock.json)
# para instalar las dependencias de Node.js.
COPY package.json package-lock.json ./
# Ejecuta la instalación de las dependencias de Node.js.
RUN npm install

# --- AQUÍ ESTÁ LA PARTE CRÍTICA PARA TU ERROR DE PYTHON ---
# Copia el archivo `requirements.txt` (que lista las dependencias de Python) al contenedor.
COPY requirements.txt .
# Instala las dependencias de Python listadas en `requirements.txt` usando pip.
# `--no-cache-dir` evita guardar el caché de pip para reducir el tamaño de la imagen.
# `--break-system-packages` es necesario en Alpine para permitir la instalación de paquetes
# de Python que no son gestionados por el sistema, sin conflictos con `apk`.
RUN pip install --no-cache-dir -r requirements.txt --break-system-packages
# ---------------------------------------------------------

# Copia el resto de tu código de la API de IA al directorio de trabajo (`/app`).
# Esto incluirá las carpetas `data/`, `IA/` (con `IAVuelo.py`), `index.js`, etc.
COPY . .

# Comando para ejecutar tu aplicación Node.js cuando el contenedor se inicie.
# Asumimos que `index.js` es tu servidor principal que luego interactúa con Python.
CMD ["node", "index.js"]

# Expone el puerto en el que tu aplicación Node.js escucha dentro del contenedor.
# Esto no publica el puerto en el host, solo documenta qué puerto usa la aplicación.
EXPOSE 3020
