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

## 9. Slice 1 Implementation

The current student experience implements the reference direction with EduOne-specific safeguards:

- desktop sidebar and mobile drawer with working route states;
- private XP/Level/Streak summary without a public leaderboard;
- next quest hero with the exact rule-based recommendation reason;
- STEAM radar with visible numeric values for all five axes;
- seven-day activity and personal badges;
- path cards with `completed`, `current`, and `locked` states;
- numeric recovery copy such as “cần thêm 16 điểm A”;
- visible “Giáo viên đã duyệt” state on published lessons.

Browser QA covers 1440x1000 desktop and 390x844 mobile. Both views have no horizontal overflow; the mobile drawer and dashboard-to-path navigation work.

## 10. Slice 2 Lesson Player

The implemented Lesson Player uses a focused learning workspace rather than dashboard cards:

- approved-content banner with duration and difficulty;
- four-step outline: three checkpoints plus quiz;
- stable progress bar and direct checkpoint navigation;
- visual Scratch block stack for each concept;
- learning objectives and concise takeaway states;
- layered hints revealed one at a time;
- accessible answer choices with selected, disabled, loading, wrong, and correct states;
- explicit XP/STEAM reward and newly unlocked node after first mastery.

Browser QA covers the complete checkpoint-to-quiz flow, wrong-answer retry, correct reward, path recalculation, 1440px desktop, and 390px mobile without horizontal overflow.

## 11. Slice 3 Tutor Drawer

The Tutor is an unframed right-side workspace on desktop and a full-screen layer on mobile:

- persistent 430px desktop width and 390px mobile QA target;
- visible “EduOne AI Tutor” identity and online state;
- approved-content trust strip above every conversation;
- student and assistant roles remain visually distinct;
- source chips name the exact approved checkpoint;
- Socratic mode is labelled “Gợi mở”;
- refusal copy avoids guessing and exposes teacher escalation;
- composer locks during SSE activity and recovers after `done`/`error`;
- no horizontal overflow or button-label overflow at 390x844.

The drawer overlays rather than resizing the lesson, preserving checkpoint context underneath. It does not show hidden prompts, model names, confidence numbers, or token/cost data to students.

## 12. Tutor Interactive Exercises (Slice 5)

The Tutor drawer gains a "Luyện tập" bar with four chips (Trắc nghiệm, Nối cột, Sắp thứ tự, Điền khuyết). A generated exercise renders as a card inline in the conversation, tagged "Bài luyện · không tính điểm" so a student never confuses practice with graded assessment.

| Type | Interaction | Accessibility |
|---|---|---|
| MCQ | tap an option | radio semantics, keyboard focus |
| Matching | drag a right-column chip into a left slot | click-to-select fallback; slots are keyboard-activatable |
| Ordering | drag to reorder | up/down buttons as the reliable path |
| Cloze | choose/type into each blank | native `select`/`input` per blank |

After "Kiểm tra": the card shows correct/partial result, the explanation, correct-answer highlighting, and a small `+EXP` chip. A correct item offers "Gửi giáo viên duyệt thành câu hỏi thật". States reuse the calm success/wrong palette; no shame copy, consistent with "safe to fail".

## 13. Teacher & Student Classes (Slice 6)

The teacher workspace is deliberately denser and calmer than the student dashboard:

- fixed teacher shell with class navigation, identity, sign-out, and realtime status;
- compact class/student/pending metrics followed by a scannable class grid;
- class creation uses native dependent controls: exact grade 1-12 first, then only valid GDPT 2018 subjects with their S/T/E/A/M tag;
- class detail keeps join code, roster, invite form, and pending decisions in one operational view;
- approval/rejection uses explicit actions and stable pending/loading states.

The student screen reuses the existing Student Shell and adds `Lớp học` navigation. It separates the three natural jobs: join by code, respond to teacher invitations, and inspect active classes. Subject, STEAM axis, grade, and teacher remain visible without introducing rankings or social pressure.

Both screens use backend-mediated Socket.IO membership updates. The UI refreshes after local actions and on cross-role events; it never promotes a membership locally before the server accepts the state transition.

## 14. Content Studio & Student Library (Slice 7)

The teacher Content Studio follows the operational design direction rather than the playful student dashboard:

- compact metrics for draft, review, and published volume;
- Skill Node cards group working and published versions without turning page bands into nested decoration;
- the creation modal uses native Skill Node/difficulty controls and a large source field with character count;
- the editor uses source-left/draft-right on desktop and stacked full-width bands on mobile;
- status chips make `DRAFT`, `IN_REVIEW`, `PUBLISHED`, and `ARCHIVED` visible in text, not color alone;
- published content is read-only; `Tạo phiên bản mới` preserves history before editing;
- publish is a deliberate icon+text action and success feedback names the student realtime impact.

The student library is lighter and action-oriented: approved count, available count, personal progress, then lesson cards. A locked published lesson remains visible but shows the exact recovery reason instead of an action link. This separates content availability from personal eligibility and makes the teacher-to-student impact legible.

Desktop and 390x844 mobile QA found no horizontal overflow. Long Vietnamese headings wrap, source text remains readable, cards keep stable dimensions, and route-local scroll reset prevents detail pages from opening midway down the content.
