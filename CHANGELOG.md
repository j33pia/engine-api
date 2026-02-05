# Changelog

Todas as mudanças notáveis do projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [2.3.0] - 2026-02-05 (WIP)

### Adicionado

#### Fase 6: NFSe - Nota Fiscal de Serviço Eletrônica

- **NfseModule** no backend (usando ACBrNFSe)
  - `POST /nfse` - Emitir NFSe
  - `GET /nfse` - Listar NFSes
  - `GET /nfse/:id` - Detalhes
  - `POST /nfse/:id/cancelar` - Cancelar
  - `GET /nfse/pdf/:id` - Download PDF
  - `GET /nfse/xml/:id` - Download XML
- **Mock NfseProvider** para desenvolvimento
- **Suporte a 300+ municípios** (via ACBrNFSe)
  - Padrões: ABRASF, Ginfes, ISSNet, Betha, IPM
- **Frontend** - Página de monitor (`/dashboard/nfse`)
  - Tabela com filtros por status e busca
  - Download de XML e PDF
  - Link na sidebar com ícone Receipt 🧾

### Modificado

- Schema Prisma: novo modelo `Nfse`
- Relação `nfses[]` no Issuer
- Regra ACBr expandida no CLAUDE.md (ADR-001)

---

## [2.2.0] - 2026-02-05

### Adicionado

#### Fase 4: Webhooks

- **WebhooksModule** no backend
  - `GET /webhooks/config` - Obter configuração
  - `PATCH /webhooks/config` - Atualizar URL e eventos
  - `POST /webhooks/test` - Enviar evento de teste
  - `GET /webhooks/logs` - Histórico de entregas
  - `POST /webhooks/secret/regenerate` - Gerar novo secret
- **Eventos suportados**:
  - `invoice.authorized` - NFe/NFCe autorizada
  - `invoice.rejected` - NFe/NFCe rejeitada
  - `invoice.canceled` - Cancelamento autorizado
  - `mdfe.authorized` - MDFe autorizado
  - `mdfe.closed` - MDFe encerrado
  - `certificate.expiring` - Certificado expirando
- **Segurança**:
  - Assinatura HMAC (header `X-Webhook-Signature`)
  - Secret mascarado na UI
  - Retry automático (5 tentativas com backoff)
- **Frontend** - Página de configuração (`/dashboard/settings/webhooks`)
  - Formulário de URL e seleção de eventos
  - Visualização/cópia/regeneração do secret
  - Histórico de entregas com status
  - Documentação de integração HMAC
- **Componentes UI**:
  - `Checkbox` (shadcn/ui + radix)
  - Link na sidebar com ícone Bell 🔔

### Modificado

- Schema Prisma: campos `webhookSecret`, `webhookEvents` no Partner
- Novo modelo `WebhookDelivery` para logs de entrega

---

## [2.1.0] - 2026-02-04

### Adicionado

#### Fase 3: Developer Experience

- **Swagger UI** profissional em `/api-docs`
- Descrição detalhada da API com Rate Limits e suporte
- Autenticação Bearer JWT configurada
- Autenticação API Key (`X-API-Key`) configurada
- **7 tags organizadas**:
  - 🔐 Auth
  - 📊 Analytics
  - 🏢 Companies
  - 📄 NFe
  - 🧾 NFCe
  - 🚚 MDFe
  - 👥 Partners
- Decorators Swagger em todos os controllers
- Exemplos de request/response nos endpoints

#### Documentação

- `README.md` completo com instalação e endpoints
- `docs/ARCHITECTURE.md` com diagramas Mermaid
- `CHANGELOG.md` para histórico de versões

---

## [2.0.0] - 2026-02-04

### Adicionado

#### Fase 2: Dashboard Analytics

- **AnalyticsModule** no backend
  - `GET /analytics/dashboard` - Métricas completas
  - `GET /analytics/invoices-by-period` - Dados por período
- **Novos componentes frontend**:
  - `status-chart.tsx` - Pie chart de distribuição por status
  - `cert-alert.tsx` - Alertas de certificado expirando
- **KPIs no Dashboard**:
  - Valor Total (Mês)
  - Notas Emitidas
  - Taxa de Aprovação
  - Custo Estimado
  - Empresas Ativas
  - Rejeições (Mês)
- **Bar Chart** de emissões por período (30 dias)
- Alertas de certificado com severidade (crítico, aviso, info)

### Modificado

- `overview.tsx` recebe dados via props
- `page.tsx` do dashboard refatorada para usar novo endpoint

---

## [1.5.0] - 2026-02-02

### Adicionado

#### Fase 6: MDFe (Modelo 58)

- **MdfeModule** completo
  - `POST /mdfe` - Emitir MDFe
  - `GET /mdfe` - Listar MDFes
  - `POST /mdfe/:accessKey/encerrar` - Encerrar viagem
  - `GET /mdfe/pdf/:accessKey` - Download DAMDFE
  - `GET /mdfe/xml/:accessKey` - Download XML
- **Monitor MDFe** no frontend (`/dashboard/mdfe`)
- Sidebar atualizada com ícone de caminhão 🚚
- Correção do campo `vCarga` para valores monetários

---

## [1.4.0] - 2026-02-01

### Adicionado

- **Layout DANFE profissional** (HTML)
- Formatação de CNPJ, CPF e valores monetários
- Inclusão de dados do cliente na query Prisma

### Corrigido

- Campos inexistentes no modelo Invoice/InvoiceItem
- Referências a `issuer.cep` e `invoice.protocol`

---

## [1.3.0] - 2026-01-30

### Adicionado

- **NFCe Module** (Modelo 65)
- DANFCE em HTML
- Monitor de notas unificado (NFe + NFCe)

---

## [1.2.0] - 2026-01-29

### Corrigido

- Erro `PrismaClientInitializationError` no startup
- Bug do Prisma Client no Apple Silicon (ARM64)
- Documentação do workaround com `DOCKER_DEFAULT_PLATFORM`

---

## [1.1.0] - 2026-01-28

### Adicionado

- **CompaniesModule** - Gestão de empresas
- Upload de certificado A1 (.pfx)
- Consulta CNPJ via ReceitaWS

---

## [1.0.0] - 2026-01-27

### Adicionado

- **NfeModule** - Emissão de NFe (Modelo 55)
- **AuthModule** - JWT + API Key authentication
- **ACBrWrapper** - Integração com ACBrLib
- **Mock Provider** para desenvolvimento
- **Real Provider** para produção
- Frontend inicial com Next.js 14
- Dashboard básico
- Docker Compose para desenvolvimento

---

## Tipos de Mudanças

- `Adicionado` - Novas funcionalidades
- `Modificado` - Mudanças em funcionalidades existentes
- `Depreciado` - Funcionalidades que serão removidas
- `Removido` - Funcionalidades removidas
- `Corrigido` - Correções de bugs
- `Segurança` - Correções de vulnerabilidades
