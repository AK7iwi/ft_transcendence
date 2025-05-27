# Use Node.js 18 LTS
FROM node:18-slim

# Install SQLite3, Python, build tools, and OpenSSL
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y sqlite3 python3 make g++ curl openssl && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /usr/src/app

# Create certificates directory and set permissions
RUN mkdir -p /usr/src/app/certs && chmod 755 /usr/src/app/certs

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source files
COPY src/ ./src/

# Set environment variables
ENV NODE_ENV=production
ENV GATEWAY_PORT=3000

# Expose Fastify port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
