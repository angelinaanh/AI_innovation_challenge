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

The frontend uses the publishable key only for Supabase Auth. Application data continues through Express, where the service secret stays in `backend/.env` and all user identity/role checks are repeated server-side.

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

Current implementation verifies:

- user is `ACTIVE`;
- if under 16, `guardian_consent_at is not null`.

Age, guardian email, and initial `account_status` are written to trusted Auth app metadata by the service-role backend, not accepted as authorization claims from browser metadata. Under-16 bootstrap sets `PENDING`; REST and Socket.IO fail closed until consent is recorded. Guardian email delivery and consent-token verification remain required before pilot, then RLS should repeat the same rule.

## 5. Auth/Profile Flow

1. Supabase Auth creates or authenticates the user and issues a short-lived access token plus refresh token.
2. The frontend calls `GET /api/auth/me`; a missing profile returns `PROFILE_ONBOARDING_REQUIRED`.
3. `POST /api/auth/bootstrap` validates name, grade, and date of birth, hardcodes role `student`, and creates `profiles`, `steam_profiles`, `exp_totals`, and `streaks` rows.
4. Express derives each protected request identity from `supabase.auth.getUser(accessToken)` and then checks profile role/status.
5. Socket.IO validates the same token before joining any user/teacher/admin room.

The existing live schema is sufficient for this slice: `guardian_consent_at` remains in `profiles`; sensitive onboarding state is stored in service-written Auth app metadata. A later schema/RLS migration should make account status and guardian workflow queryable and enforceable directly in Postgres.

## 6. Access Patterns

| User | Access Pattern |
|---|---|
| Student | own profile, own scores, published lessons, own tutor sessions |
| Teacher | assigned class profiles, content jobs, DRAFT/PUBLISHED lessons they manage |
| Parent | linked child summary only, no raw Tutor chat |
| Admin | org-wide configuration, cost, audit, users |

## 7. Migration Rule

Every schema change must include:

1. SQL migration under `database/migrations` or `migrations`.
2. Update to `docs/databasedesign.md`.
3. Update to this file if RLS/API behavior changes.
4. Seed or sample data if it affects demo flows.

## 8. Seeded QA Content

Run `npm run seed:demo` inside `backend/`. The idempotent script uses existing tables only; it does not create or alter schema objects. It seeds QA accounts and course content, but runtime APIs still require a valid JWT and never fall back to those identities. It seeds:

- one organization, student, and teacher profile;
- seven Scratch Skill Nodes and prerequisite edges;
- seven `PUBLISHED` lessons reviewed by the demo teacher;
- STEAM profile, completed attempts, EXP activity, streak, and badges.
- a complete Loops lesson with three checkpoints, layered hints, and a published MCQ.

The seeded student is intentionally below the Arts and selected Tech/Engineering thresholds so the UI can demonstrate explainable recovery paths.

Use `npm run reset:demo` after an end-to-end presentation. The reset is narrowly scoped to the demo student and the seeded Loops question, then restores the documented STEAM/EXP/streak baseline. Production users are never included.

Slice 3 seeds one approved Loops source document and three deterministic `document_chunks`, then attaches that source to the `PUBLISHED` Loops lesson. `npm run seed:tutor` scopes lessons through `skill_nodes.org_id`, fills only missing embeddings, and writes an `ai_usage` record. Running that command transfers approved checkpoint excerpts to OpenAI and therefore requires explicit organization approval.

The backend keeps `AI_ALLOW_APPROVED_CONTENT_EXPORT=false` by default. With the gate off, chunks and student questions remain local, grounded generation is refused, and teacher escalation stays available.

Tutor retrieval first selects `PUBLISHED` lessons for the requested Skill Node, collects only their non-null `source_document_id` values, and then queries chunks within that allowlist. The service role never performs an unrestricted chunk similarity search.
