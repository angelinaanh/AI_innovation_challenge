# AI Workflows

## 1. AI Design Rule

AI is the workflow engine for content production and support, but not the authority for student progression.

- Content generation: AI drafts, teacher approves.
- Tutor: AI answers only from approved sources.
- Personalization: deterministic rules, not LLM.
- Cost: every call goes through AI Gateway.

Model selection and feature routing live in `docs/ai/model-application-plan.md`. Feature code should call model aliases through AI Gateway rather than hardcoding model names.

## 2. AI Gateway

Responsibilities:

- route by task tier;
- check daily budget circuit breaker;
- apply cache;
- call provider;
- log `ai_usage`;
- return provider-normalized output;
- degrade gracefully when providers fail.

Tiering:

| Tier | Use | Notes |
|---|---|---|
| 1 | Cache + rules | Path, unlock, duplicate Tutor Q&A |
| 2 | Small LLM | Tutor, quiz, hints |
| 3 | Larger LLM | Lesson outline and full checkpoint draft |
| 4 | Open-weight fallback | Budget cut or provider outage |

## 3. Content Studio Generation

Input:

- source document text/chunks;
- target Skill Node;
- grade band;
- difficulty;
- STEAM weights;
- teacher constraints.

Output:

- checkpoint outline;
- checkpoint content;
- quiz questions at three difficulties;
- layered hints;
- quest/story idea;
- source mapping for review.

Human gate:

- all outputs saved as `DRAFT`;
- teacher edits and publishes;
- publish writes audit log.

Implemented Slice 7 behavior:

- prompt: `ai/prompts/content_studio_draft.md`;
- model route: backend `CONTENT_FAST_MODEL` through `generateStructuredLesson`, never a browser call;
- input: teacher-authorized text, Skill Node, grade band, title, and difficulty context;
- output: strict JSON with summary/objectives/checkpoints/hints and one MCQ;
- controls: organization budget check, transfer gate, JSON validation, moderation, `store: false`, and `ai_usage.feature = content_studio_draft`;
- fallback: transfer gate off uses `local-structured-draft-v1`; provider/budget outage uses `local-fallback-after-ai-error-v1`. Both remain `DRAFT` and expose generation provenance;
- edited checkpoints become local `document_chunks`, but Tutor cannot read them until their lesson is `PUBLISHED`.

## 4. Tutor RAG

Retrieval constraints:

- current Skill Node only;
- `lessons.status = 'PUBLISHED'` only;
- approved teacher Q&A only;
- top-k chunks with similarity threshold;
- refusal when threshold fails.

Answer constraints:

- Vietnamese, age-appropriate;
- Socratic mode for graded tasks;
- citations required;
- no unsupported outside knowledge;
- safety filter before and after generation.

## 5. Prompt File Pattern

Prompts live in `ai/prompts`, not inside business logic.

Each prompt must include:

- goal;
- allowed sources;
- constraints;
- output format;
- examples;
- refusal/failure behavior.

## 6. Evaluation

Critical evaluation set:

- in-scope Scratch questions with expected citations;
- out-of-scope questions that must be refused;
- answer-seeking quiz questions that must trigger Socratic hints;
- unsafe/self-harm/harassment inputs that must alert teacher;
- prompt injection inside source documents.

Metrics:

- citation validity;
- refusal correctness;
- teacher edit rate;
- escalation rate;
- cost per active student;
- cache hit rate.

## 7. Prompt Inventory

| File | Purpose |
|---|---|
| `ai/prompts/content_studio_draft.md` | Implemented structured lesson + MCQ draft |
| `ai/prompts/exercise_generator.md` | Implemented Tutor practice JSON |
| `ai/prompts/tutor_socratic.md` | Tutor answer with citations |
| `ai/prompts/refusal.md` | Out-of-scope refusal |

## 8. Slice 3 Implementation

Implemented:

- OpenAI SDK behind backend-only model aliases;
- per-student daily limit and organization daily cost circuit;
- input/output moderation with separate `ai_usage` records;
- deterministic lexical scope gate before any paid generation;
- deterministic prompt-override refusal before retrieval or generation;
- optional semantic ranking with `text-embedding-3-small` vectors;
- source proof through `document_chunks.source_document_id -> lessons.source_document_id` where lesson status is `PUBLISHED`;
- exact-question cache accounting;
- Responses API generation with `store: false` and no direct student identity fields;
- post-moderation SSE token, citation, refusal, done, and error events;
- student escalation and teacher-specific Socket.IO event.
- fail-closed `AI_ALLOW_APPROVED_CONTENT_EXPORT` gate around embedding, student-question moderation, and grounded generation.

Safety tradeoff: Tutor output is buffered until moderation passes, then delivered in SSE chunks. This adds first-token latency but prevents unmoderated model text from reaching a child.

## 9. Tutor Interactive Exercises (Slice 5)

The Tutor can generate interactive practice inside the chat instead of only answering. Four types: `mcq`, `matching`, `ordering`, `cloze`.

Generation constraints (same trust model as the grounded answer):

- grounded only on approved `document_chunks` for the current Skill Node;
- fails closed behind `AI_ALLOW_APPROVED_CONTENT_EXPORT`;
- structured JSON output (`text.format = json_object`) via `CONTENT_FAST_MODEL`, tier 2, logged to `ai_usage` as feature `tutor_exercise`;
- schema-validated (`validateExercise`) and output-moderated before it can render;
- server splits the model item into a render `payload` (no answers) and a server-only `answer_key`.

Safety separation: exercises are formative. Grading (`gradeExercise`, deterministic, unit-tested) awards small effort EXP through `exp_events` and never writes `score_events` or unlocks content. A correct item can be promoted to the teacher; approving an MCQ seeds a `DRAFT` question in the bank — a human-in-the-loop path from AI practice to reviewed content. Prompt: `ai/prompts/exercise_generator.md`.

Evaluation additions: generated exercises must (a) be answerable from the cited chunks, (b) pass schema validation, (c) never render an answer key, (d) grade a fully-correct response as correct and a wrong one as incorrect.

## 10. Deeper Tutor chat (Slice 5+)

The grounded chat gains four upgrades that keep the same safety model:

- **Agentic offers** — after any real answer the Tutor emits an `exercise_offer` SSE event with a rotated exercise type; on answer-seeking it steers to practice instead of the answer. Deterministic (no extra model call).
- **Personalisation** — the answer prompt includes a best-effort learning context (STEAM profile + the student's recent wrong attempts in the current node). It never blocks or leaks beyond the student's own data.
- **Ask-why loop** — a wrong exercise sends a grounded "vì sao mình sai" question referencing the item prompt, answered by the normal cited Tutor path.
- **Richer messages** — citations carry a `snippet` (expandable in the UI) and answers render inline `code`/**bold**. No new external calls; still moderated, cited, and refusable.
