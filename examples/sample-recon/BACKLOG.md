# Recapp — Remediation Backlog (sample)

**Owner:** (unassigned) · **Sources:** [`audit/00-findings-register.md`](audit/00-findings-register.md) · **Compiled:** 2026-07-14 · **Tracker:** [`STATUS.md`](STATUS.md)
**Delivery rule:** one ticket = one PR to `main`, branch `fix/<id>-<slug>`, with tests + the status tracker updated in the same PR. IDs are the stable audit finding IDs.

> Sample: the four P0 tickets are fully specified; P1/P2 are summarized. On a real run every ticket is spelled out to this depth.

## Dependency graph
```
SEC-1 (RBAC) ─┐
DATA-1 (fail-closed tenant) ─┼─→ safe to expose deployed path → P1 workstream
SEC-2 (webhook tenant) ─┘
BE-1 (worker fails honestly) ── independent, do immediately
```

---

### [SEC-1] Deployed API must authorize, not just authenticate

- **Goal:** every deployed handler enforces role-based permission; unauthorized calls get `403`.
- **Why:** clears the `SEC-1` Critical — today any authenticated user can act on any resource in the tenant. RBAC exists in `core` but is never called on the deployed path. Related: [[DATA-1]].
- **Current state:** `api/src/http-adapter.ts:61` builds `{ db, tenantId, userId }` with **no role** and calls handlers with no permission check; `core/src/rbac.ts` `enforcePermission` is dead code on this path. The local Express path *does* check — classic dual-path drift.
- **Technical implementation:**
  1. Extract `role` from the verified JWT claims in the adapter; add it to the request context.
  2. Add `enforcePermission(ctx.role, requiredPerms)` at the top of each handler (or a wrapper); **deny by default** if no perms are declared.
  3. Map each route → required perms in one table so it's auditable.
  4. Return `403` with a clean message; log the denial.
- **Success criteria:**
  - [ ] `viewer`/wrong-role calls to each mutating route return `403` (unit tests per route)
  - [ ] A route with no declared perms denies by default (test)
  - [ ] Deployed + local paths use the *same* `enforcePermission` (no drift)
- **Effort:** M · **Depends on:** —

### [DATA-1] Fail closed on missing tenant claim

- **Goal:** a request without a valid `tenantId` claim is rejected, never silently mapped to a shared partition.
- **Why:** clears the `DATA-1` Critical — the fail-open `default` commingles tenants the instant a second one exists.
- **Current state:** `core/src/auth.ts:44` — `claimsToContext` does `tenantId = claims.tenantId ?? "default"`. Sibling extractors fail closed; this one doesn't.
- **Technical implementation:**
  1. Remove the `?? "default"` fallback; throw an `Unauthorized` if the claim is absent/blank.
  2. Add a startup assertion that the token issuer actually populates `tenantId`.
  3. Property test over missing/blank/whitespace claims → all rejected.
- **Success criteria:**
  - [ ] Missing/blank `tenantId` claim → `401`, no data access (test)
  - [ ] fast-check property test: no claim shape resolves to `"default"`
  - [ ] Grep shows zero remaining `"default"` tenant fallbacks
- **Effort:** S · **Depends on:** —

### [SEC-2] Ingest webhook derives tenant from identity, not a header

- **Goal:** the webhook writes only into the tenant proven by its credential; the `x-tenant-id` header is ignored.
- **Why:** clears `SEC-2` — trusting the header is a cross-tenant write primitive.
- **Current state:** `api/src/webhooks/ingest.ts:29` verifies the signature, then writes under `req.headers['x-tenant-id']`.
- **Technical implementation:**
  1. Bind each webhook credential/signing key to a specific `tenantId` server-side; resolve tenant from the verified key, not the header.
  2. Reject (or ignore) any `x-tenant-id` header; log if present.
- **Success criteria:**
  - [ ] A signed request with a mismatched `x-tenant-id` writes to the *credential's* tenant, not the header's (test)
  - [ ] Header is never read for authorization (grep + test)
- **Effort:** S · **Depends on:** —

### [BE-1] Worker fails honestly — never "complete" without a summary

- **Goal:** when summarization fails, the job is marked `failed` with a reason; `complete` always implies a real result.
- **Why:** clears `BE-1` — today the worker swallows LLM errors and reports success with an empty summary.
- **Current state:** `worker/src/summarize.ts:88` — a `try/catch` around the LLM call sets `status = complete` in the `catch`.
- **Technical implementation:**
  1. In the `catch`, set `status = failed` + `failureReason`; emit `transcript.failed`; do **not** write an empty result.
  2. Only set `complete` after a validated non-empty result is persisted.
  3. Surface `failed` + reason in the API status response and the UI (with retry).
- **Success criteria:**
  - [ ] LLM throw → job `failed` + reason; no result object written (test with a mocked failing model)
  - [ ] `complete` is unreachable without a persisted, schema-valid result (test)
  - [ ] UI shows the failure + a retry affordance
- **Effort:** M · **Depends on:** —

---

## P1 (summarized — before launch)
- **DATA-2** paginate list queries · **AI-1** wrap/screen untrusted transcript before the prompt · **BE-2** idempotency on at-least-once delivery (dedupe on job id) · **AI-2** read cost from provider `usage` · **INFRA-1** wire alarm subscribers · **INFRA-2** budget/cost alarm · real multi-tenant lifecycle (onboarding, quotas) · summarizer eval harness.

## P2 (hygiene)
- **SEC-3** tighten presigned-URL TTL + content allowlist · **FE-1** implement or remove the dead `DELETE /meetings/:id` · **DEP-1** drop the second lockfile · **SEC-4/INFRA-3/BE-3/FE-2** CORS cleanup, remove dead NAT, unify error envelope, add empty state.

## Suggested sequencing
**Wave 1 (parallel, all P0):** SEC-1 · DATA-1 · SEC-2 · BE-1 — these unblock exposing the deployed path. **Wave 2:** the P1 multi-tenant + AI-safety + ops workstream. **Wave 3:** P2 hygiene.
