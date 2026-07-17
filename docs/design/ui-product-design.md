# UI & Product Design

## 1. Direction From Reference UI

The reference UI has the right emotional direction for the student experience:

- bright, playful, quest-like, and motivating;
- card-based information hierarchy;
- visible XP, streak, badge, and STEAM radar;
- soft gradients and rounded surfaces that fit K-12 learners.

EduOne should keep the energy but make it more specific to the proposal:

- replace generic leaderboard patterns with private progress and class health;
- show Skill Node context clearly;
- explain why the next lesson is recommended;
- make AI transparent, cited, and safely bounded.

## 2. Design Principles

| Principle | UI Consequence |
|---|---|
| Safe to fail | No public leaderboard, no shame states, constructive copy only |
| Explainable learning | Every recommendation shows the score/prerequisite reason |
| Teacher remains in control | Draft/review/publish state is visually obvious |
| AI is visible but bounded | Tutor labels, citations, refusal states, escalation path |
| Demo-friendly | Each key workflow creates a visible change within 30 seconds |

## 3. Visual System

### Palette

Use a lively but balanced palette, not one dominant purple gradient.

| Role | Token | Suggested value |
|---|---|---|
| Success / action | `green-500` | `#22c55e` |
| Quest energy | `amber-400` | `#fbbf24` |
| AI / insight | `violet-500` | `#8b5cf6` |
| Learning blue | `sky-500` | `#0ea5e9` |
| Safety / alert | `rose-500` | `#f43f5e` |
| Background | `slate-50` | `#f8fafc` |
| Text | `slate-950` | `#020617` |

### Typography

- Use a rounded display font only for student hero headings if available.
- Use a readable UI font for all dashboard, editor, and admin surfaces.
- Avoid scaling font size with viewport width.
- Keep button labels short and use icons where possible.

### Shape & Layout

- Cards: max `8px` radius for operational teacher/admin areas.
- Student quest cards may use larger radii sparingly.
- Toolbars and action buttons should use icons plus tooltips.
- No card inside card.
- Dashboard should fit the first meaningful actions above the fold.

## 4. Student App

### Screens

| Screen | Purpose | Key Components |
|---|---|---|
| Dashboard | Motivate and orient | STEAM radar, next quest, streak, XP, badges, recent progress |
| Learning Path | Explain the route | Skill Node map, locked reasons, unlock suggestions |
| Lesson Player | Complete one Skill Node | Checkpoints, quiz, hints, task submission, Tutor drawer |
| Tutor | Ask safely | Source-cited answers, Socratic hint mode, escalation |
| Profile | Reflect on growth | Score history, badges, projects, parent invite later |

### Dashboard Adjustments From Reference UI

- Rename `Friends / Weekly` to `Progress Snapshot` or `Class Momentum`.
- Remove `#1/#2/#3` ranking. Show personal milestones instead:
  - "You completed 3 of 7 Scratch nodes"
  - "Class solved 82% of loops quizzes"
  - "Your next unlock: Variables"
- Add a recommendation card:
  - Title: "Recommended next: Loops"
  - Reason: "Tech 62 >= 55 and Events completed"
  - Recovery path: "Arts is 34; try Story Sprite Quest to unlock design nodes"
- Add Tutor trust label near chat:
  - "AI Tutor uses only teacher-approved lessons"
  - "Sources shown after each answer"

## 5. Teacher Studio

Teacher UI should feel calmer and more operational than the student UI.

| Screen | Purpose | Required States |
|---|---|---|
| Class Dashboard | Detect who needs help | Heatmap, risk queue, content issue signals |
| Content Upload | Start generation | Upload state, extraction state, cost warning |
| Review Workspace | Human-in-the-loop | Source left, draft right, diff/edit rate, publish button |
| Tutor Escalations | Answer unresolved questions | Pending/answered/ingested states |
| Production Report | Prove time savings | Human minutes, edit rate, baseline comparison |

Important: the publish action must be deliberate and auditable. Use clear status chips: `DRAFT`, `IN_REVIEW`, `PUBLISHED`, `ARCHIVED`.

## 6. Admin Console

Admin UI is utility-first:

- user and role management;
- Skill Node graph and thresholds;
- AI cost dashboard and circuit breaker;
- audit log;
- model/provider configuration.

Avoid playful visuals here. Use dense tables, filters, status chips, and predictable forms.

## 7. AI UX States

| State | UI Behavior |
|---|---|
| Thinking | Streaming text or skeleton; show "searching approved lesson sources" |
| Answered | Answer + checkpoint citations + "Was this helpful?" |
| Out of scope | Refusal copy + "Send to teacher" |
| Rate limited | Friendly cap message + next available time |
| Safety flagged | Do not continue automated chat; notify teacher |
| Escalated | Show queue state and teacher response when ready |

## 8. Accessibility

- WCAG AA color contrast.
- Keyboard navigation for lesson player, quizzes, and editor.
- No information conveyed by color alone.
- Loading and error states for every remote action.
- Responsive from 360px width.

