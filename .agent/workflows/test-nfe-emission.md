---
description: Testar emissão de NFe no ambiente de homologação
---

# Testar Emissão de NFe

## Pré-requisitos

- Backend rodando (`docker ps | grep engine-api`)
- Certificado A1 configurado para o Issuer
- Ambiente de homologação SEFAZ-GO

## Opção 1: Via Frontend (Testing Central)

1. Acesse: http://localhost:3002/dashboard/testing
2. Use a aba "Emissão NFe"
3. Preencha os dados do wizard
4. Clique em "Emitir NFe"

## Opção 2: Via cURL (API Direta)

// turbo

1. **Obter token JWT**:

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@3xtecnologia.com.br","password":"sua_senha"}'
```

2. **Emitir NFe** (substituir TOKEN e issuerId):

```bash
curl -X POST http://localhost:3001/nfe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "issuerId": "uuid-do-issuer",
    "customerId": "uuid-do-customer",
    "items": [{
      "description": "Produto Teste",
      "quantity": 1,
      "unitPrice": 100.00,
      "ncm": "84715000",
      "cfop": "5102"
    }]
  }'
```

## Verificar Resultado

- **Monitor de Notas**: http://localhost:3002/dashboard/invoices
- **Logs do Container**: `docker logs engine-api --tail 50`
- **ACBr Logs**: `docker exec engine-api cat /app/logs/ACBrLibNFE-$(date +%Y%m%d).log`

## Troubleshooting

Se a emissão falhar:

1. Verificar certificado: `docker exec engine-api ls -la /app/uploads/certificates/`
2. Verificar DISPLAY (Xvfb): `docker exec engine-api echo $DISPLAY`
3. Verificar logs ACBr para código de erro detalhado
