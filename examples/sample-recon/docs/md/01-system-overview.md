# 01 · System Overview

**In one paragraph.** Recapp is a multi-tenant SaaS that turns raw meeting transcripts into structured summaries and action items. A user uploads a transcript from the web app; the file lands in object storage; an event kicks off an asynchronous worker that calls an LLM to produce a summary; the result is stored and shown back in the app. The design is deliberately **asynchronous** because summarization takes far longer than an HTTP request should — so the API just *accepts* the job and the heavy work happens off the request path.

## Who uses it
| Role | Does what |
|------|-----------|
| **Member** | Uploads transcripts, reads summaries for their own team |
| **Admin** | Everything a member does, plus manages team + billing |
| **Service (webhook)** | External meeting tools push transcripts in via an ingest webhook |

## What it does (capabilities)
- **Ingest** a transcript (web upload or webhook) into per-tenant object storage.
- **Summarize** it asynchronously with an LLM into `{ summary, actionItems[], decisions[] }`.
- **Serve** the results to the web app with live status (`queued → processing → complete/failed`).

## The 30,000-ft view
- **Frontend** — a React SPA; talks to the API with a JWT.
- **API** — stateless serverless handlers; authenticate the caller, validate, and *enqueue* work. They never call the LLM (too slow).
- **Worker** — an event-triggered function that does the summarization and writes results.
- **Storage** — a single-table document store for metadata + object storage for transcripts/results.
- **LLM** — an external model provider, called only from the worker.

> **Why async matters:** the API returns `202 Accepted` with a job id in milliseconds; the worker may take 10–60s. The frontend polls the job's status. Everything downstream (idempotency, at-least-once delivery, failure handling) follows from this choice — see [03 · Request & Event Flows](03-request-flows.md).

## The one thing to internalize
There are **two code paths**: a local Express server (for dev) and the deployed serverless path (production). They're *supposed* to behave identically via a shared core, but they can drift — and the drift is where bugs hide (the audit found the deployed path under-guarded). When reading the code, always ask *"which path is this, and does the other one match?"*
