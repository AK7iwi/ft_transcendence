# Use the latest stable Node.js version
FROM node:lts

# Install system dependencies
RUN apt-get update -y && apt-get upgrade -y

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all project files into the container
COPY . .

# Expose the port (if your app will be served on a specific port)
EXPOSE 5173

# Build the Tailwind CSS (using PostCSS) and compile TypeScript
# RUN npx tailwindcss -o ./dist/style.css && tsc

# Start the app (assuming your entry point is something like pong.ts)
CMD ["node", "objs/pong.js"]
