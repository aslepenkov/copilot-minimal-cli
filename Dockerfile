FROM node:20-alpine

WORKDIR /app

# Copy source and build
COPY . . 
RUN rm -rf node_modules dist
RUN npm install -g pnpm && pnpm install
RUN pnpm run build:bundle
RUN pnpm prune --prod
# Create data directory
RUN mkdir -p /app/logs

# Keep container running
CMD ["tail", "-f", "/dev/null"]