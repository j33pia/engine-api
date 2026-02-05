---
description: Iniciar ambiente de desenvolvimento completo (Backend + Frontend)
---

# Iniciar Ambiente de Desenvolvimento

## Pré-requisitos

- Docker Desktop ou OrbStack rodando
- Node.js 18+ instalado

## Passos

// turbo-all

1. **Verificar Docker**:

```bash
docker info > /dev/null 2>&1 && echo "Docker OK" || echo "Docker não está rodando"
```

2. **Subir infraestrutura (DB + Backend)**:

```bash
cd /Users/jhonnathan/.gemini/antigravity/scratch/engine_api
docker-compose up -d
```

3. **Aguardar backend estar pronto**:

```bash
sleep 5 && docker logs engine-api --tail 20 | grep -E "(started|listening|Mapped)"
```

4. **Iniciar frontend** (em novo terminal):

```bash
cd /Users/jhonnathan/.gemini/antigravity/scratch/engine_api/frontend
npm run dev
```

## URLs de Acesso

- **Frontend (Portal)**: http://localhost:3002
- **Backend (API)**: http://localhost:3001
- **Swagger Docs**: http://localhost:3001/api-docs

## Credenciais de Teste (Homologação)

- **Email**: admin@3xtecnologia.com.br
- **Senha**: (verificar no seed)
