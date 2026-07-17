# AI Workflows

## 1. AI Design Rule

AI is the workflow engine for content production and support, but not the authority for student progression.

- Content generation: AI drafts, teacher approves.
- Tutor: AI answers only from approved sources.
- Personalization: deterministic rules, not LLM.
- Cost: every call goes through AI Gateway.

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

## 7. First Prompt Files To Create

| File | Purpose |
|---|---|
| `ai/prompts/content_outline.md` | Generate checkpoint outline |
| `ai/prompts/checkpoint_draft.md` | Generate grounded checkpoint content |
| `ai/prompts/quiz_and_hints.md` | Generate quiz and layered hints |
| `ai/prompts/tutor_socratic.md` | Tutor answer with citations |
| `ai/prompts/refusal.md` | Out-of-scope refusal |
| `ai/prompts/safety_classifier.md` | Safety triage |

