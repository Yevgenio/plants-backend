FROM node:20-alpine
ENV CI=true
ENV npm_config_yes=true

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5000

CMD ["node", "index.js"]
