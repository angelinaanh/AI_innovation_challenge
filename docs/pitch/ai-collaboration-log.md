# AI Collaboration Log

## 2026-07-18 — System Design Foundation

Prompt:

> Based on the proposal, functional specification, folder structure, Supabase database note, and sample UI, design the deep system direction for React + JavaScript + Tailwind frontend, Node.js + Express + realtime backend, and Supabase database.

Decision:

- Created root README and documentation map.
- Chose one complete MVP loop over broad feature spread.
- Kept student UI playful and teacher/admin UI operational.
- Chose Express API with Socket.IO for app realtime and SSE for Tutor token streaming.
- Kept AI Tutor grounded on published lesson chunks only.
- Flagged two required database hardening items: published-only RAG retrieval and automatic cost circuit breaker.

Reason:

This maximizes VAIC judging score across product value, AI-native architecture, trustworthiness, UX, and technical execution.

## 2026-07-18 — Feature Blueprint From Primary Documents

Prompt:

> Features must be based on the two main documents. Analyze and develop them deeply.

Decision:

- Added `docs/problem/feature-blueprint.md`.
- Mapped each feature cluster to Proposal `FR/NFR` and Functional Spec `M/F/P/R/S` codes.
- Defined MVP vertical slices: Student Dashboard + Path, Lesson Player, AI Tutor, Content Studio, Teacher/Admin proof panels.
- Explicitly listed must-not-build items such as public leaderboard, parent raw chat access, auto-publish, and out-of-scope Tutor answers.

Reason:

This prevents feature drift and gives implementation a traceable source-of-truth before coding starts.

## 2026-07-18 — AI Model Application Plan

Prompt:

> Plan how to apply OpenAI models to each system feature.

Decision:

- Added `docs/ai/model-application-plan.md`.
- Defined AI Gateway model aliases instead of scattering raw model names.
- Mapped OpenAI text, embedding, moderation, and realtime models to each `M1-M11` module.
- Kept rule-based modules non-AI: RBAC, scoring, path engine, EXP, risk score, cost circuit, audit.
- Added backend env placeholders for OpenAI model aliases without storing the provided API key.

Reason:

This keeps model usage traceable, cheap, safe for children, and aligned with the two primary project documents.

## 2026-07-18 — Slice 1 Student Dashboard + Path

Prompt:

> Start building with the existing Supabase tables, system documents, folder process, and reference UI.

Decision:

- Connected Express to the existing Supabase schema and confirmed all required tables.
- Added an idempotent seven-node Scratch demo seed because the provisioned tables were empty.
- Implemented deterministic Skill Node recommendation and numeric recovery reasons without an LLM.
- Built responsive Student Dashboard and Learning Path screens in React, JavaScript, Tailwind, Recharts, and Lucide.
- Added Socket.IO readiness, error/loading states, tests, and desktop/mobile browser QA.
- Kept public leaderboard patterns out and marked every student lesson as teacher-approved.

Reason:

This completes the first judge-visible proof: a student can immediately understand what to learn next, why it is available, and what to improve for locked paths.

## 2026-07-18 — Slice 2 Lesson Player + Quiz

Prompt:

> Continue coding after the Student Dashboard and Learning Path.

Decision:

- Built the complete “Vòng lặp kỳ diệu” lesson with three checkpoints and visual Scratch blocks.
- Added layered hints, server-side grading, constructive retry, and first-correct reward rules.
- Kept answer keys out of frontend responses and blocked locked/unpublished lesson access.
- Connected correct attempts to append-only STEAM/EXP events, projections, streak, and path recalculation.
- Added a narrowly scoped demo reset for repeatable judging presentations.
- Verified desktop/mobile layout and the full wrong-to-correct workflow against Supabase.

Reason:

This turns the explainable recommendation from Slice 1 into a working learning loop where one student action visibly changes mastery, XP, and the next Skill Node.

## 2026-07-18 — Slice 3 AI Tutor Foundation

Prompt:

> Continue.

Decision:

- Added a Lesson Player Tutor drawer with visible AI identity, approved-source trust state, SSE, citations, refusal, and escalation UX.
- Built a backend AI Gateway for moderation, model aliases, budget/limit checks, usage logging, and graceful degradation.
- Restricted retrieval to source documents attached to `PUBLISHED` lessons in the current Skill Node.
- Added deterministic out-of-scope and answer-seeking gates before generation.
- Persisted Tutor sessions/messages and routed one unresolved question to the demo teacher queue.
- Kept full student identity and performance data out of model requests.
- Paused approved-source embedding execution until external data transfer is explicitly approved.

Reason:

This proves that EduOne's Tutor is a bounded learning workflow with evidence and a human exit, rather than an unrestricted chatbot.

## 2026-07-18 — Slice 4 Real Authentication & RBAC

Prompt:

> The web system is still a demo and has no login/register. Make it practical.

Decision:

- Replaced first-student/demo-header identity with Supabase Auth sessions and backend-validated JWT.
- Added email/password and Google login, student registration, email confirmation callback, onboarding, forgot/reset password, and account-state screens.
- Hardcoded self-registration to student; teacher/admin remain administrator-provisioned per F-103.
- Added server-side role and active-account middleware to REST and Socket.IO.
- Added fail-closed guardian pending behavior for students under 16, matching F-102 while consent delivery remains the next security slice.
- Verified the real QA login loads the correct Supabase dashboard and realtime session, then signs out safely.

Reason:

This converts the existing learning workflow from a shared seeded identity into a user-owned session with enforceable server boundaries, while preserving the database and approved-content safety rules.

## 2026-07-18 — Slice 6 Teacher Classes & Student Membership

Prompt:

> Let teachers self-register, then build real teacher classes with subjects, invitations/approval, and student join/accept flows based on the two primary documents.

Decision:

- Recorded teacher self-registration as an intentional override of `F-103`; teachers become `ACTIVE` immediately while Admin remains separately provisioned.
- Seeded the 28-row GDPT 2018 subject catalog across S/T/E/A/M and three grade bands.
- Built real teacher class creation, join code, invitation, request decision, roster, and student class/invitation screens.
- Enforced teacher ownership, organization scope, grade matching, and subject validity in Express before Supabase service-role writes.
- Added `class.membership.updated` Socket.IO fan-out and role-safe post-login redirects.
- Verified both real Supabase workflows: invite/accept for “Scratch sáng tạo 6A” and join-code request/teacher approval for “Công nghệ sáng tạo 6B”.

Reason:

This turns the teacher role from a placeholder into an operational workflow and establishes the ownership boundary required before class-scoped publishing, learner analytics, and interventions.

## 2026-07-18 — Slice 7 Content Studio → Student Content

Prompt:

> Build all teacher content features from the two primary documents; publishing must create a real student content page and feed the Tutor.

Decision:

- Built a Skill Node Content Studio and source-versus-draft editor for lesson metadata, objectives, checkpoints, quiz, review, publish, revision, and archive.
- Routed teacher-authorized source text through the backend AI Gateway with strict JSON, budget/transfer checks, moderation, usage logs, and a labelled local fallback.
- Enforced `DRAFT -> IN_REVIEW -> PUBLISHED`, wrote audit actions and production metrics, published questions/chunks, and archived the prior same-difficulty version.
- Added organization-scoped `content.published` realtime refresh.
- Added `/student/content`; it exposes only published nodes, preserves explainable STEAM/prerequisite locks, and opens the existing Lesson Player/Tutor on the current version.
- Verified the full workflow against live Supabase and OpenAI, then checked desktop/mobile UI with no overflow or console errors.

Reason:

This closes the product loop promised by the proposal: AI accelerates teacher preparation, human review remains the authority, and one publish action has a visible, auditable effect on the student experience and grounded Tutor knowledge.
