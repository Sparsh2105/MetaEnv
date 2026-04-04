# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Production server
FROM node:20-alpine

WORKDIR /app

# Install backend deps
COPY package*.json ./
RUN npm install --production

# Copy backend source
COPY server.js ./
COPY env/ ./env/
COPY chaos/ ./chaos/
COPY openenv.yaml ./

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 7860
ENV PORT=7860

CMD ["node", "server.js"]
