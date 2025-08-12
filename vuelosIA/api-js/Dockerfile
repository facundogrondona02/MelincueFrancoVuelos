    # Usa una imagen base de Node.js
    FROM node:18-alpine

    # Instala paquetes del sistema para Python y Node.js
    RUN apk add --no-cache bash python3 py3-pip build-base python3-dev

    # Establece el directorio de trabajo dentro del contenedor
    WORKDIR /app

    # Copia los archivos package.json y package-lock.json al directorio de trabajo
    COPY package.json package-lock.json ./

    # Instala las dependencias de Node.js (con salida muy detallada)
    RUN npm install --loglevel verbose
    # --- AÑADE ESTA LÍNEA PARA DEPURACIÓN ---
    RUN echo "Contenido de /app/node_modules:" && ls -l /app/node_modules
    # --- FIN DE LÍNEA DE DEPURACIÓN ---

    # Copia los requirements.txt para Python e instala
    COPY requirements.txt ./
    RUN pip install --no-cache-dir -r requirements.txt --break-system-packages
    RUN ln -sf python3 /usr/bin/python

    # Copia el resto del código de la aplicación al directorio de trabajo
    COPY . .

    # Expone el puerto en el que la aplicación Express escucha
    EXPOSE 3020

    # Comando para iniciar la aplicación cuando el contenedor se ejecute
    CMD ["node", "index.js"]
    