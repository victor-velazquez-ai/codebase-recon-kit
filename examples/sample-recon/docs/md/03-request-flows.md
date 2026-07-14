# 03 · Request & Event Flows

**In one paragraph.** The defining flow is asynchronous: uploading a transcript and getting a summary are two *different* interactions separated by a durable event. The API accepts the upload and returns immediately; a worker produces the summary later; the app polls for it. Understanding this one flow explains most of the system.

## Flow A — upload → summarize → view (happy path)

```mermaid
sequenceDiagram
  actor U as User (member)
  participant W as React SPA
  participant A as API
  participant S as Object store
  participant Q as Event bus
  participant K as Worker
  participant L as LLM
  participant D as Document store

  U->>W: choose transcript
  W->>A: POST /meetings (metadata)
  A->>A: authN (JWT) + authZ (role)
  A->>D: create job {status: queued}
  A-->>W: 202 {jobId, uploadUrl}
  W->>S: PUT transcript (presigned)
  S-->>Q: transcript.uploaded
  Q->>K: deliver (at-least-once)
  K->>D: status = processing
  K->>S: read transcript
  K->>L: summarize(wrapped transcript)
  L-->>K: {summary, actionItems}
  K->>D: status = complete + summary
  loop poll
    W->>A: GET /meetings/{jobId}
    A-->>W: {status, summary?}
  end
```

**Read it as:** the `POST` is cheap and synchronous (it just books the job); the summary appears later, delivered by the worker via the bus; the UI discovers it by polling. The `202` is the contract — "accepted, not done".

## Flow B — failure path (what *should* happen)

```mermaid
sequenceDiagram
  participant K as Worker
  participant L as LLM
  participant D as Document store
  participant Q as Event bus

  K->>L: summarize(...)
  L--xK: error / timeout
  K->>D: status = failed + reason
  K-->>Q: transcript.failed (optional)
  Note over K,D: NEVER mark complete with an empty summary
```

> **⚠️ Gotcha (this is `BE-1`):** the real worker `catch`es the LLM error and marks the job **complete** with a blank summary — so the scheduler sees success and the user sees nothing. The correct behavior is above: mark **failed**, record the reason, surface it. "Reported success without doing the work" is the highest-value class of bug an audit finds.

## Flow C — webhook ingest (the tenant-trust trap)

```mermaid
sequenceDiagram
  participant X as External tool
  participant A as Ingest webhook
  participant D as Document store

  X->>A: POST /webhooks/ingest (+ x-tenant-id header)
  A->>A: verify signature
  A->>D: write under header's tenantId  ❌
  Note over A,D: SEC-2 — tenant must come from the verified<br/>identity, never a caller-supplied header
```

**Why it matters:** trusting `x-tenant-id` lets any signed caller write into *another* tenant's partition. Tenant must always be derived from a verified credential, never from request-controlled input.
