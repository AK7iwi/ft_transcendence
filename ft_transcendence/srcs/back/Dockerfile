# Use the latest stable Node.js version
FROM node:lts

RUN apt-get update -y && apt-get upgrade -y

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

