# AGENTS.md - Codex Instructions

This repo is a testimonial platform with three user-facing surfaces: the
submission form, the moderation dashboard, and the public wall. There is also a
standalone embeddable widget built from the `widget/` workspace.

## Repo structure

- `backend/` - Express API, serves uploads and `GET /widget.js`
- `frontend/` - React 18 + Vite app
- `widget/` - vanilla JS widget bundle built with Vite
- `demo.html` - local static page that exercises the widget embed

## Running

```bash
npm install
npm run dev
```

Default ports:
- Backend: `3001`
- Frontend: `5173`

Widget build:

```bash
npm run build:widget
```

Equivalent direct workspace command:

```bash
npm run build -w widget
```

## Environment

Backend configuration lives in `backend/.env`.

Required:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_ANON_KEY`

Optional:
- `PORT`
- `FRONTEND_URL`
- `GEMINI_API_KEY`

## Implementation notes

- The backend does not talk to SQLite. Data access goes through Supabase REST in
  `backend/src/db/db.js`.
- The expected table is `public.testimonials`; schema guidance is in
  [README.md](D:/projects/saleshandy/README.md).
- File uploads use `multer` disk storage and write to `backend/uploads/`.
- Sentiment analysis is best-effort and asynchronous. A failed Gemini call must
  not block submission success.
- The frontend uses React Router with routes for `/`, `/dashboard`, and `/wall`.
- The widget must remain framework-free and safe to embed on arbitrary host
  pages.

## Code conventions

- React components are functional components with hooks.
- Frontend API calls go through `frontend/src/api/client.js`.
- Backend route errors should respond with `{ error: string }`.
- Widget rendering must escape user content before injecting HTML.
- Keep the widget self-contained; do not add React or other runtime
  dependencies there.

## What not to change casually

- Do not add dashboard auth unless the product requirements change.
- Do not switch the widget away from the script-tag embed model without a clear
  product reason.
- Do not assume uploads are durable beyond local disk unless storage is changed.
- Do not document or implement SQLite for this repo unless the backend is
  actually migrated.

## Core verification flow

1. Submit a testimonial from `/`.
2. Confirm it appears in `/dashboard` as pending.
3. Approve or reject it.
4. Confirm approved entries appear in `/wall`.
5. Build the widget and validate it through `demo.html`.
