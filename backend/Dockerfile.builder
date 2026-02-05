# ============================================
# STAGE 1: Prepare ACBrLib Binary (Local File)
# ============================================
FROM debian:bullseye-slim AS acbr-loader

# Criar diretório de saída
RUN mkdir -p /output

# Copiar biblioteca local (já validada e funcional no backend/)
# NOTA: Para produção, esta biblioteca deve estar versionada no repositório
# ou em um artifact registry privado para reprodutibilidade
COPY libacbrnfe64.so /output/libacbrnfe64.so

# Verificar se biblioteca é válida
RUN apt-get update && apt-get install -y file && \
    if [ -f /output/libacbrnfe64.so ]; then \
        file /output/libacbrnfe64.so; \
        chmod +x /output/libacbrnfe64.so; \
    else \
        echo "ERRO: Biblioteca não encontrada!"; \
        exit 1; \
    fi

# ============================================
# STAGE 2: Aplicação Node.js (Backend)
# ============================================
FROM node:18-bullseye

# Metadados da versão ACBr
LABEL acbr.version="1.2.9" \
      acbr.source="official-download" \
      acbr.last_updated="2026-01-31"

# Instalar dependências de runtime da ACBrLib
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
    file \
    && rm -rf /var/lib/apt/lists/*

# Diretório de trabalho
WORKDIR /app

# Criar diretório para ACBrLib
RUN mkdir -p /app/acbrlib/x64

# Copiar biblioteca do stage anterior
COPY --from=acbr-loader /output/libacbrnfe64.so /app/acbrlib/x64/libacbrnfe64.so

# Copiar package.json e instalar dependências Node
COPY package*.json ./

# Instalar dependências
RUN rm -f package-lock.json && \
    npm install --legacy-peer-deps --ignore-scripts

# Copiar código fonte
COPY . .

# Gerar Prisma Client
# NOTA: Em ambientes Mac ARM, o Prisma crashar durante build devido a QEMU
# Solução: gerar localmente e copiar, ou usar --build-arg para skip
# RUN npm run prisma:generate

# Como workaround para Mac/QEMU, vamos gerar após o container iniciar
# via migration deploy que regenera automaticamente
RUN echo "Prisma client will be generated on first run via migrations"

# Build da aplicação
RUN npm run build

# Criar diretórios necessários
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
    chmod -R 777 /app/logs && \
    chmod -R 777 /app/xml && \
    chmod -R 777 /app/uploads

# Verificar se biblioteca foi copiada e é válida
RUN ls -lah /app/acbrlib/x64/ && \
    file /app/acbrlib/x64/libacbrnfe64.so && \
    ldd /app/acbrlib/x64/libacbrnfe64.so || echo "Biblioteca presente mas com dependências faltando"

# Copiar e configurar entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expor porta
EXPOSE 3001

# Usar entrypoint script profissional em vez de CMD inline
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
