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

