# Codebase Recon Kit

**Walk into any codebase like a senior engineer.** Five [Claude Code](https://claude.com/claude-code) skills that take an unfamiliar repo and produce a complete engineering intake pack — an adversarial audit, a polished HTML documentation site, an implementation-ready backlog, and a live status tracker — with **every artifact written to a local, git-ignored folder** so nothing pollutes the target repo.

Built from a real, battle-tested workflow used to audit and document a ~86k-LOC production platform. The skills encode the *method*, not the project — point them at anything.

---

## The five skills

| Skill | What it does | Output |
|-------|--------------|--------|
| **`audit-codebase`** | Independent, adversarial senior-engineer **and** senior-AI-engineer audit. Traces the *deployed* path, finds real correctness/security/cost/architecture defects, judges severity against the project's *stated goal* (not "does it run"). Findings register + severity dashboard + P0/P1/P2 roadmap. | `recon/audit/` |
| **`document-codebase`** | Professional, deeply-explained docs — junior-friendly yet intimate. Numbered Markdown chapters with Mermaid diagrams (architecture, flows, data model, state machines), rendered to a self-contained HTML site with a sidebar and dark theme. | `recon/docs/` |
| **`create-backlog`** | Turns findings/features into **executable** tickets: stable IDs, cited current-state, concrete implementation plan, checkable success-criteria, dependency graph, build waves. One ticket = one PR. | `recon/BACKLOG.md` |
| **`create-status-tracker`** | The single source of truth for ticket/project state — master table (status/pri/effort/owner/PR/note), at-a-glance, blockers, append-only change log. | `recon/STATUS.md` |
| **`recon-new-project`** | **The orchestrator.** Runs the four above *in order* (audit → docs → backlog → tracker) for a new repo, all into one git-ignored folder. Your one-command onboarding. | `recon/` |

### How they fit

```
                 ┌─────────────────────────────────────────────┐
   new repo ──▶  │  recon-new-project  (orchestrator)          │
                 └─────────────────────────────────────────────┘
                        │        │          │           │
                        ▼        ▼          ▼           ▼
                   audit ──▶ document ──▶ backlog ──▶ status-tracker
                (deep read)  (explain)   (plan it)    (track it)
                        │
                        └── one deep read of the system, four lenses on it
```

The audit is the deep read that finds the truth; the docs explain what you now understand; the backlog turns findings into work; the tracker keeps that work honest. Each skill also stands alone — run just the one you need.

---

## Install

### Option A — as a plugin (recommended, one command)
```
/plugin marketplace add victor-velazquez-ai/codebase-recon-kit
/plugin install codebase-recon-kit@victor-velazquez-plugins
```
The five skills load **namespaced**, e.g. `/codebase-recon-kit:recon-new-project`, `/codebase-recon-kit:audit-codebase`. Verify with `/plugin list`. Everything else — commands, updates — flows through the plugin manager.

### Option B — copy the skills manually
```bash
git clone https://github.com/victor-velazquez-ai/codebase-recon-kit.git
# personal (available in every repo):
cp -r codebase-recon-kit/skills/* ~/.claude/skills/
# or per-project (checked into a repo):
cp -r codebase-recon-kit/skills/* /path/to/your/repo/.claude/skills/
```

Either way, the skills are discovered by their `description` triggers — just ask in natural language.

## See it in action

[**`examples/sample-recon/`**](examples/sample-recon/) is a complete sample output pack for a fictional AI SaaS ("Recapp") — an [audit](examples/sample-recon/audit/README.md) (verdict, severity dashboard, findings register), [docs with Mermaid diagrams](examples/sample-recon/docs/md/02-architecture.md), a [backlog](examples/sample-recon/BACKLOG.md), and a [status tracker](examples/sample-recon/STATUS.md). It's exactly what the skills produce — read it to see the shape and quality before running it on your own repo.

---

## Use

Just ask, in natural language — the skill descriptions route the request:

- *"Recon this repo"* / *"onboard me to this codebase"* → runs the full pipeline (`recon-new-project`).
- *"Audit this codebase — is it production-ready?"* → `audit-codebase`.
- *"Document how this system works, with diagrams"* → `document-codebase`.
- *"Turn the audit into a backlog of tickets"* → `create-backlog`.
- *"Give me a status tracker for the epic"* → `create-status-tracker`.

Or invoke a skill explicitly by name if your client supports it.

### Output layout (always git-ignored)

```
recon/
  audit/                    ← executive summary, findings register, per-domain reports
  docs/
    md/                     ← numbered chapters
    html/                   ← generated site — open index.html
    build-html.mjs
  BACKLOG.md
  STATUS.md
  README.md                 ← index of the whole pack
```

The kit writes everything under `recon/` and adds it to `.git/info/exclude` (a **local** ignore that never modifies the target repo's tracked `.gitignore`). Promote anything to the tracked tree only if you choose to.

### Building the docs site

```bash
cd recon/docs
npm i marked                                   # one-time: Markdown → HTML at build time
RECON_BRAND="ACME" RECON_TAG="Engineering Portal" node build-html.mjs
open html/index.html
```

Diagrams render via Mermaid (vendored `html/assets/mermaid.min.js` if present, else a pinned CDN). The builder is **zero-config**: it auto-discovers chapters, derives titles from each file's `# H1`, rewrites `.md` links to `.html`, and builds the sidebar.

---

## Design principles

- **Cite reality, not intent.** Every claim is anchored to `path:line`. The pack's value is that it's *true*.
- **Judge against the stated goal.** "Enterprise" and "multi-tenant SaaS" set the severity bar — a thing that's fine for a demo can be Critical for a product.
- **"Looks done" ≠ done.** The highest-value finds are handlers that return `200` while doing nothing and green tests that only cover the easy path.
- **Junior-friendly *and* senior-deep.** Explain the "why" for newcomers; go deep enough that an owner learns something.
- **Local by default.** Nothing lands in the target repo's tracked tree unless you promote it.

---

## License

MIT — see [LICENSE](LICENSE). Use it, fork it, make it yours.
