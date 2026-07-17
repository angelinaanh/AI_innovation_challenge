# Supabase Integration

## 1. Current Project

Frontend public env:

```bash
VITE_SUPABASE_URL=https://wpxddpyuabztdstszgwk.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_FViOIxMjuN6Eu91INSN5zA_oLkjMTcI
```

Backend env:

```bash
SUPABASE_URL=https://wpxddpyuabztdstszgwk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=local_only
```

The publishable key can be used by the browser. Service role keys must never be committed.

The current frontend reads application data through Express, so the publishable key is reserved for the upcoming Supabase Auth flow. The service secret stays in `backend/.env` only.

## 2. Supabase Responsibilities

| Capability | Supabase Feature |
|---|---|
| Identity | Supabase Auth |
| User profile and role | `profiles` table |
| Relational app state | Postgres |
| Vector retrieval | `document_chunks.embedding` with pgvector |
| Source files and submissions | Supabase Storage |
| Row-level safety | RLS policies |
| Optional live changes | Supabase Realtime |

## 3. Schema Alignment

The database design already follows the proposal:

- `score_events` is the source of truth for STEAM changes.
- `steam_profiles` is a projection.
- `lessons.status` enforces HITL.
- `ai_usage` and `daily_cost_budgets` support cost control.
- `audit_log` supports NFR-14.

## 4. Required Database Hardening Before Pilot

### 4.1 Published-only RAG source

Risk from the current note: `document_chunks` can be retrieved without proving the associated lesson is published.

Required fix:

- create a SQL function such as `match_published_lesson_chunks(skill_node_id, query_embedding, match_count)`;
- inside the function, join `document_chunks -> source_documents -> lessons`;
- require `lessons.status = 'PUBLISHED'`;
- expose only that function to the Tutor service.

### 4.2 Cost circuit breaker automation

`daily_cost_budgets` stores budget state, but it needs automation.

Required fix:

- every AI Gateway call inserts `ai_usage`;
- a DB trigger or backend transaction updates `daily_cost_budgets.spent_usd`;
- when `spent_usd >= budget_usd`, set `circuit_tripped = true`;
- AI Gateway checks this before each non-essential AI call.

### 4.3 Guardian consent enforcement

Before the real pilot, student activity writes should verify:

- user is `ACTIVE`;
- if under 16, `guardian_consent_at is not null`.

This can be enforced in backend middleware first, then strengthened with RLS policies.

## 5. Access Patterns

| User | Access Pattern |
|---|---|
| Student | own profile, own scores, published lessons, own tutor sessions |
| Teacher | assigned class profiles, content jobs, DRAFT/PUBLISHED lessons they manage |
| Parent | linked child summary only, no raw Tutor chat |
| Admin | org-wide configuration, cost, audit, users |

## 6. Migration Rule

Every schema change must include:

1. SQL migration under `database/migrations` or `migrations`.
2. Update to `docs/databasedesign.md`.
3. Update to this file if RLS/API behavior changes.
4. Seed or sample data if it affects demo flows.

## 7. Demo Seed

Run `npm run seed:demo` inside `backend/`. The idempotent script uses existing tables only; it does not create or alter schema objects. It seeds:

- one organization, student, and teacher profile;
- seven Scratch Skill Nodes and prerequisite edges;
- seven `PUBLISHED` lessons reviewed by the demo teacher;
- STEAM profile, completed attempts, EXP activity, streak, and badges.
- a complete Loops lesson with three checkpoints, layered hints, and a published MCQ.

The seeded student is intentionally below the Arts and selected Tech/Engineering thresholds so the UI can demonstrate explainable recovery paths.

Use `npm run reset:demo` after an end-to-end presentation. The reset is narrowly scoped to the demo student and the seeded Loops question, then restores the documented STEAM/EXP/streak baseline. Production users are never included.
