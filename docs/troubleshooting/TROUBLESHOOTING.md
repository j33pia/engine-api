# EngineAPI - Troubleshooting Guide

Este documento consolida os problemas mais comuns e suas soluções.

## 🔴 Erros de Inicialização

### ACBrLibLibNaoInicializadaError

**Sintoma**: Backend crash com "Erro ao inicializar ACBrLibNFeMT"

**Causas Comuns**:

1. Diretórios de log/xml não existem
2. DISPLAY não configurado (Xvfb não rodando)
3. Certificado A1 não encontrado
4. OpenSSL version mismatch

**Soluções**:

```bash
# Verificar Xvfb
docker exec engine-api echo $DISPLAY
# Deve retornar ":99"

# Verificar diretórios
docker exec engine-api ls -la /app/logs /app/xml

# Verificar certificado
docker exec engine-api ls -la /app/uploads/certificates/

# Verificar dependências
docker exec engine-api ldd /app/acbrlib/x64/libacbrnfe64.so | grep "not found"
```

---

### Container stuck em "Creating"

**Sintoma**: `docker compose up` trava indefinidamente

**Solução**:

```bash
docker compose down --remove-orphans
docker compose up -d db
sleep 5
docker compose up -d engine-api
```

---

### PrismaClientInitializationError (Query Engine)

**Sintoma**: "Could not locate the Query Engine for runtime debian-openssl-3.0.x"

**Causa**: Prisma client gerado em macOS tentando rodar em Linux

**Solução**:

```bash
# No host Mac
cd backend
npx prisma generate
npm run build

# Depois rebuild
docker compose up -d --build engine-api
```

---

## 🟡 Erros de Emissão

### CNPJ Inválido (Código -11)

**Sintoma**: Erro "-11" ou "CNPJ inválido" mesmo com CNPJ válido

**Causa Real**: Geralmente é erro de XSD/Schema, não do CNPJ. O wrapper Node.js interpreta incorretamente.

**Diagnóstico**:

```bash
docker exec engine-api cat /app/logs/ACBrLibNFE-$(date +%Y%m%d).log
```

Procure por mensagens de validação XSD ou campos obrigatórios faltando.

---

### AccessKey não salva após autorização

**Sintoma**: NFe autorizada mas accessKey é NULL no banco

**Causa**: Provider retorna `status: 'authorized'` mas service espera `success: true`

**Verificação**:

```typescript
// nfe-real.provider.ts deve retornar:
return {
  success: true, // NÃO status: 'authorized'
  accessKey: chave,
  protocol: resultado.Envio.NProt,
  // ...
};
```

---

### Gtk-WARNING: cannot open display

**Sintoma**: Request falha com 500, logs mostram "cannot open display:"

**Causa**: Xvfb não rodando ou DISPLAY não exportado

**Solução**: Verificar `docker-entrypoint.sh`:

```bash
Xvfb :99 -screen 0 1024x768x24 &
export DISPLAY=:99
```

---

## 🟢 Erros de Configuração

### CORS blocked

**Sintoma**: Frontend não consegue chamar backend

**Solução**: Verificar `main.ts` do backend:

```typescript
app.enableCors({
  origin: ["http://localhost:3002", "http://localhost:3000"],
  credentials: true,
});
```

---

### 404 em endpoint recém-criado

**Sintoma**: Endpoint existe no código mas retorna 404

**Causa**: Container usando código compilado antigo

**Solução**:

```bash
cd backend && npm run build
docker restart engine-api
docker logs engine-api | grep "Mapped"
```

---

## 📊 Comandos de Diagnóstico Úteis

```bash
# Status dos containers
docker ps

# Logs do backend (últimas 50 linhas)
docker logs engine-api --tail 50

# Logs do ACBr
docker exec engine-api cat /app/logs/ACBrLibNFE-$(date +%Y%m%d).log

# Verificar rotas mapeadas
docker logs engine-api | grep "Mapped"

# Verificar certificados
docker exec engine-api ls -la /app/uploads/certificates/

# Testar conectividade banco
docker exec engine-api npx prisma db pull

# Shell interativo no container
docker exec -it engine-api /bin/bash
```
