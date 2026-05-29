FROM node:24-slim
ENV CI=true
ENV npm_config_yes=true

RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5000

CMD ["sh", "-c", "cp -n /app/assets/default.jpg /app/uploads/default.jpg && node index.js"]
