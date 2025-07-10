FROM mcr.microsoft.com/playwright:v1.52.0-jammy

WORKDIR /app/anti-script

COPY anti-script/package.json anti-script/package-lock.json ./
RUN npm install

# ✅ Fuerza instalación local de navegadores
ENV PLAYWRIGHT_BROWSERS_PATH=0
RUN npx playwright install --with-deps

COPY anti-script/ .

RUN chmod +x ./node_modules/.bin/tsc
RUN npx tsc

EXPOSE 3030
CMD ["npm", "start"]
