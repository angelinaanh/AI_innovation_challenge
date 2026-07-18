# Test Strategy

## 1. Goal

Test the workflows that carry the most product risk, AI risk, and demo risk.

## 2. Critical Test Areas

| Area | Test |
|---|---|
| Auth/RBAC | student cannot access teacher/admin endpoints |
| Account bootstrap | self-registration creates selected student/teacher; only students receive learning projections |
| Guardian gate | under-16 account remains `PENDING` until consent |
| Published-only content | student cannot fetch DRAFT lessons |
| Score events | normal learning cannot lower STEAM score |
| Path engine | recommendations include correct unlock reasons |
| Tutor retrieval | only published current-node chunks are used |
| Tutor refusal | out-of-scope question is refused |
| Escalation | teacher receives realtime escalation |
| Content publish | publish writes audit log |
| Cost circuit | AI Gateway blocks non-essential calls when tripped |
| Parent privacy | parent cannot read raw Tutor messages |
| Classroom scope | teacher owns the class; student/subject organization and grade must match |
| Membership workflow | invite/request transitions converge correctly and update both roles realtime |

## 3. Frontend Tests

Use focused component tests for:

- dashboard renders radar and next quest;
- path locked node shows reason;
- Tutor drawer handles answer, refusal, and escalation states;
- teacher publish toolbar requires explicit action;
- admin cost warning state.

Browser smoke tests must load `http://localhost:5173/` from a clean signed-out navigation, verify it reaches `/login`, confirm `#root` has rendered children, and assert that the console has no error. After dependency or Vite config changes, `/src/main.jsx` must use `react/jsx-dev-runtime`; a stale classic transform that references an undefined global `React` is a white-screen regression.

Authentication browser smoke tests start signed out at `/login`, verify `/register` offers student/teacher only, confirm an under-16 student reveals required guardian email, sign in with controlled QA accounts, wait for authenticated data/realtime, and sign out back to login. Do not create arbitrary live users during automated QA.

## 4. Backend Tests

Use API integration tests for:

- `/student/lessons/:skillNodeId` filters unpublished lessons;
- `/tutor/.../stream` refuses without valid source;
- `/teacher/lessons/:id/publish` writes audit log;
- path engine returns deterministic output;
- cost circuit checker blocks AI calls.

## 5. AI Evaluation

Maintain a small evaluation set under `ai/evaluation`:

- 10 in-scope Scratch questions;
- 5 out-of-scope questions;
- 5 prompt injection examples;
- 5 "give me the answer" quiz cases;
- 5 safety-sensitive cases.

Run before demo and record:

- pass/fail;
- citation validity;
- refusal correctness;
- average cost;
- teacher edit notes.

## 6. Demo QA

Before any live demo:

- seed database;
- verify demo accounts;
- run one full student workflow;
- run one full teacher publish workflow;
- verify realtime escalation;
- verify fallback screenshots/video exist;
- verify no `.env` or service role key is committed.

## 7. Current Verification Record

Slice 1 verification includes:

- three path-engine unit tests: recommendation, numeric recovery, and published-lesson gate;
- production frontend build;
- live Supabase API smoke test for `/api/student/dashboard`;
- browser navigation from dashboard to Learning Path;
- Socket.IO connected state;
- desktop layout check at 1440x1000;
- mobile layout and drawer check at 390x844;
- horizontal overflow assertions for dashboard, path, and all path cards.

Slice 2 verification adds:

- MCQ answer validation and grading unit test;
- deterministic STEAM delta unit test;
- hinted/non-hinted reward and level unit test;
- live check that lesson API exposes no `answer_key`;
- wrong-answer feedback and retry browser flow;
- correct-answer reward with real Supabase score/EXP writes;
- verified path change from Loops to Variables;
- controlled demo reset back to the baseline;
- desktop/mobile Lesson Player overflow and button-content checks.

Slice 3 verification adds:

- deterministic Vietnamese normalization and lexical scope tests;
- in-scope versus unrelated retrieval gate tests;
- answer-seeking/Socratic mode detection test;
- prompt-override detection test before retrieval/generation;
- stable SSE framing and chunk reconstruction test;
- live Supabase session/message persistence;
- live out-of-scope refusal with no generation call;
- student escalation and teacher queue API check;
- desktop 1280px and mobile 390x844 Tutor drawer overflow checks;
- browser regression for an SSE connection that must end and unlock the composer;
- live fail-closed check where an in-scope query emits `external_transfer_disabled`, creates zero provider calls, and exports neither the question nor a checkpoint;
- synthetic, non-project Responses API smoke check against `gpt-5.6-luna`;
- staged-secret scan excluding ignored local environment files.

The approved-source embedding and generated-answer E2E test is intentionally blocked until external transfer of published lesson excerpts is explicitly approved.

Slice 4 authentication verification adds:

- backend auth-rule tests for the age boundary, guardian requirement, status normalization, and learning access;
- frontend tests for the same under-16 threshold and open-redirect protection;
- public health endpoint returns 200 while missing/invalid JWT requests return 401;
- real Supabase login loads the correct student profile, 1,470 XP, learning path, and authenticated Socket.IO connection;
- real local sign-out returns the protected route to login;
- desktop and 390x844 login/register layout checks with no horizontal overflow or console error;
- under-16 registration reveals guardian email and recovery URL without a session cannot update a password;
- production frontend build and staged-secret scan.

Slice 6 classroom verification adds:

- pure membership-state and join-code unit tests;
- role-aware return-path tests so a teacher cannot be redirected into a remembered student URL;
- live Supabase subject catalog with 28 GDPT 2018 rows;
- real teacher create-class and invite flow;
- real student invitation display and acceptance;
- real student join-code request and teacher approval flow;
- teacher roster refresh showing the accepted student;
- subject/teacher metadata and Socket.IO connected state on both role workspaces;
- backend test suite (28 passing), frontend test suite (3 passing), and production build.
