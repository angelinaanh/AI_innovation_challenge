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

The path engine is deterministic and has no LLM dependency. A Skill Node is available only when its prerequisites, STEAM thresholds, and `PUBLISHED` lesson requirement are all satisfied.

## Commands

```bash
npm install
npm run seed:demo
npm test
npm start
```

`npm run seed:demo` is idempotent. It creates two demo Auth users, one Scratch course with seven Skill Nodes, approved lessons, attempts, XP activity, streak, and badges.

During Slice 1 demo mode, the API uses `DEMO_STUDENT_ID` when configured or resolves the first student profile. This fallback must be removed or disabled when Supabase JWT middleware is introduced.

## Limitations

- Backend must never bypass published-only content rules for student APIs.
- Backend service role key is local/deployment secret only.
- Backend should keep prompts outside code.
- Service-role demo endpoints must not be exposed publicly before authentication and RBAC middleware are enabled.
