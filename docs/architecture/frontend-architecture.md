# Frontend Architecture — React + JavaScript + Tailwind

## 1. Purpose

The frontend is a role-aware single-page app for students, teachers, parents, and admins. It should feel polished in the demo while staying simple enough to build quickly.

## 2. App Structure

```text
frontend/
  public/
  src/
    app/
      App.jsx
      router.jsx
      providers.jsx
    assets/
    components/
      ui/
      charts/
      feedback/
      layout/
    features/
      auth/
      student-dashboard/
      learning-path/
      lesson-player/
      tutor/
      teacher-studio/
      admin-console/
    lib/
      supabaseClient.js
      apiClient.js
      realtimeClient.js
    styles/
      index.css
    main.jsx
  tests/
```

## 3. Routing

| Route | Role | Screen |
|---|---|---|
| `/login` | public | Email/password and Google login |
| `/register` | public | Student registration only |
| `/forgot-password` | public | Password recovery request |
| `/reset-password` | recovery session | New password |
| `/auth/callback` | public callback | Email/OAuth completion |
| `/auth-error` | authenticated | Recoverable account-service error |
| `/onboarding` | authenticated, no profile | Student profile bootstrap |
| `/account-pending` | authenticated | Guardian consent pending |
| `/student` | student | Dashboard |
| `/student/path` | student | Learning Path |
| `/student/lessons/:skillNodeId` | student | Lesson Player |
| `/teacher` | teacher | Class Dashboard |
| `/teacher/studio` | teacher | Content Studio Jobs |
| `/teacher/studio/:jobId` | teacher | Review Workspace |
| `/teacher/escalations` | teacher | Tutor Escalations |
| `/admin` | admin | Admin Overview |
| `/admin/costs` | admin | AI Cost Control |

## 4. State Strategy

- Use Supabase Auth session as the source of identity.
- Use `AuthProvider` to hydrate the trusted application account from `/api/auth/me`.
- Use server responses as the source of application state.
- Keep local UI state small: selected tab, modal state, draft form fields.
- Add React Query later if API state grows; do not over-engineer on day one.

## 5. Component System

Core UI components:

- `Button`, `IconButton`, `Tooltip`
- `Card`, `StatusChip`, `MetricTile`
- `ProgressBar`, `LevelBadge`, `StreakDots`
- `RadarChart`, `SkillNodeMap`, `Heatmap`
- `LessonCheckpoint`, `QuizCard`, `HintPanel`
- `TutorDrawer`, `CitationList`, `EscalationBanner`
- `ReviewPane`, `SourcePane`, `PublishToolbar`

## 6. Realtime Client

Use two channels:

- SSE for AI Tutor token streaming.
- Socket.IO for app events:
  - content job status changed;
  - teacher escalation received;
  - teacher response posted;
  - cost circuit breaker tripped;
  - class risk queue updated.

Supabase Realtime can be used later for direct DB subscription, but backend-mediated Socket.IO is easier to secure and demo.

## 7. Frontend Boundaries

Frontend may:

- render role-specific screens;
- call backend APIs;
- subscribe to realtime events;
- optimistically show UI pending states.

Frontend must not:

- decide RBAC permissions on its own;
- select DRAFT lessons for students;
- calculate official STEAM score;
- call AI providers directly;
- store service role keys.

## 8. Authentication Boundary

- The browser may hold only the Supabase publishable key and short-lived user session.
- API and Socket.IO clients attach the access token automatically.
- Public registration never exposes a role selector and always bootstraps `student` on the backend.
- A missing profile routes to onboarding; `PENDING` and inactive statuses route to blocking account-state screens.
- Local sign-out clears the browser session and protected routes immediately return to login.
- Frontend role guards are navigation UX only; Express repeats every role/status decision.

## 9. Build Status

Implemented:

1. Real Supabase Auth, recovery, onboarding, protected routes, and account states.
2. Student dashboard backed by authenticated Supabase data.
3. Learning path with explainable reasons.
4. Lesson Player and Tutor drawer.

Next role-facing slices are Teacher Studio, parent summary/linking, and Admin cost/user controls.
