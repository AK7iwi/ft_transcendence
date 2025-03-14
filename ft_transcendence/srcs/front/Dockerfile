# Use the latest stable Node.js version
FROM node:lts

RUN apt-get update -y && apt-get upgrade -y

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy frontend files
COPY . .

# Expose the port your frontend app runs on
EXPOSE 8080

# Start the frontend app
CMD ["node", "front.js"]
