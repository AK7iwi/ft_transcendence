# Use the latest LTS version of Node.js
FROM node:lts AS build

RUN apt-get update -y && apt-get upgrade -y

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the project (if using TypeScript or a build step)
RUN npm run build

# Production stage: create a minimal image
FROM node:lts AS production

WORKDIR /usr/src/app

# Copy only necessary files from build stage
COPY --from=build /usr/src/app/dist ./dist
COPY package*.json ./
RUN npm install --only=production

# Create a volume for uploads (optional)
VOLUME /usr/src/app/upload

# Expose backend port
EXPOSE 3000

# Start the backend server
CMD ["node", "dist/server.js"]
