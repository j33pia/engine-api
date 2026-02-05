# EngineAPI - API Reference

## Autenticação

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "senha123"
}
```

**Response**:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "ADMIN"
  }
}
```

---

## NFe - Emissão

### Emitir NFe

```http
POST /nfe
Authorization: Bearer {token}
Content-Type: application/json

{
  "issuerId": "uuid-do-issuer",
  "customerId": "uuid-do-customer",
  "items": [
    {
      "description": "Notebook Dell",
      "quantity": 1,
      "unitPrice": 4500.00,
      "ncm": "84715000",
      "cfop": "5102"
    }
  ]
}
```

**Response (Sucesso)**:

```json
{
  "id": "uuid",
  "number": 123,
  "series": 1,
  "status": "AUTHORIZED",
  "accessKey": "52260221025760000123550010000001231234567890",
  "protocol": "352260000123456",
  "totalValue": 4500.0,
  "xmlPath": "/nfe/xml/52260221025760000123550010000001231234567890",
  "pdfPath": "/nfe/pdf/52260221025760000123550010000001231234567890"
}
```

---

### Listar NFes

```http
GET /nfe?status=AUTHORIZED&limit=50
Authorization: Bearer {token}
```

**Query Params**:
| Param | Tipo | Descrição |
|-------|------|-----------|
| status | string | AUTHORIZED, REJECTED, CREATED, CANCELED |
| limit | number | Máximo de registros (default: 100) |
| offset | number | Paginação |

---

### Download XML

```http
GET /nfe/xml/{accessKey}
Authorization: Bearer {token}
```

**Response**: Arquivo XML

---

### Download PDF (DANFE)

```http
GET /nfe/pdf/{accessKey}
Authorization: Bearer {token}
```

**Response**: Arquivo PDF

---

## Operações Fiscais

### Cancelar NFe

```http
POST /nfe/{accessKey}/cancelar
Authorization: Bearer {token}
Content-Type: application/json

{
  "justificativa": "Erro no pedido - cliente desistiu da compra"
}
```

**Requisitos**:

- Justificativa: mínimo 15 caracteres
- Prazo: até 24h após autorização

---

### Carta de Correção (CC-e)

```http
POST /nfe/{accessKey}/cce
Authorization: Bearer {token}
Content-Type: application/json

{
  "correcao": "Onde se lê 'Rua das Flores, 100', leia-se 'Rua das Flores, 200'"
}
```

**Requisitos**:

- Correção: mínimo 15 caracteres
- Não pode alterar valores fiscais

---

## Empresas (Issuers)

### Listar Empresas

```http
GET /companies
Authorization: Bearer {token}
```

### Criar Empresa

```http
POST /companies
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Empresa XYZ Ltda",
  "cnpj": "21025760000123",
  "ie": "1234567890",
  "crt": 3,
  "address": {
    "street": "Rua Principal",
    "number": "100",
    "city": "Goiânia",
    "state": "GO",
    "zipCode": "74000000"
  }
}
```

---

### Upload Certificado A1

```http
POST /companies/{id}/certificate
Authorization: Bearer {token}
Content-Type: multipart/form-data

certificate: (arquivo .pfx)
password: "senha_do_certificado"
```

---

## Status SEFAZ

### Consultar Status

```http
GET /nfe/status?uf=GO
Authorization: Bearer {token}
```

**Response**:

```json
{
  "status": "UP",
  "message": "Serviço em Operação",
  "uf": "GO",
  "timestamp": "2026-02-02T16:00:00Z"
}
```

---

## Webhooks (Configuração)

### Configurar Webhook

```http
PUT /partners/settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "webhookUrl": "https://seudominio.com/webhook/nfe",
  "webhookSecret": "secret_para_validacao"
}
```

**Eventos Enviados**:

- `nfe.authorized` - NFe autorizada
- `nfe.rejected` - NFe rejeitada
- `nfe.canceled` - NFe cancelada
- `cce.processed` - CC-e processada
