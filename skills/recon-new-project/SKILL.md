---
name: recon-new-project
description: Use when entering a NEW/unfamiliar codebase and you want the full senior-engineer intake in one go — audit, then documentation, then backlog, then status tracker — with every artifact written to a single local, git-ignored folder. The one-command onboarding for "I just cloned this repo, get me to expert-level understanding and a plan." Trigger phrases: "recon this repo", "onboard me to this codebase", "do the full intake", "new project, run the whole thing", "audit + docs + backlog + tracker".
---

# Recon a New Project (full intake pipeline)

The orchestrator. When you land in an unfamiliar repo, run the four recon skills **in order**, feeding each one's output into the next, and put everything in one local, git-ignored folder so nothing pollutes the repo's tracked tree. Output is an onboarding pack a new senior owner (human or agent) can act on immediately.

## 0. Set up the local, non-tracked workspace (do this first)
Create the output folder and make git ignore it **without touching tracked files**:
```bash
mkdir -p recon/audit recon/docs/md
printf 'recon/\n' >> .git/info/exclude   # local-only ignore; does not modify the repo's .gitignore
```
(If the user prefers a tracked ignore, add `recon/` to `.gitignore` instead. If it's not a git repo, just create `recon/` — nothing tracks it.)

Final layout:
```
recon/
  audit/          ← audit reports (from audit-codebase)
  docs/
    md/           ← documentation chapters (from document-codebase)
    html/         ← generated site
    build-html.mjs
  BACKLOG.md      ← from create-backlog
  STATUS.md       ← from create-status-tracker
```

## 1. Run the skills in order
Each step builds on the last. Do them sequentially — later steps consume earlier outputs.

1. **Audit → `recon/audit/`** — invoke [[audit-codebase]]. Read the deployed path, find the real defects/gaps, judge against the project's stated goal. This first pass also *is* your deep read of the system, which powers everything after.
2. **Document → `recon/docs/`** — invoke [[document-codebase]]. Write the chapters (now easy — you just audited it), add Mermaid diagrams, then build the HTML site. The audit informs the "gotchas" and the reality-vs-intent notes.
3. **Backlog → `recon/BACKLOG.md`** — invoke [[create-backlog]]. Turn the audit's findings (and any feature goal the user gave) into stable, executable tickets with cited current-state and checkable success-criteria.
4. **Status tracker → `recon/STATUS.md`** — invoke [[create-status-tracker]]. Seed the master table from the backlog (all ⬜), with the legend, at-a-glance, blockers, and a "tracker created" change-log row.

> Order matters: **audit first** (it's the deep read + the truth-finding), **docs second** (explain what you now understand), **backlog third** (turn findings into work), **tracker last** (track that work). If the user only wants a subset, run just those steps — but keep this order.

## 2. Scale to the ask
- **Quick recon** ("just get me oriented"): a lighter audit (headline findings only), a shorter doc set (overview + architecture + data-model + one flow), a starter backlog of the top P0s, and the tracker. Say what you scoped down.
- **Full intake** ("be thorough" / entering to own it): all eight audit domains, the full chapter set with diagrams, the complete backlog with dependency graph + waves, the full tracker.

## 3. Wrap up — write `recon/README.md`
A one-page index of the pack: what's inside, the headline verdict from the audit, the count of findings by severity, the number of doc chapters + diagrams, the number of tickets by priority, and how to read it (open `docs/html/index.html`, start at the audit summary, then the backlog). Link the four artifacts.

## 4. Report to the user
Give the top-line: the audit verdict + Critical count, where the HTML site is, how many tickets (by priority), and the single most important thing you found. Point them at `recon/README.md` and `recon/docs/html/index.html`.

## Principles
- **Everything under `recon/`**, always git-ignored. Never write these artifacts into the repo's tracked tree unless the user explicitly asks to promote them.
- **One deep read, four lenses.** The audit is the deep read; docs/backlog/tracker are re-expressions of the same hard-won understanding. Don't re-derive from scratch each step.
- **Cite reality.** Every artifact is anchored in `path:line`. The value of the whole pack is that it's *true*, not plausible.
- **Judge against the stated goal**, and carry that goal consistently through all four artifacts.
