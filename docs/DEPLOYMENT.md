# Deployment Guide

Guia completo para deploy do EngineAPI em diferentes ambientes.

---

## 🌍 Ambientes

| Ambiente   | Propósito       | Provider       |
| ---------- | --------------- | -------------- |
| Local      | Desenvolvimento | Docker Compose |
| Staging    | Testes/QA       | MOCK           |
| Production | Emissão real    | REAL (ACBrLib) |

---

## 🐳 Deploy Local (Docker Compose)

### Pré-requisitos

- Docker 24+
- Docker Compose 2.x
- 4GB RAM disponível

### Passos

```bash
# 1. Clone o repositório
git clone <repo-url>
cd engine_api

# 2. Configurar variáveis de ambiente
cp backend/.env.example backend/.env

# 3. Subir serviços
docker compose up -d

# 4. Verificar logs
docker logs engine-api --tail 20

# 5. Aplicar migrations (primeira vez)
docker exec engine-api npx prisma migrate deploy
```

### URLs

| Serviço    | URL                            |
| ---------- | ------------------------------ |
| Frontend   | http://localhost:3000          |
| Backend    | http://localhost:3001          |
| Swagger    | http://localhost:3001/api-docs |
| PostgreSQL | localhost:5432                 |

---

## ☁️ Deploy em Produção

### Arquitetura Recomendada

```
                    ┌─────────────┐
                    │   Nginx     │
                    │   (Proxy)   │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐      ┌─────▼────┐     ┌──────▼─────┐
    │ Frontend│      │  API #1  │     │  API #2    │
    │ (Vercel)│      │ (Docker) │     │  (Docker)  │
    └─────────┘      └────┬─────┘     └─────┬──────┘
                          │                 │
                    ┌─────▼─────────────────▼─────┐
                    │     PostgreSQL (RDS)        │
                    └─────────────────────────────┘
```

### Variáveis de Ambiente (Produção)

```bash
# Database
DATABASE_URL=postgresql://user:pass@rds.amazonaws.com:5432/engine_api

# JWT
JWT_SECRET=<32+ caracteres aleatórios>

# Provider
NFE_PROVIDER=real

# ACBrLib
ACBR_PATH=/app/acbrlib

# Certificados
CERT_PATH=/app/uploads/certificates

# Logging
LOG_LEVEL=info
NODE_ENV=production
```

### Build para Produção

```bash
# Build otimizado
docker buildx build \
  --platform linux/amd64 \
  --build-arg NODE_ENV=production \
  -t engine-api:prod \
  -f backend/Dockerfile backend/
```

---

## 🔐 Segurança em Produção

### Checklist

- [ ] JWT_SECRET forte (32+ chars)
- [ ] HTTPS obrigatório
- [ ] CORS restrito ao domínio
- [ ] Rate limiting ativo
- [ ] Firewall configurado
- [ ] Certificados em volume seguro
- [ ] Senhas criptografadas
- [ ] Logs centralizados
- [ ] Backups diários

### Nginx Config

```nginx
server {
    listen 443 ssl http2;
    server_name api.engineapi.com.br;

    ssl_certificate /etc/letsencrypt/live/api.engineapi.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.engineapi.com.br/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 📊 Monitoramento

### Health Check

```bash
curl -f http://localhost:3001/health || exit 1
```

### Métricas Recomendadas

| Métrica       | Alerta |
| ------------- | ------ |
| Response Time | > 2s   |
| Error Rate    | > 1%   |
| CPU Usage     | > 80%  |
| Memory Usage  | > 85%  |
| Disk Space    | > 90%  |

### Logs

```bash
# Ver logs em tempo real
docker logs -f engine-api

# Logs estruturados (JSON)
docker logs engine-api | jq .
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build & Push
        run: |
          docker build -t engine-api:${{ github.sha }} .
          docker push registry/engine-api:${{ github.sha }}

      - name: Deploy
        run: |
          ssh deploy@server 'docker pull registry/engine-api:${{ github.sha }}'
          ssh deploy@server 'docker compose up -d'
```

---

## 🔙 Rollback

### Procedimento

```bash
# 1. Identificar versão anterior
docker images | grep engine-api

# 2. Fazer rollback
docker compose down
docker tag engine-api:previous engine-api:latest
docker compose up -d

# 3. Verificar
curl http://localhost:3001/health
```

---

## 📦 Database Migrations

### Deploy de Migrations

```bash
# Em produção
docker exec engine-api npx prisma migrate deploy

# Verificar status
docker exec engine-api npx prisma migrate status
```

### Rollback de Migration

```bash
# Reverter última migration
docker exec engine-api npx prisma migrate resolve --rolled-back <migration_name>
```

---

_Última atualização: 2026-02-04_
