#!/bin/bash
# EngineAPI - Docker Entrypoint

echo "🚀 Iniciando EngineAPI..."

# Start Xvfb in background for ACBrLib GUI requirements
echo "📺 Iniciando Xvfb..."
Xvfb :99 -screen 0 1024x768x24 &
export DISPLAY=:99

# Wait for display to be ready
sleep 2

# Create necessary directories
mkdir -p /app/logs /app/xml /app/pdf /app/uploads/certificates

# Run Prisma migrations (if needed)
echo "🗃️ Verificando banco de dados..."
npx prisma generate

# Start the application
echo "✅ Ambiente pronto. Iniciando aplicação..."
exec "$@"
