# Sample Recon Pack — "Recapp"

> **This is example output.** It's a *fictional* recon pack for an invented SaaS called **Recapp** (an AI meeting-notes summarizer) — produced exactly the way the [Codebase Recon Kit](../../README.md) skills produce it, so you can see the shape and quality before running it on your own repo. Recapp isn't real; the `file:line` citations point at an imaginary tree. On a real run, every citation is genuine.

**Recapp, in one line:** upload a meeting transcript → an async worker summarizes it into action items with an LLM → a React app shows the results. Multi-tenant. **Stated goal: enterprise-grade, multi-tenant SaaS.** (That goal is what the audit judges severity against.)

## What's in this pack

| Artifact | What it is | Skill |
|----------|-----------|-------|
| [`audit/`](audit/) | Executive summary + findings register — the adversarial review | `audit-codebase` |
| [`docs/md/`](docs/md/) | Documentation chapters with Mermaid diagrams (build to HTML with `build-html.mjs`) | `document-codebase` |
| [`BACKLOG.md`](BACKLOG.md) | The findings turned into executable, cited tickets | `create-backlog` |
| [`STATUS.md`](STATUS.md) | The master status table tracking those tickets | `create-status-tracker` |

## How to read it
1. Start with [`audit/README.md`](audit/README.md) — the verdict, severity dashboard, and the Critical findings.
2. Skim [`docs/md/02-architecture.md`](docs/md/02-architecture.md) and [`03-request-flows.md`](docs/md/03-request-flows.md) to see the system + the diagrams.
3. See how findings become work in [`BACKLOG.md`](BACKLOG.md), tracked in [`STATUS.md`](STATUS.md).

## Building the docs site from this pack
```bash
cp ../../skills/document-codebase/assets/build-html.mjs docs/
cd docs && npm i marked && RECON_BRAND="RECAPP" node build-html.mjs
open html/index.html    # sidebar + dark theme + rendered Mermaid diagrams
```

> On GitHub the Markdown renders directly (diagrams show as code); build the HTML to get the navigable site with live diagrams.
