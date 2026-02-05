---
description: Rebuild rápido do backend sem reconstruir imagem Docker completa
---

# Quick Rebuild - Backend

Use este workflow quando fizer alterações no código do backend e precisar que elas reflitam no container Docker rapidamente.

## Quando Usar

- Alterou arquivos em `backend/src/`
- Adicionou novos endpoints ou services
- Corrigiu bugs no código TypeScript

## Passos

// turbo-all

1. **Compilar TypeScript no host**:

```bash
cd /Users/jhonnathan/.gemini/antigravity/scratch/engine_api/backend
npm run build
```

2. **Reiniciar container**:

```bash
docker restart engine-api
```

3. **Verificar logs**:

```bash
docker logs engine-api --tail 30 | grep -E "(Mapped|started|ERROR)"
```

## Alternativa: Rebuild Completo

Se o quick rebuild não funcionar (ex: mudanças em package.json):

```bash
cd /Users/jhonnathan/.gemini/antigravity/scratch/engine_api
docker-compose up -d --build engine-api
```

## Dica

Para mudanças no schema Prisma:

```bash
cd backend && npx prisma generate && npm run build
docker restart engine-api
```
