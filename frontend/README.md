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
| `/student` | adaptive dashboard with quest, STEAM radar, XP, streak, badges, and path preview |
| `/student/path` | seven-node Scratch path with approved state and numeric unlock guidance |

The interface is responsive from 390px mobile through desktop, has loading/error states, keyboard focus styles, and a working mobile navigation drawer. It calls only the Express API; no service key or OpenAI key is present in the browser bundle.

## Commands

```bash
npm install
npm run dev
npm run build
```

Local frontend URL: `http://127.0.0.1:5173/student`.

## Limitations

- Frontend does not enforce official RBAC.
- Frontend does not call AI providers directly.
- Frontend does not store service role keys.
