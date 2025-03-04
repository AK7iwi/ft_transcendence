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

# Build the frontend
RUN npm run build

# Production stage: use a lightweight web server (e.g., nginx)
FROM nginx:alpine AS production

# Set working directory
WORKDIR /usr/share/nginx/html

# Copy built frontend files from the build stage
COPY --from=build /usr/src/app/dist ./

# Expose port 80 for web traffic
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
