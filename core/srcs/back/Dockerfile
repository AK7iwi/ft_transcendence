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

# Copy the rest of the backend files
COPY . .

# Make the cert generation script executable
RUN chmod +x /usr/src/app/scripts/generate-certs.sh

# Expose Fastify port
EXPOSE 3000

# Create an entrypoint script
RUN echo '#!/bin/bash\n\
/usr/src/app/scripts/generate-certs.sh\n\
node back.js' > /usr/src/app/entrypoint.sh && \
chmod +x /usr/src/app/entrypoint.sh

# Use the entrypoint script
CMD ["/usr/src/app/entrypoint.sh"]
