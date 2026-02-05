# Base Image: Node 18 on Debian Bullseye (OpenSSL 1.1 Native System Libs)
# Node 18 uses SSL3, but Bullseye has SSL1.1 system libs for ACBrLib
FROM node:18-bullseye

# Install System Dependencies for ACBrLib (Fiscal Core)
# libxml2, libxslt, openssl (1.1) are standard in Bullseye
RUN apt-get update && apt-get install -y \
    libxml2 \
    libxslt1.1 \
    libssl-dev \
    libgtk2.0-0 \
    libxmlsec1 \
    libxmlsec1-openssl \
    openssl \
    ca-certificates \
    curl \
    unzip \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Work Directory
WORKDIR /app

# Timezone para Brasília (-03:00)
ENV TZ=America/Sao_Paulo
ENV DEBIAN_FRONTEND=noninteractive
# X11 Environment for ACBrLib (headless mode)
ENV DISPLAY=:99
ENV GDK_BACKEND=x11
ENV XDG_RUNTIME_DIR=/tmp/runtime-root

# Copy Package Files First (Optimization for caching)
COPY package*.json ./

# Install Dependencies (using install for better resilience/compat than ci on older nodes)
# Force remove lock file to ensure clean install
RUN rm -f package-lock.json && \
    npm install --legacy-peer-deps --ignore-scripts

# Copy Source Code
COPY . .

# Generate Prisma Client (Linux Binary - Debian)
RUN npx prisma generate

# Build Application
RUN npm run build

# Helper script to simulate library if missing (optional)
RUN mkdir -p /app/acbrlib/x64

# Ensure uploads and logs directories exist
RUN mkdir -p /app/uploads/certificates && \
    mkdir -p /app/logs && \
    mkdir -p /app/xml/saida && \
    mkdir -p /app/xml/arquivos && \
    mkdir -p /app/xml/nfe && \
    mkdir -p /app/xml/can && \
    mkdir -p /app/xml/inu && \
    mkdir -p /app/xml/cce && \
    mkdir -p /app/xml/evento && \
    mkdir -p /app/xml/pdf && \
    mkdir -p /tmp/runtime-root && \
    chmod -R 777 /app/logs && \
    chmod -R 777 /app/xml && \
    chmod -R 777 /app/uploads && \
    chmod 700 /tmp/runtime-root

# Copy and setup startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Expose Port
EXPOSE 3001

# Start Command using custom script that initializes Xvfb properly
CMD ["/app/start.sh"]
