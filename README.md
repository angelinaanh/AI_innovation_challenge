# EduOne Adaptive Learning & Content Studio

AI-native learning platform for mixed-ability classrooms: adaptive STEAM learning paths for students, plus a human-reviewed Content Studio for teachers.

## Product Direction

EduOne solves two connected problems from the proposal:

- Students drop out because one static path cannot fit mixed ability classrooms.
- Teachers and curriculum volunteers cannot scale when one lesson takes 40-50 hours to prepare.

The system is designed as one loop:

1. Student activity updates a 5-axis STEAM profile.
2. The rule-based path engine recommends the next Skill Node with a visible reason.
3. Content Studio helps teachers generate lesson drafts, quizzes, hints, and quest ideas.
4. Teachers review and publish content.
5. Students learn from only `PUBLISHED` lessons, and AI Tutor answers only from approved material.

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React, JavaScript, Tailwind CSS, Recharts |
| Backend | Node.js, Express.js, Socket.IO, SSE for AI streaming |
| Database | Supabase Postgres, pgvector, Supabase Auth, Storage, RLS |
| AI | AI Gateway, RAG, prompt files, evaluation workflow |
| Deployment target | Vercel frontend, Railway/Render backend, Supabase database |

## Supabase Environment

Use local env files only. Do not commit real `.env` files.

Frontend variables:

```bash
VITE_SUPABASE_URL=https://wpxddpyuabztdstszgwk.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_FViOIxMjuN6Eu91INSN5zA_oLkjMTcI
```

## Current Implementation

The implemented slices run against the existing Supabase project. Slice 1 provides:

- responsive Student Dashboard at `/student`;
- explainable Learning Path at `/student/path`;
- real STEAM, EXP, streak, badge, lesson, and attempt data from Supabase;
- deterministic rule-based path engine with numeric unlock and recovery reasons;
- Express REST API and Socket.IO connection status;
- idempotent Scratch demo seed with 7 Skill Nodes.

Slice 2 adds a complete learning loop:

- published-only Lesson Player at `/student/lessons/:skillNodeId`;
- three checkpoint lesson for “Vòng lặp kỳ diệu”;
- layered hints that never reveal the answer immediately;
- server-graded MCQ with instant constructive feedback;
- first-correct STEAM/XP/streak update and refreshed Learning Path;
- replayable demo reset with `npm run reset:demo`.

Slice 3 is implemented as a safety-first AI Tutor workflow:

- Lesson Player Tutor drawer with explicit AI and approved-content labels;
- session/message persistence in Supabase;
- deterministic scope gate before generation;
- OpenAI moderation, grounded response generation, citations, and SSE delivery;
- refusal and student-requested escalation to the teacher queue;
- per-student daily limit, organization budget circuit, cache accounting, and `ai_usage` logs.

Slice 4 replaces the demo identity fallback with real authentication:

- email/password and Google sign-in through Supabase Auth;
- student/teacher registration, email confirmation, forgot/reset password, and OAuth onboarding;
- backend-verified Supabase JWT on every student, Tutor, teacher, and Socket.IO request;
- server-side profile bootstrap for the selected student/teacher role; student profiles also receive initial STEAM/EXP/streak projections;
- role-aware protected routes and real local sign-out;
- under-16 registration requires a guardian email and remains `PENDING` until consent is recorded.

Seed data remains available for repeatable QA, but the API never selects the first student and never accepts a client-supplied student ID.

Slice 5 makes the AI Tutor intervene beyond chat with interactive practice:

- the Tutor generates four interactive exercise types inside the chat — multiple choice, matching (drag-and-drop columns), ordering, and cloze fill-in-the-blank;
- every exercise is grounded on the same teacher-approved chunks the Tutor cites and is validated against a schema and moderated before it renders;
- exercises are **formative practice only**: they are graded on the server, award small effort EXP, and never change the STEAM profile or unlock content, preserving the "AI never reaches students unreviewed" invariant;
- a correct item can be sent to the teacher, who reviews it and — for multiple choice — seeds a `DRAFT` question in the real question bank (a human-in-the-loop path from Tutor practice to reviewed content);
- new tables `tutor_exercises` and `tutor_exercise_attempts` (migration `database/migrations/0002_tutor_interactive_exercises.sql`), answer keys kept server-side.

The AI Tutor chat itself is deeper than one-shot Q&A:

- **agentic** — after a grounded answer it proactively offers a matching practice exercise (`exercise_offer`), and when a student asks for the answer it nudges toward practice instead;
- **personalised** — answers use the student's STEAM profile and what they recently got wrong in the node (best-effort, never blocking);
- **"Vì sao mình sai?"** — a wrong exercise offers a one-click grounded explanation back in the chat;
- **richer rendering** — inline `code`/**bold** (e.g. Scratch block names) and expandable source snippets on each citation.

Live exercise generation requires `OPENAI_API_KEY` and `AI_ALLOW_APPROVED_CONTENT_EXPORT=true`; with the gate off it fails closed like the rest of the Tutor. Apply migration `0002` to the Supabase project before use.

Slice 6 makes the first teacher/student class workflow operational:

- teachers self-register as `ACTIVE`, then create subject-bound classes for an exact grade from 1 to 12;
- the GDPT 2018 STEAM catalog contains 101 grade-specific rows and constrains the subject option after the grade changes;
- teachers own their classes, invite same-organization/same-exact-grade students, and approve or reject join requests;
- students have `/student/classes` to join by code, accept/decline invitations, and see active classes;
- teachers have `/teacher` and `/teacher/classes/:classId` for class creation, join code, pending requests, and roster;
- Socket.IO pushes membership changes to both teacher and student workspaces;
- migration `0003` supplies the classroom tables; migration `0004` adds exact grade columns, database consistency constraints, and the 101-row catalog.

Teacher self-registration is an intentional product override of Functional Spec `F-103`. See `docs/problem/teacher-student-role-impact.md` for the requirement trace, safety boundaries, and the next content-assignment slice.

Slice 7 completes the first real teacher-to-student content loop:

- `/teacher/content` lists every Skill Node with teacher-owned drafts, review state, published variants, and archived-version count;
- a teacher pastes an authorized source, chooses Skill Node/difficulty, and receives a structured Vietnamese lesson draft from the configured OpenAI content model;
- `AI_ALLOW_APPROVED_CONTENT_EXPORT=false` keeps the source local and uses a deterministic structured draft; provider/budget outages also fall back locally and record that generation mode;
- `/teacher/content/:lessonId` provides source-versus-draft editing for lesson metadata, objectives, checkpoints, MCQ, correct answer, and explanation;
- the enforced lifecycle is `DRAFT -> IN_REVIEW -> PUBLISHED`; publishing records reviewer/time/audit, publishes questions, creates approved Tutor chunks, and archives the prior version at the same node/difficulty;
- `/student/content` is the published content library. It shows approved lessons immediately while preserving prerequisite and STEAM locks; the existing Lesson Player and Tutor then consume the published version only;
- `content.published` is emitted to the verified organization Socket.IO room so student dashboard/path/content surfaces refresh without trusting the browser.

Slice 7 reuses the existing `source_documents`, `document_chunks`, `lessons`, `questions`, `content_jobs`, and `audit_log` tables; no new migration is required. A live Supabase E2E verified AI draft, edit, review, publish, revision, old-version archive, three Tutor chunks, published question, audit trail, and the new student lesson.

## Local Start

```bash
cd backend
npm install
npm run seed:demo
npm run seed:sources
npm run seed:subjects
npm start
```

`npm run seed:subjects` reconciles the 101 grade-specific STEAM subject rows for every organization. Apply migrations `0002`, `0003`, and `0004` before running the source/subject seeds.

`npm run seed:sources` backfills approved grounding chunks from each published lesson's own checkpoint content, so the grounded Tutor chat and interactive exercises work on **every** Skill Node, not only the seeded Loops lesson. It is idempotent and preserves the hand-authored Loops source. Without it, only the Loops node has approved material and the Tutor correctly refuses / cannot build exercises elsewhere.

`npm run seed:tutor` is optional and sends only teacher-approved checkpoint excerpts to OpenAI to create embeddings. Run it only after the organization has approved that external data transfer. Lexical grounding and refusal still work without embeddings.

Keep `AI_ALLOW_APPROVED_CONTENT_EXPORT=false` until that approval is recorded. While the gate is off, no student question, lesson excerpt, or teacher Content Studio source is sent to OpenAI; Tutor generation and `seed:tutor` fail closed, while Content Studio degrades to its local draft generator.

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173/login`. Registration lets a user choose **Học sinh** or **Giáo viên**; a teacher account activates immediately (no grade or guardian consent), while a student chooses the exact current grade (1-12) and stays `PENDING` when under 16 until guardian consent. Admin accounts are still provisioned by an administrator.

## Documentation Map

| Area | File |
|---|---|
| System architecture | `docs/architecture/system-design.md` |
| Frontend architecture | `docs/architecture/frontend-architecture.md` |
| Backend realtime architecture | `docs/architecture/backend-realtime-architecture.md` |
| Supabase integration | `docs/architecture/supabase-integration.md` |
| UI and product design | `docs/design/ui-product-design.md` |
| Implementation process | `docs/design/implementation-process.md` |
| Feature blueprint | `docs/problem/feature-blueprint.md` |
| Teacher/student role impact | `docs/problem/teacher-student-role-impact.md` |
| API contract | `docs/api/api-contract.md` |
| AI workflows | `docs/ai/ai-workflows.md` |
| AI model application plan | `docs/ai/model-application-plan.md` |
| MVP scope | `docs/problem/mvp-scope.md` |
| Test strategy | `docs/testing/test-strategy.md` |
| Database design note | `docs/databasedesign.md` |

## Repository Structure

```text
.github/workflows      CI/CD workflows
docs                   Product, architecture, API, AI, testing, pitch docs
frontend               React + Tailwind student/teacher/admin app
backend                Express API, realtime, AI gateway adapter
ai                     Agents, prompts, workflows, tools, knowledge, evaluation
database               Supabase schema, migrations, seeds
infrastructure         Docker and deployment configuration
data                   Sample and processed demo data
presentation           Pitch and demo materials
submission             Final competition package
scripts                Project automation scripts
shared                 Shared constants, contracts, validation helpers
logs                   Local runtime logs, ignored by Git
```

## Working Rule

Every code change must update the matching docs:

- New UI screen: update `docs/design/ui-product-design.md` and frontend README.
- New API endpoint: update `docs/api/api-contract.md`.
- New backend service: update `docs/architecture/backend-realtime-architecture.md`.
- New AI workflow or prompt: update `docs/ai/ai-workflows.md` and store prompt text under `ai/prompts`.
- New database table/policy: update `docs/databasedesign.md`, `docs/architecture/supabase-integration.md`, and migration files.
- Demo-facing change: update `docs/pitch/ai-collaboration-log.md` or presentation notes.

## Current Design Priorities

1. Build one complete demo workflow before broad feature expansion.
2. Keep AI outputs grounded, cited, reviewed, and auditable.
3. Keep adaptive personalization explainable and rule-based.
4. Keep parent visibility useful but privacy-preserving.
5. Avoid public leaderboards; gamification should motivate without pressure.
