# Backend & Realtime Architecture — Node.js + Express

## 1. Purpose

The backend owns application rules that should not live in the browser: RBAC checks, path generation, AI gateway calls, RAG retrieval, cost tracking, audit writes, and realtime notifications.

## 2. Backend Structure

```text
backend/
  api/
    routes/
    controllers/
    validators/
  services/
    auth/
    path-engine/
    learning/
    content-studio/
    tutor/
    ai-gateway/
    analytics/
    audit/
    realtime/
  models/
    dto/
    domain/
  middleware/
    requireAuth.js
    requireRole.js
    errorHandler.js
    requestLogger.js
  utils/
    logger.js
    env.js
  tests/
```

## 3. Request Flow

```mermaid
flowchart LR
  Client --> Express
  Express --> AuthMiddleware["Auth + Role Middleware"]
  AuthMiddleware --> Validator
  Validator --> Controller
  Controller --> Service
  Service --> Supabase
  Service --> Audit
  Service --> Realtime
```

## 4. Realtime Strategy

| Need | Technology | Reason |
|---|---|---|
| Tutor token streaming | SSE | Simple one-way stream, matches NFR token-first UX |
| Job/escalation notifications | Socket.IO | Bidirectional, room-based by role/class/user |
| Supabase DB change fan-out | Backend listener later | Keeps RLS and payload shaping centralized |

Socket rooms:

- `user:{userId}` for personal notifications.
- `teacher:{teacherId}` for escalations and job status.
- `class:{classId}` for class dashboard updates.
- `admin:{orgId}` for cost and audit events.

## 5. Services

| Service | Responsibility |
|---|---|
| `auth` | Verify Supabase JWT, load profile, enforce role |
| `path-engine` | Rule-based Skill Node unlock and next recommendation |
| `learning` | Attempts, progress, score events, EXP events |
| `content-studio` | Source upload, job lifecycle, draft, review, publish |
| `tutor` | Session, retrieval, streaming answer, refusal, escalation |
| `ai-gateway` | Provider routing, cache, cost, circuit breaker |
| `analytics` | Heatmap, risk score, production report |
| `audit` | Append-only action records |
| `realtime` | Socket.IO room events and SSE helpers |

## 6. Error Handling

All API errors return:

```json
{
  "error": {
    "code": "LESSON_NOT_PUBLISHED",
    "message": "This lesson is not available yet.",
    "requestId": "req_..."
  }
}
```

Do not leak provider errors, prompts, service keys, or stack traces to the client.

## 7. Logging

Log these events:

- auth failures;
- AI requests and provider failures;
- RAG retrieval source counts;
- content job transitions;
- publish actions;
- cost circuit breaker changes;
- tutor escalations;
- unexpected errors.

## 8. Backend Must Enforce

- Student APIs never return DRAFT/IN_REVIEW lessons.
- Teacher publish writes `reviewed_by`, `published_at`, and `audit_log`.
- Tutor retrieval is scoped to current Skill Node and approved source material.
- Cost limits are checked before AI calls.
- Parent APIs never return raw tutor messages.

## 9. Slice 1 Implementation Status

Implemented:

- Express app, request IDs, stable error envelope, health endpoint, and CORS allowlist.
- Supabase server client isolated under `backend/services`.
- Student dashboard aggregation service.
- Pure rule-based path engine with unit tests.
- Socket.IO server and client connection-ready event.
- Idempotent demo seed for the existing Supabase schema.

Pending before public deployment:

- Supabase JWT verification and `requireRole` middleware;
- removal of first-student demo fallback;
- production structured logger and rate limiting;
- authenticated Socket.IO rooms.
