# Pulse

Raw note → LinkedIn post in 30 seconds. Built for engineers who know what they've built but don't have time to turn it into content.

---

## What it does

1. You type what you built, learned, or shipped — raw and unpolished
2. Pulse evaluates if it's worth posting and why
3. It classifies the best format (standard post, carousel, or image post)
4. It generates a complete, ready-to-paste post in your voice
5. You review, edit if needed, and copy to LinkedIn

The human always posts. Pulse handles the writing.

---

## Why not just hire a social media manager?

| | Social media manager | Pulse |
|---|---|---|
| Understands JWT race conditions | Unlikely | Yes — trained on your technical background |
| Turns a note into a post | Hours | 30 seconds |
| Consistent during your vacation | No | Yes |
| Cost | €500–2,000/month | ~€0–5/month in API calls |
| Human reviews before posting | Depends | Always — you copy-paste manually |

**On the LinkedIn algorithm concern:** LinkedIn has never publicly penalized AI-assisted writing. They even ship their own AI writing assistant. What the algorithm actually penalizes is low-engagement generic content. Pulse addresses this by training on your specific voice, technical background, and real projects — not a generic template. Every post still goes through you before it goes live.

**On LinkedIn's Terms of Service:** LinkedIn's ToS prohibits automated bots that post without human involvement. Pulse is a writing tool — you read, edit, approve, then manually paste and post. There is no automation of the posting step.

---

## Stack

- **Next.js** (App Router) + TypeScript
- **Prisma 7** + Postgres (Neon) — external, persistent database
- **Tailwind CSS** + shadcn/ui — monochrome dark theme
- **LLM bridge (local dev)** → **freellmapi (production)** — see [LLM providers](#llm-providers)
- **Zod** — all API inputs validated
- **Vitest** — tests covering core logic, DB layer, and API routes

---

## Setup

```bash
# 1. Install
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Fill in DATABASE_URL and your chosen LLM provider config

# 3. Run database migrations
npx prisma migrate deploy

# 4. Start
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Profile context

Edit `../content-studio/PROFILE.md` and `../docs/linkedin-profile.md` to inject your voice and background into every LLM call. The more specific, the better the output.

### Migrating existing data

If you have posts in the old JSON store (`data/posts.json`):

```bash
npm run db:migrate-json
```

---

## LLM providers

Set `LLM_PROVIDER` in `.env.local` to choose the active provider:

- **`bridge`** (local dev) — drives claude.ai/chatgpt.com via your logged-in browser session through the `llm-web-bridge` sibling project (free, no API costs). Start that project separately, then set `LLM_BRIDGE_URL`, `LLM_BRIDGE_API_KEY`, `LLM_BRIDGE_PROVIDER`. If a bridge call fails for any reason, it automatically falls back to `freellmapi` when `FREELLM_BASE_URL`/`FREELLM_API_KEY` are configured.
- **`freellmapi`** (deployed/production) — a hosted OpenAI-compatible multi-provider proxy. Set `FREELLM_BASE_URL` and `FREELLM_API_KEY`. This is the only provider used on Render, since bridge requires a real Chrome window and doesn't work headless.

See `.env.example` for the full list of variables.

---

## Deploy to Render

A `render.yaml` is included. To deploy:

1. Create a Render account at [render.com](https://render.com)
2. Connect your repository
3. Render detects `render.yaml` automatically
4. Set `DATABASE_URL` (Neon Postgres) and `FREELLM_API_KEY` in the Render dashboard → Environment tab
5. Deploy

The database is external Neon Postgres, not stored on Render's disk — no ephemeral storage caveats.

---

## Development

```bash
npm run dev        # start dev server
npm run build      # production build
npm test           # run Vitest suite
npm run lint       # ESLint check
npx tsc --noEmit   # TypeScript check
```

---

## Features

- **Pipeline**: evaluate worthiness → classify format → generate post in one API call
- **Edit before save**: edit any generated post directly in the card before saving
- **Regenerate with tone**: re-run generation with casual / punchier / technical tone variants
- **Engagement tracker**: log impressions, likes, comments, and shares per post; see aggregate stats in Archive
- **Human-in-the-loop**: every post shows a "Reviewed" badge after the human edits it
- **Weekly planner**: schedule posts, fill gaps with AI-suggested trending topics
- **Rate limiting**: all LLM routes are rate-limited to prevent abuse
- **Pagination**: Archive loads 20 posts at a time with a "Load more" button
- **Error boundary**: app-level error boundary catches uncaught render errors
