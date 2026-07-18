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
| POST | `/auth/bootstrap` | authenticated user without profile | Create selected student/teacher profile; initialize student projections |
| PATCH | `/me` | all | Planned: update allowed own profile fields |
| POST | `/guardian-consent` | student/parent | Planned: verify and record guardian consent |

Supabase Auth handles email/password, email confirmation, Google OAuth, refresh, sign-out, and password recovery. The selected onboarding role may be `student` or `teacher`; teacher self-registration becomes `ACTIVE` immediately by an explicit product decision that differs from Functional Spec `F-103`. Account status remains service-written app metadata, and Admin is never available through public bootstrap.

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
| `class.membership.updated` | `teacher:{teacherId}`, `user:{studentId}` | `{ teacherId, studentId, classId, status }` |
| `costCircuit.tripped` | `admin:{orgId}` | `{ date, spentUsd, budgetUsd }` |

SSE events for Tutor:

- `token`: `{ "delta": "..." }`
- `citation`: `{ "sourceChunkId", "checkpointId", "title", "lessonId" }`
- `refusal`: `{ "content", "mode", "studentMessageId", "escalationRecommended" }`
- `done`: `{ "messageId", "studentMessageId", "mode", "confidence", "cached" }`
- `error`: safe code/message/request ID with no provider detail

## 8. Tutor Interactive Exercises

All under the authenticated student Tutor scope. Answer keys never leave the server.

| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | `/tutor/exercises` | student | Generate one grounded practice exercise for a session `{ sessionId, type }` |
| POST | `/tutor/exercises/:exerciseId/submit` | student | Grade a response, award effort EXP, return solution `{ response }` |
| POST | `/tutor/exercises/:exerciseId/promote` | student | Send a correct item to the teacher review queue |
| GET | `/teacher/exercise-proposals` | teacher | List promoted practice items awaiting review |
| POST | `/teacher/exercise-proposals/:exerciseId/review` | teacher | `{ decision: "approve" | "reject" }`; approving an MCQ seeds a `DRAFT` question |

`type` is one of `mcq | matching | ordering | cloze`. The generate response returns the render payload only (no answer key):

```json
POST /tutor/exercises  { "sessionId": "uuid", "type": "matching" }
-> { "id": "uuid", "type": "matching", "prompt": "...",
     "left": [{ "id": "l1", "label": "move" }],
     "right": [{ "id": "r2", "label": "di chuyển" }], "formative": true }
```

Response shapes for submit (`response` field): mcq `{ selectedIndex }`, matching `{ pairs: { leftId: rightId } }`, ordering `{ order: [id,...] }`, cloze `{ answers: { blankId: value } }`. Submit returns `{ isCorrect, score, solution, explanation, award, canPromote }`. These exercises are formative: they write `tutor_exercises` / `tutor_exercise_attempts` and `exp_events`, never `score_events`.

## 9. Classes & subjects

Authenticated; role-gated by the mount (`/teacher` = teacher, `/student` = student).

Subjects catalog (STEAM classification, GDPT 2018), available to both roles:

| Method | Path | Purpose |
|---|---|---|
| GET | `/student/subjects` · `/teacher/subjects` | List subjects; optional `?gradeBand=primary|secondary|high_school` |

Teacher:

| Method | Path | Purpose |
|---|---|---|
| POST | `/teacher/classes` | Create `{ name, gradeBand, subjectId?, description? }` (auto join code, max description 500) |
| GET | `/teacher/classes` | List own classes with subject metadata and member/pending counts |
| GET | `/teacher/classes/:classId/members` | Class/subject metadata, active roster, invited/requested rows |
| POST | `/teacher/classes/:classId/invite` | Invite a student `{ studentEmail }` |
| POST | `/teacher/memberships/:membershipId/decision` | Approve/reject a join request `{ decision: "approve"|"reject" }` |

Student:

| Method | Path | Purpose |
|---|---|---|
| GET | `/student/classes` | My active classes |
| GET | `/student/invitations` | Pending invitations from teachers |
| POST | `/student/classes/join` | Request to join by code `{ joinCode }` |
| POST | `/student/memberships/:membershipId/respond` | Accept/decline an invitation `{ response: "accept"|"decline" }` |

Membership states: `invited` (teacher invited) / `requested` (student asked) → `active` (accepted/approved) / `rejected`. An invite and a request for the same class/student converge to `active`.

Server invariants: the class owner must match the teacher JWT; class/subject/actor must share `org_id`; the subject and student must match `grade_band`. Relevant errors are `SUBJECT_INVALID` (400) and `GRADE_BAND_MISMATCH` (409).
