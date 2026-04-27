FROM node:20-alpine
ENV CI=true                                                                                  
ENV npm_config_yes=true                                                                      

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev --fetch-timeout=60000

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]