# Implementation Process

## 1. Rule

No code-only changes. Every implementation change must update its documentation surface in the same commit.

## 2. Change Checklist

Before coding:

- Identify the user problem and judging value.
- Identify the module and owner folder.
- Check whether the feature is P1, P2, or P3.
- Check database/RLS impact.
- Check AI safety impact.

During coding:

- Keep UI, business logic, AI, infrastructure, database, and utilities separate.
- Keep prompts outside code.
- Log errors and AI requests.
- Prefer small files and single-responsibility functions.

Before commit:

- Update matching docs.
- Update API contract if endpoints changed.
- Update env examples if config changed.
- Add or update critical tests.
- Run available lint/test commands.
- Review `git diff`.

## 3. Documentation Routing

| Change type | Required docs |
|---|---|
| New screen/component | `docs/design/ui-product-design.md`, `frontend/README.md` |
| New endpoint | `docs/api/api-contract.md`, backend route docs |
| New AI workflow | `docs/ai/ai-workflows.md`, prompt file in `ai/prompts` |
| New database object | `docs/databasedesign.md`, `docs/architecture/supabase-integration.md` |
| New realtime event | `docs/architecture/backend-realtime-architecture.md`, API contract |
| New demo path | `docs/problem/mvp-scope.md`, pitch notes |
| New deployment step | `infrastructure/deployment/README.md` |

## 4. Git Flow

- Work on feature branches using prefix `codex/`.
- Use meaningful commits.
- Push after each coherent unit of work.
- Do not commit `.env`, service role keys, generated logs, or build outputs.

## 5. Done Definition

A task is done only when:

- the workflow works or the design doc is complete;
- docs/readme are updated;
- security and privacy assumptions are stated;
- testing status is known;
- git status is clean after commit/push.

