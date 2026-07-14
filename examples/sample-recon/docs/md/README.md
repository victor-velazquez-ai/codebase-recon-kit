# Recapp — Engineering Documentation (sample)

> Example documentation home, produced by the `document-codebase` skill. Fictional system; the shape and depth are the point.

**Recapp** turns meeting transcripts into action items with an LLM. This set explains how it actually works — grounded in the code, junior-friendly, senior-deep.

## How to read
Start at **01 · System Overview** for the big picture, then **02 · Architecture** for the components and **03 · Request & Event Flows** for how an upload becomes a summary. **04 · Data Model** covers storage.

## Chapters
- [01 · System Overview](01-system-overview.md) — what it does, who uses it, the 30,000-ft view
- [02 · Architecture](02-architecture.md) — components, boundaries, the async pattern (diagram)
- [03 · Request & Event Flows](03-request-flows.md) — upload → summarize → view (sequence diagrams)
- [04 · Data Model](04-data-model.md) — entities, keys, storage (ER diagram)

*(A real pack also includes domain rules, backend/frontend catalogs, infra, security, and a local-dev reference — trimmed here to keep the sample readable.)*

## Build the site
```bash
cp ../../../skills/document-codebase/assets/build-html.mjs .. && cd .. && npm i marked && RECON_BRAND="RECAPP" node build-html.mjs
```
