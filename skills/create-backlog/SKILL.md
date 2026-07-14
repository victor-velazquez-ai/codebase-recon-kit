---
name: create-backlog
description: Use when the user wants a rigorous, implementation-ready ticket backlog for a feature or a remediation effort — stable ticket IDs, per-ticket goal/why/current-state/technical-implementation/success-criteria/effort/dependencies, a dependency graph, and a suggested build sequence. Turns an audit's findings or a feature idea into tickets an engineer (or agent) can pick up and execute one-PR-at-a-time. Trigger phrases: "make a backlog", "break this into tickets", "create the requirements", "turn the audit into a plan", "what are the tickets".
---

# Create a Backlog (implementation-ready tickets)

Turn a goal — a new feature, or an [[audit-codebase]] finding set — into tickets that are so concrete an engineer or an autonomous agent can execute each one as a single clean PR, with tests and a self-audit, without asking follow-ups. The definition of done is: **the success-criteria checkboxes.**

## Output location (always git-ignored)
Write to `local/recon/BACKLOG.md` (single file) in the target repo. For a large multi-epic effort, use `local/recon/backlog/<epic>-BACKLOG.md`. Ensure `local/` is ignored: `printf 'local/\n' >> .git/info/exclude`.

## Before writing
- Read the code the tickets will touch — every ticket's **Current state** must reflect what's actually there (`path:line`), not an assumption. This is what makes a backlog trustworthy.
- If an audit exists, map findings → tickets (a ticket may clear one finding or a tightly-coupled cluster). Carry the finding IDs into the ticket.
- Confirm the **delivery model**: branch naming, where PRs target (e.g. an integration branch vs `dev`), and "one ticket = one PR + tests + tracker update".

## Document structure
1. **Header** — owner, sources, compiled date, cross-refs (to the [[audit-codebase]] and [[create-status-tracker]]), and the **delivery rule** (branch naming, PR target, one-ticket-one-PR).
2. **Dependency graph** — a small ASCII (or Mermaid) graph showing the critical path and what's parallelizable. Readers plan waves from this.
3. **One section per ticket** (format below). IDs are **stable** — reference them in PR titles.
4. **Suggested sequencing** — waves: what to do first (parallel-friendly), then the critical chain.
5. **Open questions / what I need to unblock** — a table: need | from whom | what it blocks. Resolve or mark conditional; never let an open question silently block.

## Ticket format (every ticket)
Use stable IDs (`FEAT-0…`, or the epic prefix, or the audit finding IDs). Each ticket:

```
### [ID] Short imperative title

- **Goal:** the one-sentence outcome (what exists when this is done).
- **Why:** the reason it matters / the finding it clears. Link related tickets with [[id]].
- **Current state:** what's there today, cited — `path/to/file.ts:line`. Name the gap precisely (e.g. "endpoint called by the UI but no backend handler exists — zero matches for `presign` in handlers/").
- **Technical implementation:** a numbered, concrete plan — the files to add/change, the functions/shapes, the IaC/route/IAM wiring, the schema/migration, the codegen. Specific enough to execute without guessing. Name real files and conventions from *this* repo.
- **Success criteria:** checkbox list — the definition of done. Each box is objectively verifiable (a test passes, an endpoint returns the right code, no financial string survives, CDK synth asserts scoped IAM). Include the test(s) to write.
- **Effort:** S / M / L.
- **Depends on:** ticket IDs (or "—").
```

## Quality bar
- **Executable, not aspirational.** "Add RBAC" is not a ticket. "Add `enforcePermission(role, ['admin','pm'])` in `http-adapter.ts:74` before building `ServiceDeps`; unit-test 403 for `viewer`; CDK-synth-test the route" is a ticket.
- **Current state is cited and true.** Read the file; quote the line. A backlog built on assumptions produces wrong PRs.
- **Success criteria are the contract.** Write them as the checks a reviewer (or the [[create-status-tracker]]) will tick. Prefer objective/automatable ones (a test, a status code, a synth assertion) over "looks right".
- **Right-size tickets.** One coherent PR each — big enough to be worth a PR, small enough to review in one sitting. Split epics into stacked tickets with explicit `Depends on`.
- **Encode the hard rules as criteria.** If the domain has invariants (no financials leak, tenant isolation, idempotency on at-least-once delivery), make them explicit success-criteria, not hopes.
- **Preserve traceability.** Feature bullet or audit finding → ticket → (later) PR. IDs stable forever.

## Sequencing
Group into waves. Wave 1 = the prerequisites + anything parallelizable (no deps). Then the critical chain in dependency order. Call out what can run in parallel so multiple people/agents can pick tickets without colliding.

## Anti-patterns
- Vague tickets ("improve X", "refactor Y") with no files, no criteria.
- Current-state written from memory instead of the code.
- Bundling an entire epic into one ticket/PR (unreviewable). Stack instead.
- Success criteria that can't be checked ("works well").
- Dropping the dependency graph — without it nobody can plan the order.
