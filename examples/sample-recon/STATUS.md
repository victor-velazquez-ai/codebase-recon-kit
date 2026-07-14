# Recapp — Status Tracker (sample)

**Single source of truth for remediation state on `main`.** Authoritative as of **2026-07-14**.
Companion to [`BACKLOG.md`](BACKLOG.md) and [`audit/`](audit/). **When a ticket changes state, update this table first — in the same PR.**

## Legend
| Status | Meaning | | Class | | Priority |
|--|--|--|--|--|--|
| ✅ done/merged · 🟠 in progress · ⬜ not started · 🟡 partial · ⬛ dropped | | | 🔴 critical path · 🟢 easy win · 🟠 complex | | P0 blocks exposure · P1 needed for launch · P2 polish |

## At a glance
- **18 findings** from the audit: **2 Critical · 6 High · 6 Medium · 4 Low.**
- **P0 (the 4 stop-ship tickets) not started** — these gate any production exposure or a second tenant.
- **Critical path:** SEC-1 + DATA-1 + SEC-2 (deployed-path safety) can run in parallel with BE-1 (worker honesty).
- **P1** is the multi-tenant + AI-safety + ops workstream; **P2** is hygiene.
- No external blockers — all P0 work is in-repo.

## Master table (P0 + representative P1/P2)
| Ticket | Title | Pri | Class | Effort | Status | PR | Note |
|--------|-------|:--:|:--:|:--:|:--:|:--:|------|
| SEC-1 | Deployed API must authorize (RBAC) | P0 | 🔴 | M | ⬜ | — | `enforcePermission` is dead code on the deployed path; deny-by-default |
| DATA-1 | Fail closed on missing tenant claim | P0 | 🔴 | S | ⬜ | — | remove `?? "default"`; property-test claim shapes |
| SEC-2 | Webhook tenant from identity, not header | P0 | 🔴 | S | ⬜ | — | bind signing key → tenant; ignore `x-tenant-id` |
| BE-1 | Worker fails honestly (no empty "complete") | P0 | 🔴 | M | ⬜ | — | mark `failed`+reason on LLM error |
| DATA-2 | Paginate list queries | P1 | 🟠 | M | ⬜ | — | `LastEvaluatedKey` loop; truncates at 1 MB today |
| AI-1 | Wrap/screen untrusted transcript before prompt | P1 | 🟠 | M | ⬜ | — | injection defense on attacker-influenceable text |
| BE-2 | Idempotency on at-least-once delivery | P1 | 🟠 | M | ⬜ | — | dedupe on job id; avoid double-charge |
| AI-2 | Cost from provider `usage`, not self-report | P1 | 🟢 | S | ⬜ | — | trust the bill, not the model |
| INFRA-1 | Wire alarm subscribers | P1 | 🟢 | S | ⬜ | — | ~20 alarms → SNS with 0 subscribers |
| FE-1 | Implement/remove dead `DELETE /meetings/:id` | P2 | 🟢 | S | ⬜ | — | UI calls a nonexistent handler |
| DEP-1 | Drop the second lockfile | P2 | 🟢 | S | ⬜ | — | `web/package-lock.json` in a pnpm workspace |

## Sequence / waves
- **Wave 1 (now, parallel):** SEC-1 · DATA-1 · SEC-2 · BE-1 — unblocks deployed-path exposure.
- **Wave 2:** DATA-2 · AI-1 · BE-2 · AI-2 · INFRA-1 + the multi-tenant lifecycle.
- **Wave 3:** P2 hygiene.

## Blockers / external dependencies
| # | Need | From | Blocks |
|---|------|------|--------|
| — | none — all P0 work is in-repo | — | — |

## Change log
| Date | Change |
|------|--------|
| 2026-07-14 | Tracker created from the audit findings register (18 findings). All tickets ⬜; P0 = SEC-1/DATA-1/SEC-2/BE-1. |
