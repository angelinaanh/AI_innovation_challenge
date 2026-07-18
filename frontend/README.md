# Frontend Module

## Purpose

React + JavaScript + Tailwind app for student, teacher, parent, and admin experiences.

## Inputs

- Supabase session and profile.
- Express API responses.
- Socket.IO events.
- SSE Tutor token streams.

## Outputs

- Student adaptive dashboard and learning UI.
- Teacher Content Studio and intervention UI.
- Admin cost/audit/configuration UI.

## Dependencies

- React
- Tailwind CSS
- Recharts
- Supabase browser client
- Socket.IO client

## Implemented Slice 1

| Route | Screen |
|---|---|
| `/login` | email/password and Google login |
| `/register` | student/teacher registration; student branch includes grade, date of birth, and guardian rule |
| `/forgot-password` | privacy-preserving password recovery request |
| `/reset-password` | recovery-session validated password update |
| `/auth/callback` | email/OAuth callback completion |
| `/onboarding` | profile bootstrap for confirmed email/OAuth users |
| `/student` | adaptive dashboard with quest, STEAM radar, XP, streak, badges, and path preview |
| `/student/path` | seven-node Scratch path with approved state and numeric unlock guidance |
| `/student/lessons/:skillNodeId` | checkpoint Lesson Player, Scratch block visualization, layered hints, and quiz |
| `/student/classes` | join by class code, respond to invitations, and see active classes |
| `/teacher` | teacher class workspace with live counts and class creation |
| `/teacher/classes/:classId` | join code, roster, invitation, and request decisions |

The interface is responsive from 390px mobile through desktop, has loading/error states, keyboard focus styles, and a working mobile navigation drawer. It calls only the Express API; no service key or OpenAI key is present in the browser bundle.

The Lesson Player supports direct checkpoint navigation, visible progress, MCQ radio semantics, disabled/submitting states, wrong-answer retry, first-correct reward feedback, and a link back to the recalculated path.

The same screen now includes a responsive AI Tutor drawer with persisted history, explicit AI/trust labels, POST-based SSE parsing, source chips, Socratic mode, refusal states, and teacher escalation. The drawer is 430px on desktop and full-screen on mobile without changing the underlying lesson layout.

`AuthProvider` owns the Supabase session and asks `GET /api/auth/me` for the trusted application account. Route guards handle onboarding, guardian-pending, inactive, unauthorized, and role-specific states. API and Socket.IO clients attach the short-lived access token; role and account status remain server decisions.

Teacher and student class screens use real Express/Supabase data. Membership Socket.IO events refresh invitations, pending counts, and rosters without trusting the browser to decide membership. Post-login `returnTo` is accepted only when it stays inside the authenticated role workspace, preventing a previous student path from sending a teacher to `/unauthorized`.

## Commands

```bash
npm install
npm test
npm run dev
npm run build
```

Local frontend URL: `http://127.0.0.1:5173/login`.

Vite pins React's automatic JSX runtime in `vite.config.js`. If the browser loads a blank `#root` after dependency or config changes, check for duplicate IPv4/IPv6 listeners with `lsof -nP -iTCP:5173 -sTCP:LISTEN`, stop only the stale process for this frontend, and restart with `npm run dev -- --force`.

## Limitations

- Frontend route guards improve UX; official RBAC is enforced by Express.
- Frontend does not call AI providers directly.
- Frontend does not store service role keys.
- Guardian email verification/consent delivery is not implemented yet; under-16 accounts fail closed as `PENDING`.
- Content Studio, teacher analytics, parent, and admin operational screens remain later slices; the teacher classroom workspace is implemented.
