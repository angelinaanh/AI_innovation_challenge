# Test Strategy

## 1. Goal

Test the workflows that carry the most product risk, AI risk, and demo risk.

## 2. Critical Test Areas

| Area | Test |
|---|---|
| Auth/RBAC | student cannot access teacher/admin endpoints |
| Published-only content | student cannot fetch DRAFT lessons |
| Score events | normal learning cannot lower STEAM score |
| Path engine | recommendations include correct unlock reasons |
| Tutor retrieval | only published current-node chunks are used |
| Tutor refusal | out-of-scope question is refused |
| Escalation | teacher receives realtime escalation |
| Content publish | publish writes audit log |
| Cost circuit | AI Gateway blocks non-essential calls when tripped |
| Parent privacy | parent cannot read raw Tutor messages |

## 3. Frontend Tests

Use focused component tests for:

- dashboard renders radar and next quest;
- path locked node shows reason;
- Tutor drawer handles answer, refusal, and escalation states;
- teacher publish toolbar requires explicit action;
- admin cost warning state.

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
