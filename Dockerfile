FROM node:22-slim

WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json ./

# Install production deps only
RUN npm ci --omit=dev

# Copy source
COPY src/ ./src/
COPY bridge/ ./bridge/

# Cloud Run uses PORT env var (default 8080)
ENV PORT=8080
EXPOSE 8080

# Start HTTP server (not stdio)
CMD ["node", "src/server-http.js"]
