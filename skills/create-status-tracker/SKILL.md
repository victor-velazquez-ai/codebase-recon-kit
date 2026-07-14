---
name: create-status-tracker
description: Use when the user wants a single-source-of-truth status tracker for a backlog/epic/project — a master table of tickets with status, priority, effort, owner, PR and notes, plus an at-a-glance summary, blockers, and a dated change log. Keeps ticket/project state honest and current as PRs land. Trigger phrases: "status tracker", "track the tickets", "project status doc", "where are we on the epic", "keep a change log of the work".
---

# Create a Status Tracker (single source of truth for ticket/project state)

Maintain the one document the team trusts for "where is everything right now". It sits beside the [[create-backlog]] (which defines the work) and the [[audit-codebase]] (which motivated it). The rule that keeps it honest: **when a ticket changes state, update this table first — in the same PR that changes it.**

## Output location (always git-ignored)
Write to `recon/STATUS.md` in the target repo. Ensure `recon/` is ignored: `printf 'recon/\n' >> .git/info/exclude`.

## Document structure
1. **Header** — "Single source of truth for … on `<branch/epic>`", authoritative-as-of date (absolute, e.g. `2026-07-08`), companions ([[create-backlog]], [[audit-codebase]]), and the **branch model** (integration branch, ticket branches, final merge).
2. **Legend** — the status + class + priority glyphs (below), so the table is skimmable.
3. **At a glance** — 4–6 bullets: what's done, what's in flight, what's blocked, the critical path, and any decisions locked. A lead should get the whole picture here in 20 seconds.
4. **Master table** — one row per ticket (columns below).
5. **Sequence / waves** — the plan, with completed waves marked ✅.
6. **Blockers / external dependencies** — a table: need | from | what it blocks. Strike through + mark RESOLVED with a date when cleared.
7. **Change log** — dated rows, newest work appended. This is the audit trail of the effort; never rewrite history, append to it.

## Legend (use exactly, so it's scannable)
| Status | Meaning |
|--------|---------|
| ✅ | Done / merged |
| 🟡 | Partial / ops pending |
| 🟠 | In progress / PR open |
| ⬜ | Not started |
| ⬛ | Superseded / dropped |

Class: 🔴 critical path · 🟢 easy win · 🟠 complex.
Priority: **P0** (blocks the effort) · **P1** (needed for launch) · **P2** (polish).

## Master table columns
`Ticket | Title | Pri | Class | Effort | Status | PR | Note`

- **Ticket** — the stable ID from the backlog (`FEAT-3`, `SEC-1`, …).
- **Status** — a legend glyph.
- **PR** — the PR number/link once open, else the branch, else `—`.
- **Note** — the one-line current truth: what landed, what's left, the blocker. Keep it *current* — a stale note is worse than none. Fold key facts here (e.g. "idempotency added; raw-input cap raised 24k→200k").

## Keeping it honest (the whole point)
- **Update in the same PR** that changes a ticket's state. A tracker that lags the code is a liability.
- **Absolute dates**, never "today"/"last week" — convert relative dates when writing.
- **Distinguish "docs/code done" from "verified live".** A ticket whose code merged but whose end-to-end/owner validation is pending is 🟡, not ✅. Say what's left explicitly.
- **Blockers get a resolution or a conditional.** "Waiting on X (blocks only final sign-off)" beats an open-ended blocker.
- **The change log is append-only** and dated — it's how anyone reconstructs how the effort actually went.
- If there is a second, git-ignored working copy of the tracker somewhere, keep it in sync (or point everyone at the one true file).

## When to (re)generate vs. edit
- **First run:** derive every row from the [[create-backlog]] — all ⬜, correct IDs/priorities/deps, empty change log seeded with a "tracker created" row.
- **Ongoing:** *edit* the table and *append* to the change log as PRs land. Don't regenerate from scratch (you'd lose history). Surgically flip Status/PR/Note; add one dated change-log row per meaningful landing.

## Anti-patterns
- A tracker that disagrees with reality (merged tickets still ⬜, or ⬜ tickets that shipped).
- Marking code-merged tickets ✅ when the live/owner validation hasn't happened — that hides real remaining work.
- Rewriting the change log instead of appending.
- Relative dates. "Recently" is not a status.
