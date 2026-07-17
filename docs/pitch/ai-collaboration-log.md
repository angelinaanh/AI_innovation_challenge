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
