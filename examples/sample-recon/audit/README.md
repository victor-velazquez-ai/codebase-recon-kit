# Recapp — Engineering Audit (sample)

**Audit date:** 2026-07-14 · **Scope:** the whole `recapp` monorepo (~22k LOC TS + IaC) — security, backend, data, infra, AI, frontend, deps, readiness. **Method:** independent per-domain passes reading the real code, every Critical + headline High verified against source. **Posture:** read-only.

> **This is an independent, adversarial audit.** The last internal review concluded "0 Critical — ready for the pilot." That's true *within its framing* — a single pilot tenant on the local Express path. Judged against the **stated goal (enterprise, multi-tenant SaaS)**, the picture differs: the defects cluster in the *deployed* path and the multi-tenant layer the internal review didn't exercise.

## 1. Verdict
Recapp is a **cleanly-architected single-tenant prototype** with real strengths: a shared service layer, typed schemas, OIDC-federated deploys, and a tidy React app. It is **not** safe for a second tenant or production traffic today, and it is **a prototype, not a sellable SaaS**. Two things drive that:

1. **Stop-ship defects on the deployed path** — the API authenticates but never authorizes; tenant identity resolves *fail-open* to a shared `"default"` partition; the summarizer worker reports success even when the LLM call fails; list queries silently truncate.
2. **The commercial multi-tenant layer is absent** — "tenant" is a key prefix, not an entity; no onboarding lifecycle, quotas, billing, or per-tenant isolation; the LLM path takes untrusted transcript text with no injection defense.

**Bottom line:** a strong foundation. Fix the **P0** correctness/authz defects before any production exposure; do the **P1** multi-tenancy + AI-safety + ops workstream before launch.

## 2. Severity dashboard
| Domain | Critical | High | Medium | Low | Total |
|--------|:--:|:--:|:--:|:--:|:--:|
| [Security](00-findings-register.md) | 1 | 2 | 1 | 1 | 5 |
| [Backend](00-findings-register.md) | 0 | 1 | 1 | 1 | 3 |
| [Data Layer](00-findings-register.md) | 1 | 1 | 0 | 0 | 2 |
| [Infrastructure](00-findings-register.md) | 0 | 1 | 1 | 1 | 3 |
| [AI / Agents](00-findings-register.md) | 0 | 1 | 1 | 0 | 2 |
| [Frontend](00-findings-register.md) | 0 | 0 | 1 | 1 | 2 |
| [Dependencies](00-findings-register.md) | 0 | 0 | 1 | 0 | 1 |
| **TOTAL** | **2** | **6** | **6** | **4** | **18** |

## 3. The Critical findings (each verified ✅)
| ID | Finding | Where | ✅ |
|----|---------|-------|:--:|
| **SEC-1** | **Deployed API authenticates but never authorizes.** `httpAdapter` builds `{db, tenantId, userId}` with no role and no `enforcePermission`; every handler skips RBAC. Any authenticated user can read/delete any meeting in their tenant — and, combined with DATA-1, across tenants. | `api/src/http-adapter.ts:61` | ✅ |
| **DATA-1** | **Fail-open tenant resolution.** `claimsToContext` defaults `tenantId → "default"` when the JWT claim is missing (siblings fail closed). The moment a second tenant exists, their data commingles in the `default` partition. | `core/src/auth.ts:44` | ✅ |

## 4. Systemic themes (the patterns behind the findings)
1. **Dual-path drift, inverted.** The *local* Express path is hardened and tested; the *deployed* serverless path carries the live bugs (RBAC, tenant resolution, pagination). Green tests guard only the local path.
2. **"Looks done" ≠ done.** The summarizer worker (`BE-1`) catches LLM errors and marks the job `complete` with an empty summary — success to the scheduler, garbage to the user.
3. **Tenant identity isn't trustworthy end-to-end.** Fail-open defaults (`DATA-1`) + a webhook that trusts an `x-tenant-id` header (`SEC-2`) mean isolation is convention, not enforcement.
4. **AI correctness & safety are unmeasured.** Untrusted transcript text flows into the prompt unscreened (`AI-1`); cost is self-reported by the model, not read from provider `usage` (`AI-2`); there's no eval harness.
5. **Observability wired but undelivered.** ~20 alarms publish to SNS topics with zero subscribers (`INFRA-1`).

## 5. How to use this audit
Read [`00-findings-register.md`](00-findings-register.md) for all 18 findings + the P0/P1/P2 roadmap. Finding IDs are stable — they become ticket IDs in [`../BACKLOG.md`](../BACKLOG.md).

## 6. Caveats
Static + read-only; no live cloud calls — IAM/deploy/cost claims derive from IaC source, not a running account. Severity is judged against the **enterprise multi-tenant SaaS** goal, which is why single-tenant hardcoding and missing billing rate higher here than in the internal review.
