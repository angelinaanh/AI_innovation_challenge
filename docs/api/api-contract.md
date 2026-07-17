# API Contract

Base URL for local development:

```text
http://localhost:4000/api
```

All authenticated requests include a Supabase JWT:

```http
Authorization: Bearer <supabase_access_token>
```

`GET /api/health` is public. All other implemented application endpoints derive identity from the verified JWT; client-supplied user IDs and demo identity headers are ignored/not supported.

## 1. Error Shape

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human friendly message",
    "requestId": "req_123"
  }
}
```

## 2. Auth & Profile

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/auth/me` | authenticated profile | Current account, role, grade, status, learning access |
| POST | `/auth/bootstrap` | authenticated user without profile | Create student profile and zero-value projections |
| PATCH | `/me` | all | Planned: update allowed own profile fields |
| POST | `/guardian-consent` | student/parent | Planned: verify and record guardian consent |

Supabase Auth handles email/password, email confirmation, Google OAuth, refresh, sign-out, and password recovery. The browser never sends role or account status as trusted data. The backend hardcodes self-registration to `student`, stores status/date-of-birth/guardian email in service-written Auth app metadata, and enriches the session with `profiles`.

Relevant auth errors include `AUTH_REQUIRED` (401), `AUTH_INVALID` (401), `AUTH_FORBIDDEN` (403), `PROFILE_ONBOARDING_REQUIRED` (409), `GUARDIAN_CONSENT_REQUIRED` (403), and `ACCOUNT_INACTIVE` (403).

## 3. Student Learning

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/student/dashboard` | student | Radar, XP, streak, badges, next quest |
| GET | `/student/path` | student | Skill Node map with lock reasons |
| GET | `/student/lessons/:skillNodeId` | student | Published lesson for current level |
| POST | `/student/attempts` | student | Submit quiz attempt |
| POST | `/student/tasks` | student | Submit practical project/task |
| GET | `/student/profile/history` | student | Score and EXP event history |

Important: `/student/lessons/:skillNodeId` must only return `PUBLISHED` content.

Implemented response highlights:

- `/student/dashboard` returns `student`, `steamProfile`, `gamification`, `badges`, `weekActivity`, `pathProgress`, `recommendation`, and `pathPreview`.
- `/student/path` returns normalized `scores`, all `nodes`, `recommendation`, `completedCount`, and `totalCount`.
- Every non-completed node includes either `unlockReason` or `lockedReason`; locked responses include numeric `deficits` by STEAM axis.

### Lesson response

`GET /student/lessons/:skillNodeId` verifies that the node is completed/current/available and that the lesson and questions are `PUBLISHED`. It returns:

- `skillNode` metadata and current `pathStatus`;
- approved lesson content, checkpoints, objectives, and layered hints;
- published questions with `id`, `body`, `options`, difficulty, and STEAM weights;
- no `answer_key` field.

### Attempt request

```json
{
  "questionId": "uuid",
  "answerIndex": 1,
  "usedHint": true,
  "durationMs": 64000
}
```

`POST /student/attempts` grades on the server and returns `isCorrect`, constructive `feedback`, retry state, optional first-correct `award`, and optional recalculated `pathUpdate`. Wrong answers never lose XP. A correct answer is rewarded once per student/question.

## 4. AI Tutor

| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | `/tutor/sessions` | student | Create or resume Tutor session |
| POST | `/tutor/sessions/:sessionId/messages/stream` | student | SSE grounded answer stream |
| POST | `/tutor/messages/:messageId/escalate` | student | Send out-of-scope question to teacher |
| GET | `/teacher/escalations` | teacher | Pending escalations |
| POST | `/teacher/escalations/:id/answer` | teacher | Answer escalation |
| POST | `/teacher/escalations/:id/ingest` | teacher | Approve Q&A into knowledge base |

Implemented Slice 3 requests:

```json
POST /tutor/sessions
{ "skillNodeId": "uuid" }

POST /tutor/sessions/:sessionId/messages/stream
{ "message": "Repeat khác forever thế nào?" }
```

The session response includes the scoped Skill Node, approved-content trust metadata, and persisted messages. The stream endpoint accepts 2-600 characters and returns `text/event-stream`. It never returns prompts, answer keys, provider errors, profile metadata, or unapproved source content.

`POST /tutor/messages/:messageId/escalate` accepts only a student-role message owned by the current session user. `GET /teacher/escalations` returns only the escalated question, student display identity, Skill Node, and queue state, not the full Tutor conversation.

Tutor response metadata:

```json
{
  "answer": "Try thinking about the loop condition first...",
  "citations": [
    {
      "checkpointId": "checkpoint_loops_2",
      "title": "Repeat blocks",
      "sourceChunkId": "uuid"
    }
  ],
  "mode": "socratic",
  "confidence": 0.84
}
```

## 5. Teacher Studio

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/teacher/dashboard` | teacher | Heatmap and risk queue |
| POST | `/teacher/content-jobs` | teacher | Upload source and start generation |
| GET | `/teacher/content-jobs` | teacher | List jobs |
| GET | `/teacher/content-jobs/:id` | teacher | Job detail and generated draft |
| PATCH | `/teacher/lessons/:id` | teacher | Save edits |
| POST | `/teacher/lessons/:id/review` | teacher | Move to `IN_REVIEW` |
| POST | `/teacher/lessons/:id/publish` | teacher | Publish and write audit log |
| POST | `/teacher/lessons/:id/archive` | teacher | Archive draft or old version |

## 6. Admin

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/admin/users` | admin | Manage users |
| PATCH | `/admin/users/:id/role` | admin | Change role |
| GET | `/admin/skill-nodes` | admin | Skill graph |
| POST | `/admin/skill-nodes` | admin | Create Skill Node |
| PATCH | `/admin/skill-nodes/:id` | admin | Update thresholds/prerequisites |
| GET | `/admin/ai-usage` | admin | Cost dashboard |
| PATCH | `/admin/cost-budget` | admin | Set daily budget |
| GET | `/admin/audit-log` | admin | Read audit log |

## 7. Realtime Events

Socket.IO events:

The handshake requires `auth.accessToken`. Rooms are derived only from the verified profile, and `PENDING`, `SUSPENDED`, or `EXPIRED` accounts are rejected before connection.

| Event | Room | Payload |
|---|---|---|
| `contentJob.updated` | `teacher:{teacherId}` | `{ jobId, status, progress }` |
| `tutor.escalated` | `teacher:{teacherId}` | `{ escalationId, studentId, skillNodeId }` |
| `tutor.answered` | `user:{studentId}` | `{ escalationId, answerPreview }` |
| `riskQueue.updated` | `class:{classId}` | `{ count, highestRisk }` |
| `costCircuit.tripped` | `admin:{orgId}` | `{ date, spentUsd, budgetUsd }` |

SSE events for Tutor:

- `token`: `{ "delta": "..." }`
- `citation`: `{ "sourceChunkId", "checkpointId", "title", "lessonId" }`
- `refusal`: `{ "content", "mode", "studentMessageId", "escalationRecommended" }`
- `done`: `{ "messageId", "studentMessageId", "mode", "confidence", "cached" }`
- `error`: safe code/message/request ID with no provider detail
