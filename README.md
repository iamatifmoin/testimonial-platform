# Testimonial-Platform

A testimonial collection and display platform. Businesses collect testimonials
from customers, review them on a dashboard, and showcase approved ones publicly
via a wall page and an embeddable widget.


### Setup

```bash
git clone https://github.com/iamatifmoin/testimonial-platform.git
npm install
```

### Environment

Copy `backend/.env.example` to `backend/.env` and fill in the required values:

```bash
PORT=3001
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Notes:
- `SUPABASE_URL` is required.
- Either `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_ANON_KEY` must be present.
- `GEMINI_API_KEY` is optional. Without it, submissions still work and
  sentiment stays `null`.

### Required Supabase table

Create `public.testimonials` in Supabase with:

```sql
create table if not exists public.testimonials (
  id text primary key,
  name text not null,
  email text not null,
  company text not null default '',
  text text not null,
  rating integer not null check (rating between 1 and 5),
  photo_url text default null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  sentiment text default null,
  created_at timestamptz not null default timezone('utc', now())
);
```

### Start the app

```bash
npm run dev
```

Available surfaces:
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:3001](http://localhost:3001)
- Dashboard: [http://localhost:5173/dashboard](http://localhost:5173/dashboard)
- Wall: [http://localhost:5173/wall](http://localhost:5173/wall)

### Build the widget

```bash
npm run build:widget
```

You can also run:

```bash
npm run build -w widget
```

Both produce `widget/dist/widget.js`, which the backend serves from
`GET /widget.js`.

### Test the embed

For local testing, open the repo-root `demo.html` directly in a browser after
starting the backend. When opened as a local file, it falls back to
`http://localhost:3001`.

For deployed usage, open `/demo.html` on the frontend domain. The production
frontend serves `frontend/public/demo.html`, which loads `/widget.js` and uses
same-origin rewrites to reach the backend.

## Core user flow

1. Visit `http://localhost:5173` and submit a testimonial.
2. Visit `http://localhost:5173/dashboard` and review the pending entry.
3. Approve or reject it from the dashboard.
4. Visit `http://localhost:5173/wall` to see approved testimonials publicly.
5. Open `http://localhost:5173/demo.html` to validate the embeddable widget.

## API reference

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/testimonials` | Submit a testimonial as `multipart/form-data` |
| `GET` | `/api/testimonials` | List testimonials with optional `status`, `page`, and `limit` |
| `GET` | `/api/testimonials/public` | List approved testimonials for the wall and widget |
| `PATCH` | `/api/testimonials/:id/status` | Change status to `approved` or `rejected` |
| `DELETE` | `/api/testimonials/:id` | Delete a testimonial |
| `GET` | `/widget.js` | Serve the built widget bundle |
| `GET` | `/uploads/:filename` | Serve locally uploaded testimonial photos |

### Submission fields

`POST /api/testimonials` accepts:
- `name` - required, 1 to 100 chars
- `email` - required, valid email
- `company` - optional
- `text` - required, 10 to 2000 chars
- `rating` - required integer from 1 to 5
- `photo` - optional `jpeg`, `png`, `webp`, or `gif`, max 5 MB

## Widget embed

```html
<script
  src="https://your-frontend-domain/widget.js"
  data-api-url="https://your-frontend-domain"
  data-accent="#6366f1"
  data-layout="grid"
  data-limit="6"
  data-title="What our customers say"
  data-theme="light">
</script>
```

For local development, use:

```html
<script
  src="http://localhost:3001/widget.js"
  data-api-url="http://localhost:3001"
  data-accent="#6366f1"
  data-layout="grid"
  data-limit="6"
  data-title="What our customers say"
  data-theme="light">
</script>
```

Supported widget options:
- `data-api-url` - required backend origin
- `data-accent` - accent color
- `data-layout` - `grid`, `list`, or `carousel`
- `data-limit` - number of testimonials to fetch
- `data-title` - widget heading
- `data-theme` - `light` or `dark`

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + Vite + Tailwind CSS | Fast iteration and simple client routing |
| Backend | Node.js + Express | Small API surface and predictable local setup |
| Data | Supabase REST API | Managed persistence without building a custom DB layer |
| Widget | Vanilla JS IIFE + Shadow DOM | Easy embed with style isolation |
| File uploads | Multer + local disk storage | Simple local development path |
| AI | Google Gemini 1.5 Flash | Lightweight sentiment labeling |

## What's built

### P0 - Core (complete)
- Testimonial submission form with name, email, company, rating, text, and an
  optional photo
- Backend API with Express
- Moderation dashboard to approve, reject, and delete testimonials
- Public wall for approved testimonials

### P1 - Enhanced (complete)
- Embeddable widget served from `GET /widget.js`
- Duplicate submission detection by email plus normalized text preview
- Dashboard pagination and wall load-more flow
- Loading, empty, and error states across the UI
- Client-side photo validation for type and size

### P2 - Stretch (complete)
- AI sentiment analysis with Gemini 1.5 Flash
- Sentiment badges visible in the moderation dashboard
- Widget layout modes: `grid`, `list`, and `carousel`