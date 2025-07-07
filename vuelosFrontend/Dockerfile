# ===========================
# FASE DE BUILD
# ===========================
FROM node:18 AS builder

WORKDIR /app/vuelosFrontend

# ARGs para inyectar en el build de Next.js
ARG NEXT_PUBLIC_IA_API_URL
ARG NEXT_PUBLIC_BACKEND_API_URL

# También se pueden declarar como ENV si querés debug o log
ENV NEXT_PUBLIC_IA_API_URL=$NEXT_PUBLIC_IA_API_URL
ENV NEXT_PUBLIC_BACKEND_API_URL=$NEXT_PUBLIC_BACKEND_API_URL

# Instalar herramientas necesarias
RUN apt-get update && apt-get install -y build-essential python3 && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

RUN npm cache clean --force && npm install --omit=dev --force --legacy-peer-deps && npm rebuild

COPY . .

# 🧠 Acá es donde las vars públicas tienen que estar definidas
RUN npm run build

# ===========================
# FASE DE PRODUCCIÓN
# ===========================
FROM node:18

WORKDIR /app/vuelosFrontend

COPY --from=builder /app/vuelosFrontend ./

EXPOSE 3000

CMD ["npm", "run", "start"]
