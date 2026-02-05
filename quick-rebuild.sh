#!/bin/bash
# EngineAPI - Quick Rebuild Script
# Recompila o backend e reinicia o container sem rebuild completo da imagem

echo "🔨 Compilando TypeScript..."
docker exec engine-api npm run build

echo "🔄 Reiniciando container..."
docker compose restart engine-api

echo ""
echo "✅ Rebuild completo!"
echo "Check logs: docker logs engine-api --tail 20"
