#!/bin/bash
# EngineAPI - Reset Password Script
# Reseta a senha de um usuário no banco de dados

if [ -z "$1" ]; then
    echo "Uso: ./reset-password.sh email@exemplo.com nova_senha"
    exit 1
fi

EMAIL=$1
NEW_PASSWORD=${2:-"admin123"}

echo "🔐 Resetando senha para: $EMAIL"

# Gera hash bcrypt
HASHED=$(docker exec engine-api node -p "require('bcrypt').hashSync('$NEW_PASSWORD', 10)")

# Atualiza no banco
docker exec engine-api-db psql -U postgres -d engine_api_db -c \
    "UPDATE users SET password = '$HASHED' WHERE email = '$EMAIL';"

echo "✅ Senha resetada com sucesso!"
echo "Nova senha: $NEW_PASSWORD"
