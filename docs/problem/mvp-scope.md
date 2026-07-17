# MVP Scope

## 1. MVP Product Bet

The hackathon MVP should prove one claim:

> EduOne can reduce teacher content-production time while giving each student a safe, explainable, adaptive learning path.

Do not build every module at once. Build one complete loop.

## 2. Must Have

| Area | MVP behavior |
|---|---|
| Auth/Roles | student, teacher, admin demo accounts |
| Student Dashboard | STEAM radar, next quest, XP/streak/badges |
| Path Engine | rule-based next Skill Node with reason |
| Lesson Player | published checkpoint lesson, quiz, hints |
| Tutor | grounded answer with citation, refusal, escalation |
| Content Studio | upload/sample source, generate draft, review, publish |
| Teacher Dashboard | escalation queue and simple heatmap |
| Admin Cost | AI usage snapshot and circuit breaker state |
| Docs | README, architecture, API, AI workflow, demo script |

## 3. Should Have

- Supabase Auth connected end-to-end.
- Real pgvector retrieval.
- Content job progress via Socket.IO.
- Edit rate and human minutes calculation.
- Seeded Scratch course with 7 Skill Nodes.

## 4. Could Have

- Parent portal summary.
- Community product gallery.
- Badges beyond demo seeds.
- OCR for scanned PDFs.
- Native mobile polish.

## 5. Won't Have For MVP

- Public leaderboard.
- Auto-publishing AI content.
- Open-ended ChatGPT-like tutor.
- Native mobile app.
- Full social network.
- Real payment/business system.

## 6. Demo Story

1. Minh logs in and sees "Recommended: Loops" with a clear reason.
2. Minh asks the Tutor why a Scratch loop does not stop.
3. Tutor answers with a checkpoint citation.
4. Minh asks something outside the lesson; Tutor refuses and escalates.
5. Teacher sees the escalation and answers.
6. Teacher opens Content Studio, reviews an AI-generated draft, and publishes it.
7. Student path updates with the newly published Skill Node.
8. Admin shows AI usage stayed below budget.

## 7. Judge Score Strategy

| Rubric | What to show |
|---|---|
| Technical | Working flow, clean architecture, realtime job/escalation |
| AI Native | RAG, HITL, cost routing, evaluation, not a wrapper |
| Business | 40-50h to under 12h content production goal |
| UX | joyful student UI, operational teacher review UI |
| Safety | RLS, published-only, citations, refusal, audit, parent privacy |
| Presentation | one crisp transformation story |

## 8. Delivery Status

| Slice | Status | Proof |
|---|---|---|
| Slice 1 — Student Dashboard + Path | Complete | Supabase-backed dashboard, 7-node path, deterministic explanations, responsive QA |
| Slice 2 — Lesson Player + Quiz + Hint | Complete | 3 checkpoints, layered hints, server grading, first-correct rewards, path refresh |
| Slice 3 — AI Tutor + Escalation | Next | model and RAG routing documented |
| Slice 4 — Content Studio | Planned | review/publish workflow documented |
| Slice 5 — Teacher/Admin proof panels | Planned | analytics and cost contracts documented |
