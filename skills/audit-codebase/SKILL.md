---
name: audit-codebase
description: Use when the user wants a rigorous, independent engineering audit of a codebase from the perspective of a very senior engineer AND a very senior AI engineer — finding real correctness/security/architecture/cost defects, judged against the project's actual goal (e.g. "enterprise-grade", "multi-tenant SaaS"), not a narrow framing. Produces a findings register with stable IDs, severity dashboard, per-domain reports with file:line-cited findings, systemic themes, and a P0/P1/P2 remediation roadmap. Trigger phrases: "audit this repo", "senior review", "what's wrong with this codebase", "is this production-ready", "adversarial review", "find the stop-ship bugs".
---

# Audit a Codebase (independent, adversarial, senior-level)

Produce the review a skeptical principal engineer would write on their first hard look — the one that finds what the friendly internal reviews missed. Read-only. Ground every finding in source with `path:line`. Judge severity **against the project's stated ambition**, not against "does it run today".

## Posture (this is the whole game)
- **Adversarial and independent.** Assume prior reviews were too kind. Your job is to find what breaks in production, at a second tenant, at 10× data, or under a hostile input — not to confirm it "looks done".
- **"Looks done" ≠ done.** Handlers that return `200` while doing nothing, success envelopes over fabricated data, green tests that only cover the easy path — these are the highest-value finds. Trace the *deployed* path, not just the one the tests exercise.
- **Judge against the goal.** If the goal is enterprise / multi-tenant SaaS, then "single-tenant hardcoded", "no billing", "fail-open tenant resolution" are High/Critical — even if the internal reviews scored them Low. State the goal explicitly and anchor severity to it.
- **Verify before you assert.** Manually confirm every Critical and every headline High against the actual code. If an earlier analysis is imprecise, correct it. A wrong Critical destroys the audit's credibility.
- **Read-only.** No code/config/spec changes. Cite, don't fix (fixes are tickets — see [[create-backlog]]).

## Output location (always git-ignored)
Write to `local/recon/audit/` in the target repo:
```
local/recon/audit/
  README.md                 ← executive summary (verdict, dashboard, the N Criticals, systemic themes)
  00-findings-register.md   ← every finding in one table + the P0/P1/P2 roadmap
  01-security.md
  02-backend.md
  03-data-layer.md
  04-infrastructure.md
  05-ai-agents.md            (if the system uses AI/LLMs/agents)
  06-frontend.md
  07-dependencies-build.md
  08-<readiness>-and-testing.md   ← SaaS/enterprise readiness + the *reality* of the test suite
```
Ensure `local/` is ignored: `printf 'local/\n' >> .git/info/exclude`.

## Domains (one focused pass each — add/drop to fit the system)
1. **Security** — authN vs authZ (the classic gap: authenticated ≠ authorized), RBAC on the *deployed* path, secrets, IAM scoping, CORS, webhook/signature trust, injection, tenant-security.
2. **Backend** — handler/service correctness, dual-path drift, money/time math, event delivery + idempotency, error handling, "success without work".
3. **Data layer** — schema/keys, index/query correctness (do the GSIs/queries actually run?), pagination/truncation limits, migrations, integrity, tenant partitioning.
4. **Infrastructure** — IaC correctness (CDK/Terraform), IAM, networking, cost controls vs stated budget, CI/CD, **observability that is actually delivered** (alarms with real subscribers), DR/backup.
5. **AI / Agents** (if applicable) — model wiring, prompt-injection exposure on untrusted input, cost telemetry (read from provider `usage`, not self-reported), eval/regression harness, structured-output validation, PII handling, fallback behavior.
6. **Frontend** — auth token wiring, data fetching/caching, error & empty states, accessibility, dead endpoints the UI calls that don't exist.
7. **Dependencies / Build** — lockfile hygiene (no dual lockfiles), supply-chain pins, codegen drift, runtime/version drift, repo hygiene.
8. **Readiness & Testing** — multi-tenancy as a first-class entity (or just a string prefix?), billing/metering, onboarding lifecycle, quotas, and the **honest** state of tests (what do they *actually* cover vs. what's asserted).

## Finding format (every finding, every domain)
Stable ID per domain: `SEC-*`, `BE-*`, `DATA-*`, `INFRA-*`, `AI-*`, `FE-*`, `DEP-*`, `RDY-*` (or `SAAS-*`). Each finding:

- **ID + one-line title** (bold the defect, not the area).
- **Severity** — Critical / High / Medium / Low / Info (rubric below).
- **Location** — `path/to/file.ts:line` (the real line(s)).
- **What & why it's wrong** — the mechanism, concretely. A failing scenario: *input/state → wrong output/breakage*.
- **Recommendation** — the fix direction (not a patch).
- **Effort** — S / M / L.
- **Verified** — ✅ for every Critical + headline High you confirmed against source.

### Severity rubric (against the stated goal)
- **Critical** — data loss/corruption, cross-tenant leakage, authz bypass, money miscalculation, or "reports success, does nothing" on a live path. Stop-ship.
- **High** — breaks under realistic load/scale/second-tenant/hostile input; or a commercialization gap that blocks the stated launch.
- **Medium** — real defect with a workaround or narrow blast radius.
- **Low / Info** — hygiene, latent risk, or a note worth recording.

## The reports

### `README.md` (executive summary) — write this to be read by a lead/exec
1. **Scope & method** — repo, LOC, what was reviewed, "N independent domain passes + manual verification of every Critical/headline High", read-only.
2. **The framing callout** — if internal reviews concluded "production-ready", say where that's true (narrow framing) and where it isn't (the goal). This is the honest, adversarial heart of the audit.
3. **Verdict** — the one-paragraph truth: real strengths (name them — good audits are credible because they're fair), then the blunt "not X today because…" with the 1–2 gaps that drive it.
4. **Severity dashboard** — domain × {Critical, High, Medium, Low, Info, Total} matrix.
5. **The N Critical findings** — a table (ID, finding, where, verified ✅), each independently confirmed.
6. **Systemic themes** — the *patterns* behind the findings (e.g. "dual-path drift", "looks-done ≠ done", "tenant identity not trustworthy end-to-end", "observability wired but undelivered"). This is what separates a senior audit from a linter dump.
7. **How to use** + report index + **caveats/methodology** (what you did *not* exercise — e.g. no live cloud calls — so claims derive from source, not a running account).

### `00-findings-register.md`
- One big table: ID | Sev | Title | Location | Effort | (Status/Owner/PR columns left blank for the team to fill — see [[create-status-tracker]]).
- Then the **remediation roadmap**: **P0** (stop-ship, before any prod exposure), **P1** (before the stated launch — e.g. the multi-tenancy/commercialization/ops workstream), **P2** (hardening/polish). Order P0 by risk.

### Per-domain files
Each is self-contained: a mini severity table, the findings (full format above), a **"prior-review verification"** note where you corrected or confirmed earlier claims, and an **observed strengths** section (be fair — credibility comes from acknowledging what's genuinely good).

## Method checklist
- [ ] State the **goal** you're judging against, explicitly, up top.
- [ ] Trace the **deployed** path, not just the tested/local one — that's where the bugs hide.
- [ ] For each "it works" claim in the code/reviews, ask *does it actually do the work, or just return 200?*
- [ ] Confirm every Critical + headline High against `file:line`. Mark ✅.
- [ ] Separate **defects** (bugs) from **gaps** (unbuilt product) — both matter, label which.
- [ ] Name the **systemic themes** — findings cluster; the clusters are the real story.
- [ ] Be fair: list genuine strengths. An audit that only attacks is easy to dismiss.

## Anti-patterns
- Style nits and lint noise dressed up as findings. Severity must map to real risk against the goal.
- Unverified Criticals. One wrong Critical and the reader stops trusting the rest.
- Vague "improve error handling" recommendations. Say *what* breaks and *what shape* the fix takes.
- Ignoring the AI/LLM layer's specific risks (prompt injection, self-reported cost, no evals) when the system has one.
