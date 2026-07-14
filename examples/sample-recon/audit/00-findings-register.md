# Recapp — Findings Register & Roadmap (sample)

All 18 findings, stable IDs. `Status`/`Owner`/`PR` are left blank for the team to fill via the [status tracker](../STATUS.md). Severity is judged against the **enterprise multi-tenant SaaS** goal.

| ID | Sev | Title | Location | Effort | Status | Owner | PR |
|----|-----|-------|----------|:--:|:--:|:--:|:--:|
| SEC-1 | 🔴 Critical | Deployed API authenticates but never authorizes (no RBAC on any handler) | `api/src/http-adapter.ts:61` | M | | | |
| DATA-1 | 🔴 Critical | Fail-open tenant resolution — missing claim → shared `default` partition | `core/src/auth.ts:44` | S | | | |
| SEC-2 | 🟠 High | Ingest webhook trusts an unauthenticated `x-tenant-id` header → cross-tenant write | `api/src/webhooks/ingest.ts:29` | S | | | |
| BE-1 | 🟠 High | Summarizer worker marks job `complete` when the LLM call throws (empty summary reported as success) | `worker/src/summarize.ts:88` | M | | | |
| DATA-2 | 🟠 High | List queries never paginate — silently truncate at the 1 MB page as data grows | `core/src/db.ts:132` | M | | | |
| AI-1 | 🟠 High | Untrusted transcript text concatenated into the prompt — no injection screen / untrusted-wrap | `worker/src/prompt.ts:20` | M | | | |
| INFRA-1 | 🟠 High | ~20 CloudWatch alarms publish to SNS topics with zero subscribers — alerts go nowhere | `infra/lib/monitoring.ts:70` | S | | | |
| SEC-3 | 🟡 Medium | Presigned upload URL TTL is 24 h (over-broad); no content-type/size allowlist | `api/src/uploads.ts:41` | S | | | |
| BE-2 | 🟡 Medium | Retry on the worker is not idempotent — a duplicate delivery re-summarizes + double-charges | `worker/src/handler.ts:35` | M | | | |
| AI-2 | 🟡 Medium | LLM cost telemetry self-reported by the model, not read from provider `usage` | `worker/src/summarize.ts:120` | S | | | |
| INFRA-2 | 🟡 Medium | No AWS Budget / cost alarm despite a stated <$200/mo target | `infra/lib/monitoring.ts` | S | | | |
| FE-1 | 🟡 Medium | UI calls `DELETE /meetings/:id` but no backend handler exists (dead endpoint, silent failure) | `web/src/api/meetings.ts:54` | S | | | |
| DEP-1 | 🟡 Medium | Second lockfile committed (`web/package-lock.json` in a pnpm workspace) — supply-chain hazard | `web/package-lock.json` | S | | | |
| SEC-4 | 🔵 Low | CORS allow-list includes a stale preview domain | `api/src/cors.ts:12` | S | | | |
| BE-3 | 🔵 Low | Inconsistent error envelope shape between two handlers | `api/src/errors.ts` | S | | | |
| INFRA-3 | 🔵 Low | Terraform still provisions a removed NAT gateway (doc/reality drift, cost) | `infra/tf/network.tf:40` | S | | | |
| FE-2 | 🔵 Low | No empty-state for the meetings list (renders a bare table) | `web/src/pages/Meetings.tsx:88` | S | | | |

## Remediation roadmap

### P0 — stop-ship (before any production exposure or a second tenant)
1. **SEC-1** — add server-side RBAC to the deployed handlers (`enforcePermission(role, …)` in the adapter; deny by default).
2. **DATA-1** — fail *closed* on a missing tenant claim; never default to `default`. Add a property test over missing/blank claims.
3. **SEC-2** — derive tenant from the verified JWT, never a request header; reject the header path.
4. **BE-1** — the worker must mark `failed` (not `complete`) when the LLM call throws; surface the reason; never report success without a real summary.

### P1 — before launch (the multi-tenant + AI-safety + ops workstream)
- **DATA-2** pagination; **AI-1** untrusted-input wrapping + injection screen; **BE-2** idempotency on at-least-once delivery; **AI-2** read cost from provider `usage`; **INFRA-1** wire alarm subscribers; **INFRA-2** budget/cost alarm; a real multi-tenant lifecycle (onboarding, quotas, per-tenant isolation) and an eval harness for the summarizer.

### P2 — hardening / hygiene
- **SEC-3, SEC-4, BE-3, DEP-1, INFRA-3, FE-1, FE-2** — presigned-URL scoping, CORS cleanup, error-envelope consistency, drop the second lockfile, remove the dead NAT, wire the dead delete endpoint, add empty states.
