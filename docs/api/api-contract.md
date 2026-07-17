# API Contract

Base URL for local development:

```text
http://localhost:4000/api
```

All authenticated requests include a Supabase JWT:

```http
Authorization: Bearer <supabase_access_token>
```

Slice 1 currently runs in explicit demo mode while authentication UI is pending. The student endpoints accept an optional `x-demo-student-id` header, otherwise the backend uses `DEMO_STUDENT_ID` or the first student profile. This fallback is for local judging/demo only and must be replaced by the verified JWT user before public deployment.

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
| GET | `/me` | all | Current profile, role, org, consent state |
| PATCH | `/me` | all | Update own profile fields |
| POST | `/guardian-consent` | student/parent | Record guardian consent |

Supabase Auth handles email/password and OAuth. Backend enriches with `profiles`.

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

| Event | Room | Payload |
|---|---|---|
| `contentJob.updated` | `teacher:{teacherId}` | `{ jobId, status, progress }` |
| `tutor.escalated` | `teacher:{teacherId}` | `{ escalationId, studentId, skillNodeId }` |
| `tutor.answered` | `user:{studentId}` | `{ escalationId, answerPreview }` |
| `riskQueue.updated` | `class:{classId}` | `{ count, highestRisk }` |
| `costCircuit.tripped` | `admin:{orgId}` | `{ date, spentUsd, budgetUsd }` |

SSE events for Tutor:

- `token`
- `citation`
- `refusal`
- `done`
- `error`
