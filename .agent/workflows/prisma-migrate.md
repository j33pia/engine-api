---
description: Executar migrações Prisma e regenerar client
---

# Prisma Migrations

## Cenário 1: Nova Migration (Desenvolvimento)

Quando você alterou o `schema.prisma` e precisa criar uma nova migration:

// turbo-all

1. **Criar migration**:

```bash
cd /Users/jhonnathan/.gemini/antigravity/scratch/engine_api/backend
npx prisma migrate dev --name sua_migration
```

2. **Regenerar client**:

```bash
npx prisma generate
```

3. **Rebuild e restart**:

```bash
npm run build && docker restart nfe-engine
```

## Cenário 2: Reset Completo (Dev Only)

⚠️ **CUIDADO**: Isso apaga todos os dados!

```bash
cd /Users/jhonnathan/.gemini/antigravity/scratch/engine_api/backend
npx prisma migrate reset --force
```

## Cenário 3: Seed de Dados

Para popular o banco com dados iniciais:

```bash
npx prisma db seed
```

## Verificação

Verificar estrutura do banco:

```bash
npx prisma studio
```

Acesse: http://localhost:5555
