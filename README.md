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

Slices 1 and 2 are working against the existing Supabase project. Slice 1 provides:

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

Demo mode currently resolves the first student profile when no authenticated student ID is supplied. Supabase JWT authentication and server-side role middleware must be completed before public deployment.

## Local Start

```bash
cd backend
npm install
npm run seed:demo
npm start
```

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173/student`.

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
