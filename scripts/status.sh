#!/bin/bash

# =============================================================================
# EngineAPI - Dev Environment Status
# =============================================================================

echo "🔍 EngineAPI - Status do Ambiente"
echo "=================================="
echo ""

# Check Docker
echo "📦 Docker:"
if docker info > /dev/null 2>&1; then
    echo "   ✅ Docker está rodando"
else
    echo "   ❌ Docker não está rodando"
    exit 1
fi

# Check containers
echo ""
echo "🐳 Containers:"
for container in engine-api engine-api-db; do
    status=$(docker inspect -f '{{.State.Status}}' $container 2>/dev/null)
    if [ "$status" = "running" ]; then
        echo "   ✅ $container: running"
    elif [ -n "$status" ]; then
        echo "   ⚠️  $container: $status"
    else
        echo "   ❌ $container: não encontrado"
    fi
done

# Check ports
echo ""
echo "🔌 Portas:"
for port in 3001 3002 5432; do
    if lsof -i :$port > /dev/null 2>&1; then
        process=$(lsof -i :$port | tail -1 | awk '{print $1}')
        echo "   ✅ Porta $port: em uso por $process"
    else
        echo "   ⚪ Porta $port: livre"
    fi
done

# Check URLs
echo ""
echo "🌐 Endpoints:"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health 2>/dev/null | grep -q "200\|404"; then
    echo "   ✅ Backend (3001): respondendo"
else
    echo "   ❌ Backend (3001): não responde"
fi

if curl -s -o /dev/null -w "%{http_code}" http://localhost:3002 2>/dev/null | grep -q "200\|304"; then
    echo "   ✅ Frontend (3002): respondendo"
else
    echo "   ⚪ Frontend (3002): não iniciado"
fi

# Show recent logs if backend is running
if docker ps -q -f name=engine-api > /dev/null 2>&1; then
    echo ""
    echo "📋 Últimas linhas do log (engine-api):"
    echo "----------------------------------------"
    docker logs engine-api --tail 5 2>&1 | sed 's/^/   /'
fi

echo ""
echo "=================================="
echo "✨ Use '/dev-start' para iniciar o ambiente completo"
