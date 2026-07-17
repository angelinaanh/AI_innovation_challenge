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

