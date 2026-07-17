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
| `GET /api/student/dashboard` | Supabase | profile, STEAM, EXP, streak, badges, activity, next quest |
| `GET /api/student/path` | Supabase + path engine | completed/current/locked nodes and explainable reasons |
| `GET /api/student/lessons/:skillNodeId` | `PUBLISHED` lessons/questions | checkpoint lesson with answer keys removed |
| `POST /api/student/attempts` | questions, attempts, score/EXP events | server grading, feedback, first-correct rewards |
| `POST /api/tutor/sessions` | Tutor sessions + published lesson | create/resume a scoped Tutor session |
| `POST /api/tutor/sessions/:id/messages/stream` | moderation + grounded retrieval + Responses API | SSE token/citation/refusal/done events |
| `POST /api/tutor/messages/:id/escalate` | Tutor escalation | send one unresolved question to the assigned teacher |
| `GET /api/teacher/escalations` | Tutor escalation queue | demo teacher view without exposing unrelated chat history |

The path engine is deterministic and has no LLM dependency. A Skill Node is available only when its prerequisites, STEAM thresholds, and `PUBLISHED` lesson requirement are all satisfied.

## Commands

```bash
npm install
npm run seed:demo
npm run seed:tutor
npm run reset:demo
npm test
npm start
```

`npm run seed:demo` is idempotent. It creates two demo Auth users, one Scratch course with seven Skill Nodes, approved lessons, attempts, XP activity, streak, and badges.

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

During Slice 1 demo mode, the API uses `DEMO_STUDENT_ID` when configured or resolves the first student profile. This fallback must be removed or disabled when Supabase JWT middleware is introduced.

## Limitations

- Backend must never bypass published-only content rules for student APIs.
- Backend service role key is local/deployment secret only.
- Backend should keep prompts outside code.
- Service-role demo endpoints must not be exposed publicly before authentication and RBAC middleware are enabled.
- Before pilot, attempt + score event + EXP projection writes should move into one Postgres RPC transaction.
- AI budget updates should move into a transactional Postgres RPC to avoid concurrent spend races.
- Demo teacher/student headers and Socket.IO room claims must be replaced by verified Supabase JWT roles.
