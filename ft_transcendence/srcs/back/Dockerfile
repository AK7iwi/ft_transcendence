# Use Node.js 18 LTS
FROM node:18-slim

# Install Python and build tools
RUN apt-get update -y && apt-get upgrade -y && \
    apt-get install -y python3 make g++ curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the backend files
COPY . .

# Expose the port your Fastify app runs on
EXPOSE 3000

# Start the Fastify server
CMD ["node", "back.js"]