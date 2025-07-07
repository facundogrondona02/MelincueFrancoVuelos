FROM mcr.microsoft.com/playwright:v1.52.0-jammy

WORKDIR /app/anti-script

COPY anti-script/package.json anti-script/package-lock.json ./
RUN npm install

RUN npx playwright install --with-deps

COPY anti-script/ .

RUN chmod +x ./node_modules/.bin/tsc
RUN npm run build

EXPOSE 3030

# Usamos el script start.sh que hace install + build + start automáticamente
CMD ["./start.sh"]