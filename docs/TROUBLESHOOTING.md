# Troubleshooting Guide

Este documento contém soluções para problemas comuns encontrados no EngineAPI.

---

## 🐳 Docker / Build

### Erro: Prisma Client Exit Code 133 (Apple Silicon)

**Sintoma:**

```
assertion failed [block != nullptr]: BasicBlock requested for unrecognized address
Trace/breakpoint trap
exit code: 133
```

**Causa:** Bug do Prisma Client ao gerar binários dentro de container ARM64.

**Solução:**

```bash
# Usar buildx com emulação AMD64
docker buildx build --platform linux/amd64 \
  -t engine_api-engine-api:latest --load \
  -f backend/Dockerfile backend/
```

---

### Erro: Container não inicia após build

**Sintoma:** Container reinicia em loop.

**Diagnóstico:**

```bash
docker logs engine-api --tail 50
```

**Causas comuns:**

1. DATABASE_URL incorreta
2. Porta já em uso
3. Erro na migração do Prisma

---

## 🔐 Autenticação

### Erro 401: Unauthorized

**Causas:**

1. Token JWT expirado (validade: 24h)
2. API Key inválida ou regenerada
3. Header Authorization incorreto

**Verificar:**

```bash
# Formato correto
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

# Ou API Key
X-API-Key: pk_live_abc123def456
```

---

### Erro: "Credenciais inválidas" no login

**Verificar:**

1. Email existe no banco
2. Senha correta
3. Usuário está ativo

```sql
SELECT id, email, role FROM "User" WHERE email = 'admin@3xtec.com.br';
```

---

## 📄 NFe / Documentos Fiscais

### Erro: "Nenhum emissor configurado"

**Causa:** Parceiro não tem empresa (Issuer) cadastrada.

**Solução:**

1. Acessar Dashboard > Empresas
2. Cadastrar empresa com CNPJ/IE
3. Fazer upload do certificado A1

---

### Erro: Certificado expirado

**Sintoma:** Falha na assinatura XML.

**Solução:**

1. Verificar validade do certificado
2. Fazer upload de novo arquivo .pfx
3. Informar senha correta

```bash
# Verificar validade do certificado
openssl pkcs12 -in certificado.pfx -info -nokeys
```

---

### Erro: NFe Rejeitada (cStat ≠ 100)

**Código de Status SEFAZ:**

| cStat | Significado                    | Ação                          |
| ----- | ------------------------------ | ----------------------------- |
| 100   | Autorizado                     | ✅ Sucesso                    |
| 204   | Duplicidade de NF-e            | Verificar se já foi emitida   |
| 225   | Falha no Schema XML            | Verificar campos obrigatórios |
| 301   | Uso Denegado                   | INC do destinatário           |
| 302   | Irregularidade fiscal emitente | Consultar contador            |
| 539   | Duplicidade de NF-e            | Já existe com mesmo número    |
| 778   | Informar IE/RG destinatário    | Campo obrigatório             |

---

## 🗄️ Banco de Dados

### Erro: Prisma Migration falhou

**Diagnóstico:**

```bash
cd backend
npx prisma migrate status
```

**Reset (CUIDADO - perde dados):**

```bash
npx prisma migrate reset
```

---

### Erro: Connection refused PostgreSQL

**Verificar container:**

```bash
docker ps | grep engine-api-db
docker logs engine-api-db
```

**Verificar conexão:**

```bash
psql -h localhost -p 5432 -U postgres -d engine_api
```

---

## 🌐 Frontend

### Erro: CORS blocked

**Causa:** Backend não permite origem do frontend.

**Verificar em `main.ts`:**

```typescript
app.enableCors({
  origin: ["http://localhost:3000", "https://app.engineapi.com.br"],
  credentials: true,
});
```

---

### Erro: Dados não aparecem no Dashboard

**Diagnóstico:**

1. Abrir DevTools (F12) > Console
2. Verificar erros 401/403
3. Verificar Network > /analytics/dashboard

**Causas:**

- Token expirado (refazer login)
- Parceiro sem dados
- Backend não está rodando

---

## 🔄 Performance

### API lenta (>500ms)

**Diagnóstico:**

```sql
-- Verificar queries lentas
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

**Soluções:**

1. Adicionar índices
2. Usar `select` específico no Prisma
3. Adicionar cache (Redis)

---

## 📞 Suporte

Se o problema persistir:

1. **Logs completos:**

   ```bash
   docker logs engine-api > logs.txt 2>&1
   ```

2. **Versão do sistema:**

   ```bash
   docker exec engine-api cat package.json | grep version
   ```

3. **Contato:** suporte@3xtec.com.br

---

_Última atualização: 2026-02-04_
