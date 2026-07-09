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
- **Prisma 7** + SQLite — zero-config local persistence
- **Tailwind CSS** + shadcn/ui — monochrome dark theme
- **Gemini** → **Groq** → **Ollama** with automatic key rotation and fallback
- **Zod** — all API inputs validated
- **Vitest** — 34 tests covering core logic, DB layer, and API routes

---

## Setup

```bash
# 1. Install
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Fill in at least one Gemini or Groq API key

# 3. Run database migrations
npx prisma migrate deploy

# 4. Start
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Profile context

Edit `../linkedin-content-system/PROFILE.md` and `../LinkedIn_profile.md` to inject your voice and background into every LLM call. The more specific, the better the output.

### Migrating existing data

If you have posts in the old JSON store (`data/posts.json`):

```bash
npm run db:migrate-json
```

---

## LLM providers

The app tries providers in order: Gemini keys → Groq keys → Ollama (local fallback).

Add multiple Gemini and Groq API keys to rotate through rate limits automatically. All keys are configured in `.env.local` — see `.env.example` for the full list.

---

## Deploy to Render

A `render.yaml` is included. To deploy:

1. Create a Render account at [render.com](https://render.com)
2. Connect your repository
3. Render detects `render.yaml` automatically
4. Add your API keys in the Render dashboard → Environment tab
5. Deploy

**Free tier note:** The Render free tier uses ephemeral storage — the SQLite database resets on each redeploy. For a persistent deployment, uncomment the disk block in `render.yaml` (requires Render Starter plan, ~$7/month).

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
