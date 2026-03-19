# Dockerfile — Railway / Render / any Docker host
FROM node:20-slim

# Install Python, pip, ffmpeg, yt-dlp
RUN apt-get update && apt-get install -y \
    python3 python3-pip ffmpeg curl \
    --no-install-recommends && \
    pip3 install -U yt-dlp --break-system-packages && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Node deps
COPY package*.json ./
RUN npm install --omit=dev

# Copy app files
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
