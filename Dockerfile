# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Production image — Node + Python
FROM node:20-alpine

WORKDIR /app

# Install Python 3, pip, and create 'python' symlink
RUN apk add --no-cache python3 py3-pip && \
    ln -sf /usr/bin/python3 /usr/bin/python

# Install Python dependencies for inference.py
RUN pip3 install --no-cache-dir openai requests --break-system-packages

# Install Node backend deps
COPY package*.json ./
RUN npm install --production

# Copy all backend source
COPY server.js ./
COPY env/ ./env/
COPY chaos/ ./chaos/
COPY openenv.yaml ./

# Copy inference scripts (required by hackathon validator)
COPY inference.py ./
COPY eval.py ./

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 7860
ENV PORT=7860

CMD ["node", "server.js"]
