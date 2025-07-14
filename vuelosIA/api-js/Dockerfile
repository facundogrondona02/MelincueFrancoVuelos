FROM node:18-alpine

RUN apk add --no-cache bash python3 py3-pip build-base python3-dev

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt --break-system-packages

COPY . .

EXPOSE 3020

CMD ["node", "index.js"]
