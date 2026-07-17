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

## Limitations

- Backend must never bypass published-only content rules for student APIs.
- Backend service role key is local/deployment secret only.
- Backend should keep prompts outside code.

