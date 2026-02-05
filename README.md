# 🚀 EngineAPI - Motor Fiscal SaaS B2B2B

> Plataforma completa de emissão de documentos fiscais eletrônicos brasileiros

[![NestJS](https://img.shields.io/badge/NestJS-11.x-red.svg)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14.x-black.svg)](https://nextjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com/)
[![API Docs](https://img.shields.io/badge/API-Swagger-green.svg)](http://localhost:3001/api-docs)

---

## 📋 Índice

- [Sobre](#sobre)
- [Documentos Suportados](#documentos-suportados)
- [Arquitetura](#arquitetura)
- [Instalação](#instalação)
- [Endpoints da API](#endpoints-da-api)
- [Dashboard](#dashboard)
- [Roadmap](#roadmap)

---

## 📖 Sobre

EngineAPI é uma plataforma SaaS multi-tenant para emissão de documentos fiscais eletrônicos. Desenvolvida para **Software Houses** (parceiros) que precisam integrar emissão fiscal em suas aplicações.

### Modelo B2B2B

```
[Sua Software House] → [EngineAPI] → [SEFAZ]
     (Partner)           (Motor)      (Governo)
```

---

## 📄 Documentos Suportados

| Modelo | Documento                        | Status       |
| ------ | -------------------------------- | ------------ |
| 55     | NFe - Nota Fiscal Eletrônica     | ✅ Produção  |
| 65     | NFCe - Nota Fiscal de Consumidor | ✅ Produção  |
| 58     | MDFe - Manifesto de Documentos   | ✅ Produção  |
| -      | NFSe - Nota Fiscal de Serviço    | 🔄 Planejado |

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    Next.js 14 + React 18                        │
│              Shadcn/UI + Tailwind + Recharts                    │
│                      Port: 3000                                  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│                    NestJS 11 + Prisma                           │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │   Auth   │ │ Analytics│ │Companies │ │ Partners │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │   NFe    │ │   NFCe   │ │   MDFe   │ │Webhooks  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                      │                                           │
│              ┌───────┴───────┐                                   │
│              │ ACBrWrapper   │ ← Integração ACBrLib              │
│              └───────────────┘                                   │
│                      Port: 3001                                  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATABASE                                   │
│                   PostgreSQL 15                                  │
│                      Port: 5432                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Stack Tecnológico

| Camada   | Tecnologia                                            |
| -------- | ----------------------------------------------------- |
| Frontend | Next.js 14, React 18, TypeScript, Shadcn/UI, Recharts |
| Backend  | NestJS 11, Prisma ORM, JWT Auth, Swagger              |
| Database | PostgreSQL 15                                         |
| Fiscal   | ACBrLib (via Node FFI)                                |
| DevOps   | Docker, Docker Compose                                |

---

## 🚀 Instalação

### Pré-requisitos

- Docker & Docker Compose
- Node.js 20+ (para desenvolvimento local)

### Quick Start

```bash
# Clone o repositório
git clone <repo-url>
cd engine_api

# Subir serviços
docker compose up -d

# Verificar logs
docker logs engine-api --tail 20
```

### URLs de Acesso

| Serviço      | URL                            |
| ------------ | ------------------------------ |
| Frontend     | http://localhost:3000          |
| Backend API  | http://localhost:3001          |
| Swagger Docs | http://localhost:3001/api-docs |

### Credenciais de Teste

```
Email: admin@3xtec.com.br
Senha: admin123
```

---

## 🔌 Endpoints da API

### Autenticação

| Método | Endpoint                 | Descrição          |
| ------ | ------------------------ | ------------------ |
| POST   | `/auth/login`            | Obter token JWT    |
| POST   | `/auth/register-partner` | Registrar parceiro |

### Analytics (Dashboard)

| Método | Endpoint                        | Descrição           |
| ------ | ------------------------------- | ------------------- |
| GET    | `/analytics/dashboard`          | Métricas completas  |
| GET    | `/analytics/invoices-by-period` | Dados para gráficos |

### NFe (Modelo 55)

| Método | Endpoint                   | Descrição               |
| ------ | -------------------------- | ----------------------- |
| GET    | `/nfe/status`              | Status do serviço SEFAZ |
| POST   | `/nfe`                     | Emitir NFe              |
| GET    | `/nfe`                     | Listar NFes             |
| GET    | `/nfe/pdf/:accessKey`      | Download DANFE          |
| GET    | `/nfe/xml/:accessKey`      | Download XML            |
| POST   | `/nfe/:accessKey/cancelar` | Cancelar NFe            |
| POST   | `/nfe/:accessKey/cce`      | Carta de Correção       |

### NFCe (Modelo 65)

| Método | Endpoint               | Descrição       |
| ------ | ---------------------- | --------------- |
| POST   | `/nfce`                | Emitir NFCe     |
| GET    | `/nfce`                | Listar NFCes    |
| GET    | `/nfce/pdf/:accessKey` | Download DANFCE |

### MDFe (Modelo 58)

| Método | Endpoint                    | Descrição       |
| ------ | --------------------------- | --------------- |
| POST   | `/mdfe`                     | Emitir MDFe     |
| GET    | `/mdfe`                     | Listar MDFes    |
| POST   | `/mdfe/:accessKey/encerrar` | Encerrar MDFe   |
| GET    | `/mdfe/pdf/:accessKey`      | Download DAMDFE |

### Companies (Empresas)

| Método | Endpoint                     | Descrição             |
| ------ | ---------------------------- | --------------------- |
| POST   | `/companies`                 | Cadastrar empresa     |
| GET    | `/companies`                 | Listar empresas       |
| POST   | `/companies/:id/certificate` | Upload certificado A1 |
| GET    | `/companies/consult/:cnpj`   | Consultar CNPJ        |

### Partners

| Método | Endpoint                       | Descrição          |
| ------ | ------------------------------ | ------------------ |
| GET    | `/partners/profile`            | Perfil do parceiro |
| POST   | `/partners/api-key/regenerate` | Nova API Key       |
| PATCH  | `/partners/webhook`            | Configurar webhook |

### Webhooks

| Método | Endpoint                      | Descrição              |
| ------ | ----------------------------- | ---------------------- |
| GET    | `/webhooks/config`            | Obter configuração     |
| PATCH  | `/webhooks/config`            | Atualizar URL/eventos  |
| POST   | `/webhooks/test`              | Enviar evento de teste |
| GET    | `/webhooks/logs`              | Histórico de entregas  |
| POST   | `/webhooks/secret/regenerate` | Novo secret HMAC       |

**Eventos:** `invoice.authorized`, `invoice.rejected`, `invoice.canceled`, `mdfe.authorized`, `mdfe.closed`, `certificate.expiring`

---

## 📊 Dashboard

O dashboard oferece visão completa das operações:

### KPIs Disponíveis

- **Valor Total (Mês)** - Soma das notas autorizadas
- **Notas Emitidas** - Contador do ciclo atual
- **Taxa de Aprovação** - % de sucesso
- **Custo Estimado** - R$ 0,10 por nota
- **Empresas Ativas** - Issuers no parceiro
- **Rejeições** - Notas negadas

### Gráficos

- **Pie Chart** - Distribuição por status
- **Bar Chart** - Emissões por período (30 dias)

### Alertas

- Certificados expirando em 30 dias (crítico, aviso, info)

---

## 🗺️ Roadmap

### ✅ Concluído

- [x] **Fase 1**: Core API (NFe, NFCe, MDFe)
- [x] **Fase 2**: Dashboard Analytics
- [x] **Fase 3**: Swagger/Developer Experience
- [x] **Fase 4**: Webhooks (notificações em tempo real)

### 🔄 Próximas Fases

- [ ] **Fase 5**: Billing/Monetização (Stripe)
- [ ] **Fase 6**: NFSe (Nota Fiscal de Serviço)
- [ ] **Fase 7**: Multi-tenant Isolation
- [ ] **Fase 8**: Rate Limiting por Plano

---

## 📁 Estrutura do Projeto

```
engine_api/
├── backend/
│   ├── src/
│   │   ├── analytics/      # Dashboard metrics
│   │   ├── auth/           # JWT + API Key auth
│   │   ├── companies/      # Gestão de empresas
│   │   ├── nfe/            # NFe + ACBrWrapper
│   │   ├── nfce/           # NFCe
│   │   ├── mdfe/           # MDFe
│   │   ├── partners/       # Gestão de parceiros
│   │   └── prisma/         # Database service
│   ├── prisma/
│   │   └── schema.prisma   # Schema do banco
│   └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── dashboard/      # Páginas do painel
│   │   └── auth/           # Login
│   ├── components/
│   │   ├── dashboard/      # Charts, KPIs, alerts
│   │   └── ui/             # Shadcn components
│   └── package.json
└── docker-compose.yml
```

---

## 🔧 Desenvolvimento

### Build do Backend (Apple Silicon)

```bash
# Usa buildx para emulação AMD64 (evita bug Prisma)
docker buildx build --platform linux/amd64 \
  -t engine_api-engine-api:latest --load \
  -f backend/Dockerfile backend/
```

### Rodar Frontend Localmente

```bash
cd frontend
npm install
npm run dev
```

---

## 📝 Licença

Proprietário - 3X Tecnologia © 2026
