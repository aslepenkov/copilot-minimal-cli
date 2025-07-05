# Base image for Node.js
FROM node:24-slim

# Set working directory inside the container
WORKDIR /app

# Copy package files to leverage caching
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install

# Copy the rest of your app into the container
COPY . .

# Build the application
RUN pnpm run build

# Add a default command to keep the container alive (interactive shell)
CMD ["bash"]