# LinkedIn Post Generator

Turn raw notes about what you built, learned, or shipped into polished, on-brand LinkedIn posts — with a human always reviewing before anything goes live.

This repo contains two independent systems that share the same brand/voice source of truth:

## `web/` — Pulse (primary)

The automated product: a Next.js app with an LLM-driven pipeline (evaluate → classify → generate), Postgres-backed persistence, an engagement tracker, and a weekly content planner. This is the intended day-to-day tool.

See [`web/README.md`](web/README.md) for setup and architecture.

## `content-studio/` — manual fallback

A version-controlled, prompt-driven, agent-assisted workflow with no infrastructure required — copy generated markdown into LinkedIn by hand. Useful when you want full manual control over publishing, or the web app isn't available.

See [`content-studio/README.md`](content-studio/README.md) for details.

## `docs/`

Brand and positioning source-of-truth briefs. Both `web/` and `content-studio/` are expected to stay consistent with these:

- [`docs/linkedin-profile.md`](docs/linkedin-profile.md) — voice, background, and profile context injected into every generated post
- [`docs/linkedin-agent-brief.md`](docs/linkedin-agent-brief.md) — historical point-in-time brief on the original agent design
