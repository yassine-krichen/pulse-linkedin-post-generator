# Pulse web app

This directory holds the Pulse Next.js application. Architecture, setup, configuration and the license are in the [repository README](../README.md).

```bash
npm install
cp .env.example .env.local
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Tests: `npm run test:unit` (no database) and `npm run test:integration` (needs `DATABASE_URL`).

Voice and profile context for the LLM calls is read from `../content-studio/PROFILE.md` and `../docs/linkedin-profile.md`. Replace both with your own before use.

`render.yaml` describes the Render web service. Set `DATABASE_URL`, `FREELLM_API_KEY` and `APP_PASSWORD` in the Render dashboard.
