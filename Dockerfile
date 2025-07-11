FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

# Copy source and build
COPY . .
RUN pnpm run build && pnpm prune --prod

# Create data directory
RUN mkdir -p /app/logs

# Keep container running
CMD ["tail", "-f", "/dev/null"]