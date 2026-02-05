# EngineAPI - Arquitetura do Sistema

## Visão Geral

O EngineAPI é um **Motor Fiscal SaaS B2B2B** que permite Software Houses integrar emissão de documentos fiscais eletrônicos via API REST simples.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CAMADA DE APRESENTAÇÃO                        │
├─────────────────────────────────────────────────────────────────────┤
│  Portal Web (Next.js)          │  APIs Externas (Partners/ERPs)     │
│  - Dashboard                   │  - REST API                        │
│  - Monitor de Notas            │  - API Key Auth                    │
│  - Testing Central             │  - Webhooks                        │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        CAMADA DE APLICAÇÃO                          │
├─────────────────────────────────────────────────────────────────────┤
│  NestJS Backend                                                     │
│  ├── AuthModule (JWT + RBAC + API Key)                             │
│  ├── NfeModule (Emissão, Cancelamento, CC-e)                       │
│  ├── CompaniesModule (Issuers CRUD)                                │
│  ├── PartnersModule (Software Houses)                              │
│  └── AcbrModule (Strategy Pattern: Mock/Real Provider)             │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        CAMADA DE INTEGRAÇÃO                         │
├─────────────────────────────────────────────────────────────────────┤
│  ACBrLib (MT)                  │  Serviços Externos                 │
│  - libacbrnfe64.so             │  - SEFAZ (WebServices)             │
│  - Xvfb (Virtual Display)      │  - BrasilAPI (CNPJ)                │
│  - Certificado A1 (.pfx)       │  - Webhooks (notificações)         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        CAMADA DE DADOS                              │
├─────────────────────────────────────────────────────────────────────┤
│  PostgreSQL                    │  Arquivos                          │
│  - Partners (Software Houses)  │  - Certificados (AES-256)          │
│  - Issuers (Empresas/CNPJs)    │  - XMLs autorizados                │
│  - Invoices (NFes)             │  - PDFs (DANFEs)                   │
│  - FiscalEvents (Audit)        │  - Logs ACBr                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Hierarquia SaaS (B2B2B)

```
3X Tecnologia (Super Admin)
    │
    ├── Partner A (Software House 1)
    │   ├── Issuer A1 (Empresa CNPJ 1)
    │   ├── Issuer A2 (Empresa CNPJ 2)
    │   └── Issuer A3 (Empresa CNPJ 3)
    │
    └── Partner B (Software House 2)
        ├── Issuer B1 (Empresa CNPJ 4)
        └── Issuer B2 (Empresa CNPJ 5)
```

## Stack Tecnológica

| Camada         | Tecnologia                                   |
| -------------- | -------------------------------------------- |
| Frontend       | Next.js 15, React 19, TailwindCSS, shadcn/ui |
| Backend        | NestJS, TypeScript, Prisma ORM               |
| Fiscal         | ACBrLib (Native .so), OpenSSL                |
| Database       | PostgreSQL                                   |
| Infraestrutura | Docker, Xvfb                                 |

## Fluxo de Emissão NFe

```
1. Partner ERP → POST /nfe (JSON simplificado)
       ↓
2. Backend valida dados + monta XML
       ↓
3. ACBrLib assina com certificado A1
       ↓
4. ACBrLib envia para SEFAZ
       ↓
5. SEFAZ retorna protocolo + chave
       ↓
6. Backend persiste Invoice + gera DANFE
       ↓
7. Webhook notifica Partner (opcional)
       ↓
8. Partner recebe XML/PDF via API
```

## Diretórios Principais

```
engine_api/
├── backend/                 # API NestJS
│   ├── src/
│   │   ├── acbr/           # Integração ACBrLib
│   │   ├── auth/           # JWT + API Key
│   │   ├── companies/      # Issuers CRUD
│   │   ├── nfe/            # Core fiscal
│   │   └── partners/       # Software Houses
│   └── prisma/             # Schema + Migrations
├── frontend/               # Portal Next.js
│   ├── app/dashboard/      # Pages (App Router)
│   ├── components/         # UI Components
│   └── services/           # API Client
├── docs/                   # Documentação
├── .agent/workflows/       # Workflows Antigravity
└── docker-compose.yml      # Orquestração
```
