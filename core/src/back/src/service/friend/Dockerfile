FROM node:18-slim

# Install SQLite3, Python, build tools, and OpenSSL
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y sqlite3 python3 make g++ curl openssl && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3003

CMD ["npm", "run", "dev"]