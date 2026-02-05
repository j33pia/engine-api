# EngineAPI - Engineering Standards

> Padrões de engenharia de software de nível enterprise.
> Inspirado em Google Engineering Practices, Meta Production Engineering, e Stripe API Design.

---

## 🎯 Core Philosophy

```
"Code is read more often than it is written."
"Documentation is a love letter to your future self."
"Every commit tells a story."
```

---

## 📋 Mandatory Documentation Protocol

### On Every Code Change

| Action             | Documentation Required                                      |
| ------------------ | ----------------------------------------------------------- |
| New Module/Service | Update `docs/ARCHITECTURE.md` with component diagram        |
| New API Endpoint   | Add to `README.md` (Endpoints section) + Swagger decorators |
| Schema Change      | Update ERD in `docs/ARCHITECTURE.md` + migration notes      |
| Bug Fix            | Add to `CHANGELOG.md` under `### Corrigido`                 |
| New Feature        | Add to `CHANGELOG.md` + update `walkthrough.md`             |
| Breaking Change    | **MAJOR**: Update all docs + create migration guide         |
| Config Change      | Update `README.md` (Environment section)                    |

### Documentation Files (Keep Updated)

```
engine_api/
├── README.md              # Primary entry point - always current
├── CHANGELOG.md           # Every release, every fix
├── docs/
│   ├── ARCHITECTURE.md    # System design, diagrams, decisions
│   ├── API.md             # Deep API documentation (beyond Swagger)
│   ├── DEPLOYMENT.md      # Production deployment guide
│   └── TROUBLESHOOTING.md # Known issues and solutions
└── .agent/
    └── workflows/         # Automation workflows
```

---

## 🔧 Code Quality Standards

### TypeScript/JavaScript

```typescript
// ✅ GOOD: Self-documenting code
async function emitInvoice(
  dto: CreateNfeDto,
  issuerId: string,
): Promise<Invoice> {
  // Validate issuer has valid certificate
  const issuer = await this.validateIssuerCertificate(issuerId);

  // Build XML following SEFAZ schema
  const xml = this.buildNfeXml(dto, issuer);

  // Sign and transmit to SEFAZ
  return this.transmitToSefaz(xml, issuer);
}

// ❌ BAD: Magic numbers, unclear intent
async function emit(d: any, id: string) {
  const i = await this.repo.find(id);
  if (i.cert < Date.now()) throw new Error("err");
  return this.send(d, i);
}
```

### Naming Conventions

| Type      | Convention  | Example                     |
| --------- | ----------- | --------------------------- |
| Files     | kebab-case  | `analytics-response.dto.ts` |
| Classes   | PascalCase  | `AnalyticsService`          |
| Methods   | camelCase   | `getDashboardMetrics()`     |
| Constants | UPPER_SNAKE | `MAX_RETRY_ATTEMPTS`        |
| Endpoints | kebab-case  | `/invoices-by-period`       |

### Error Handling

```typescript
// ✅ GOOD: Specific, actionable errors
throw new BadRequestException({
  code: "INVALID_CERTIFICATE",
  message: "O certificado digital expirou",
  expiresAt: issuer.certExpiresAt,
  action: "Faça upload de um novo certificado A1",
});

// ❌ BAD: Generic errors
throw new Error("Error");
```

---

## 📊 API Design Standards (Stripe-Inspired)

### Response Format

```typescript
// Success Response
{
  "data": { ... },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-02-04T23:45:00Z",
    "version": "2.0.0"
  }
}

// Error Response
{
  "error": {
    "code": "INVOICE_REJECTED",
    "message": "NFe rejeitada pela SEFAZ",
    "details": {
      "cStat": "301",
      "xMotivo": "Uso Denegado"
    },
    "suggestion": "Verifique a IE do destinatário"
  }
}
```

### Versioning

- Use header: `X-API-Version: 2.0`
- Breaking changes require new major version
- Deprecated endpoints have 6-month sunset

### Rate Limiting Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200
```

---

## 🧪 Testing Requirements

### Coverage Targets

| Type               | Minimum |
| ------------------ | ------- |
| Unit Tests         | 80%     |
| Integration Tests  | 60%     |
| E2E Critical Paths | 100%    |

### Test Naming

```typescript
describe("NfeService", () => {
  describe("emitir", () => {
    it("should create authorized invoice when SEFAZ returns 100", async () => {});
    it("should throw BadRequestException when certificate expired", async () => {});
    it("should retry 3 times on timeout before failing", async () => {});
  });
});
```

---

## 🔒 Security Checklist

Before any code deployment:

- [ ] No secrets in code (use env vars)
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (Prisma parameterized)
- [ ] XSS prevention (sanitize outputs)
- [ ] Rate limiting configured
- [ ] Audit logging for sensitive operations
- [ ] Certificate passwords encrypted at rest

---

## 📝 Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type       | Description             |
| ---------- | ----------------------- |
| `feat`     | New feature             |
| `fix`      | Bug fix                 |
| `docs`     | Documentation only      |
| `refactor` | No functional change    |
| `perf`     | Performance improvement |
| `test`     | Adding tests            |
| `chore`    | Build/tooling           |

### Examples

```
feat(analytics): add certificate expiration alerts

- Added certAlerts to dashboard response
- Created CertAlert component with severity levels
- Filters certificates expiring in next 30 days

Closes #42
```

---

## 🌿 Git Workflow (Automatic)

### Repository

- **GitHub:** https://github.com/j33pia/engine-api
- **Default Branch:** `main`
- **Protection:** Require PR for production changes

### Branching Strategy (Git Flow Simplified)

```
main          ────●────●────●────●──── (produção)
                   \         /
feature/xyz         ●───●───●           (desenvolvimento)
```

| Branch      | Purpose                    | Naming                   |
| ----------- | -------------------------- | ------------------------ |
| `main`      | Produção estável           | -                        |
| `feature/*` | Novas funcionalidades      | `feature/add-webhooks`   |
| `fix/*`     | Correções de bugs          | `fix/certificate-upload` |
| `hotfix/*`  | Correções urgentes em prod | `hotfix/auth-crash`      |
| `docs/*`    | Apenas documentação        | `docs/update-readme`     |

### I WILL AUTOMATICALLY:

#### On Every Feature Completion:

```bash
# 1. Stage all changes
git add .

# 2. Commit with conventional message
git commit -m "feat(module): description"

# 3. Push to remote
git push origin main
```

#### On Bug Fixes:

```bash
git add .
git commit -m "fix(module): description

Root cause: [explanation]
Solution: [what was done]"
git push origin main
```

#### On Documentation Updates:

```bash
git add .
git commit -m "docs: update [file]"
git push origin main
```

### Commit Frequency

| Situation            | When to Commit                  |
| -------------------- | ------------------------------- |
| New Feature Complete | Immediately                     |
| Bug Fixed            | Immediately                     |
| Phase Completed      | Immediately                     |
| Significant Change   | Before moving to next task      |
| End of Session       | Always push uncommitted changes |

### Git Commands Reference

```bash
# Check status
git status

# View recent commits
git log --oneline -10

# Create feature branch
git checkout -b feature/new-feature

# Merge to main
git checkout main
git merge feature/new-feature

# Push with tags
git tag v2.1.0
git push origin main --tags

# Revert last commit (keep changes)
git reset --soft HEAD~1

# Revert last commit (discard changes)
git reset --hard HEAD~1
```

### GitHub Integration

```bash
# Create Pull Request
gh pr create --title "feat: description" --body "Details..."

# View open PRs
gh pr list

# Merge PR
gh pr merge --squash

# Create Release
gh release create v2.1.0 --notes "Release notes..."
```

### Before Every Push Checklist

- [ ] Code compiles without errors
- [ ] No console.log/debug statements
- [ ] Tests passing
- [ ] Documentation updated
- [ ] CHANGELOG entry added
- [ ] Commit message follows convention

### Automatic Push Schedule

| Event                | Action                    |
| -------------------- | ------------------------- |
| Feature complete     | Commit + Push             |
| Bug fixed            | Commit + Push             |
| Documentation update | Commit + Push             |
| End of work session  | Commit + Push all changes |
| Breaking change      | Commit + Push + Tag       |

---

## 🚀 Deployment Checklist

Before every deploy:

1. [ ] All tests passing
2. [ ] CHANGELOG.md updated
3. [ ] Documentation reflects changes
4. [ ] Swagger docs verified
5. [ ] Database migrations tested
6. [ ] Rollback plan documented
7. [ ] Monitoring alerts configured

---

## 📈 Performance Standards

### API Response Times

| Endpoint Type    | Target | Max   |
| ---------------- | ------ | ----- |
| Read (GET)       | <100ms | 500ms |
| Write (POST)     | <500ms | 2s    |
| Report/Analytics | <1s    | 5s    |
| File Download    | <2s    | 10s   |

### Database

- Index all foreign keys
- Explain analyze on new queries
- No N+1 queries (use include/join)
- Connection pooling enabled

---

## 🎓 Architecture Decision Records (ADR)

For significant decisions, create ADR:

```markdown
# ADR-001: Use ACBrLib for ALL Fiscal Document Integration

## Status: Accepted (MANDATORY)

## Context

Precisamos integrar com a SEFAZ para emissão de documentos fiscais eletrônicos.

## Decision

**OBRIGATÓRIO**: Usar ACBrLib via Node FFI para TODOS os documentos fiscais:

- **ACBrNFe** - Nota Fiscal Eletrônica (Modelo 55)
- **ACBrNFCe** - Nota Fiscal de Consumidor (Modelo 65)
- **ACBrMDFe** - Manifesto de Documentos (Modelo 58)
- **ACBrNFSe** - Nota Fiscal de Serviço (ABRASF/Municipal)

## Consequences

- ✅ Biblioteca matura e testada (20+ anos)
- ✅ Suporte a TODOS os documentos fiscais brasileiros
- ✅ Gerencia múltiplos WebServices municipais para NFSe
- ✅ Comunidade ativa e documentação completa
- ❌ Requer Linux para produção
- ❌ Binding C++ pode ser frágil
```

---

## 🔄 Auto-Documentation Rules

### I WILL AUTOMATICALLY:

1. **Every new feature** → Update `CHANGELOG.md`
2. **Every new endpoint** → Add Swagger decorators + README
3. **Every bug fix** → Add to CHANGELOG + document root cause
4. **Every architecture change** → Update Mermaid diagrams
5. **Every deployment** → Update version numbers
6. **Every breaking change** → Create migration guide

### Documentation Quality Checks

- [ ] No outdated information
- [ ] All code examples are runnable
- [ ] Screenshots/diagrams are current
- [ ] Links are not broken
- [ ] Version numbers match

---

## 🏆 Definition of Done

A feature is DONE when:

1. ✅ Code is written and reviewed
2. ✅ Tests are passing (>80% coverage)
3. ✅ Documentation is updated
4. ✅ CHANGELOG entry added
5. ✅ Swagger docs updated
6. ✅ README reflects changes
7. ✅ No lint errors
8. ✅ Performance meets targets
9. ✅ Security checklist passed
10. ✅ Demo recorded (for UI changes)

---

_"Move fast and document things."_ — This Project's Motto
