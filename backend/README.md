# Backend Module

## Purpose

Node.js + Express backend for application rules, realtime events, AI orchestration, audit, and Supabase service access.

## Inputs

- Supabase JWT from frontend.
- Student attempts and Tutor messages.
- Teacher content uploads and review decisions.
- Admin configuration changes.

## Outputs

- REST API responses.
- SSE Tutor streams.
- Socket.IO events.
- Audit log records.
- AI usage records.

## Dependencies

- Express.js
- Socket.IO
- Supabase server client
- AI provider SDKs behind AI Gateway
- Validation and logging utilities

## Implemented Slice 1

| Endpoint | Data source | Behavior |
|---|---|---|
| `GET /api/health` | process | API and realtime readiness |
| `GET /api/auth/me` | Supabase Auth + `profiles` | verified account, role, grade, and learning-access state |
| `POST /api/auth/bootstrap` | Supabase Auth + profiles | create the selected student/teacher profile after email/OAuth authentication |
| `GET /api/student/dashboard` | Supabase | profile, STEAM, EXP, streak, badges, activity, next quest |
| `GET /api/student/path` | Supabase + path engine | completed/current/locked nodes and explainable reasons |
| `GET /api/student/lessons/:skillNodeId` | `PUBLISHED` lessons/questions | checkpoint lesson with answer keys removed |
| `POST /api/student/attempts` | questions, attempts, score/EXP events | server grading, feedback, first-correct rewards |
| `POST /api/tutor/sessions` | Tutor sessions + published lesson | create/resume a scoped Tutor session |
| `POST /api/tutor/sessions/:id/messages/stream` | moderation + grounded retrieval + Responses API | SSE token/citation/refusal/done events |
| `POST /api/tutor/messages/:id/escalate` | Tutor escalation | send one unresolved question to the assigned teacher |
| `GET /api/teacher/escalations` | Tutor escalation queue | teacher-scoped view without exposing unrelated chat history |
| `GET/POST /api/teacher/classes` | classes + subjects | list/create teacher-owned classes |
| `GET /api/teacher/classes/:id/members` | memberships + profiles | roster and pending requests for an owned class |
| `POST /api/teacher/classes/:id/invite` | memberships | invite a same-org, same-grade student |
| `POST /api/student/classes/join` | memberships | request membership using a join code |
| `POST /api/student/memberships/:id/respond` | memberships | accept or decline a teacher invitation |

The path engine is deterministic and has no LLM dependency. A Skill Node is available only when its prerequisites, STEAM thresholds, and `PUBLISHED` lesson requirement are all satisfied.

## Commands

```bash
npm install
npm run seed:demo
npm run seed:subjects
npm run seed:tutor
npm run reset:demo
npm test
npm start
```

`npm run seed:demo` is idempotent. It creates two demo Auth users, one Scratch course with seven Skill Nodes, approved lessons, attempts, XP activity, streak, and badges.

`npm run seed:subjects` idempotently loads the 28-row GDPT 2018 STEAM subject catalog required by class creation after migration `0003`.

`npm run reset:demo` removes only the demo student's attempts and rewards for the seeded Loops quiz, then restores the scripted STEAM/XP/streak baseline. It does not affect other users or questions.

`npm run seed:tutor` creates OpenAI embeddings for approved knowledge chunks in the configured demo organization that do not have a vector yet. It is idempotent, but it is an external transfer of approved lesson excerpts and must be explicitly authorized by the organization.

The default `AI_ALLOW_APPROVED_CONTENT_EXPORT=false` gate prevents embedding and grounded generation from sending either student questions or approved excerpts to OpenAI. Set it to `true` only in an authorized backend environment.

Tutor safeguards:

- retrieves chunks only through `PUBLISHED` lessons attached to the current Skill Node;
- applies a deterministic lexical scope gate before embedding or generation;
- sends no student name, email, STEAM score, or account metadata to the model;
- records moderation, retrieval, generation, and cache calls in `ai_usage`;
- buffers model output for moderation, then emits safe SSE chunks with verified citations;
- refuses unsupported questions and offers one-click teacher escalation.

Quiz rules:

- the browser sends only `questionId`, `answerIndex`, hint usage, and duration;
- `answer_key` stays server-side;
- wrong answers never remove XP;
- only the first correct attempt creates STEAM and EXP events;
- using hints changes the XP reward from 80 to 50 but does not erase mastery evidence.

Every protected REST request must carry `Authorization: Bearer <supabase_access_token>`. The backend validates that token with Supabase Auth, loads the matching `profiles` row, verifies role and account status, and derives the student ID from that verified identity. Socket.IO performs the same validation during its handshake. There is no first-student or `x-demo-student-id` fallback.

Public registration can choose `student` or `teacher`. This intentionally overrides Functional Spec `F-103`: selected teachers become `ACTIVE` immediately; Admin remains provisioned separately. Students under 16 are stored as `PENDING` in trusted Auth app metadata and cannot call learning APIs or connect realtime until `guardian_consent_at` activates them.

Classroom boundaries are server-owned: a teacher can read/mutate only classes where `teacher_id` matches the JWT profile; invitations and join requests require the same organization and grade band; subject IDs must belong to that organization and class grade. `class.membership.updated` is emitted to `teacher:{teacherId}` and `user:{studentId}` after every state change.

## Limitations

- Backend must never bypass published-only content rules for student APIs.
- Backend service role key is local/deployment secret only.
- Backend should keep prompts outside code.
- Before pilot, attempt + score event + EXP projection writes should move into one Postgres RPC transaction.
- AI budget updates should move into a transactional Postgres RPC to avoid concurrent spend races.
- Guardian verification delivery and the parent consent action are still pending; the current account gate is deliberately fail-closed.
- Before a real school pilot, teacher self-registration needs organization/domain verification, invite rate limits, and audit records.
