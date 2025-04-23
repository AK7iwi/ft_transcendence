FROM node:lts

# 🧱 Install sqlite3 CLI
RUN apt-get update -y && apt-get install -y sqlite3

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "back.js"]
