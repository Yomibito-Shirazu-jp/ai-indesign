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
#
# Entrypoint note:
#   This image intentionally runs the HTTP entrypoint (src/server-http.js) for
#   cloud / Cloud Run deployment, which listens on $PORT (default 8080).
#   This is distinct from the stdio entrypoint (src/index.js) used by Claude
#   Desktop and referenced as the default in package.json / manifest.json.
#   The differing entry points are deliberate (HTTP for cloud vs stdio for local),
#   not an inconsistency.
CMD ["node", "src/server-http.js"]
