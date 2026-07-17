# AI Module

## Purpose

Stores AI prompts, workflows, agents, tools, knowledge assets, and evaluation sets.

## Inputs

- Teacher source documents.
- Skill Node metadata.
- Approved lesson chunks.
- Student Tutor questions.

## Outputs

- Draft lesson content.
- Quiz and hints.
- Tutor answer with citation.
- Refusal or escalation recommendation.
- Evaluation reports.

## Dependencies

- AI Gateway service in backend.
- Supabase pgvector retrieval.
- Prompt files under `ai/prompts`.

## Limitations

- AI output is not authoritative until reviewed.
- AI must not answer Tutor questions without approved sources.
- Personalization path decisions do not use LLM.

## Implemented Tutor Assets

- `prompts/tutor_socratic.md`: approved-source-only Vietnamese Tutor behavior.
- `prompts/refusal.md`: deterministic insufficient-source refusal.
- Backend AI Gateway: moderation, embedding, Responses API, usage/cost logging, and circuit checks.
- Hybrid retrieval: deterministic lexical scope gate plus optional cosine ranking over approved chunk embeddings.

The model never receives profile names, email addresses, STEAM scores, EXP, or parent data. Student questions and approved lesson excerpts are sent externally only after organization approval and while the transfer gate is enabled.
