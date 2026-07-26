# LinkedIn Content System — Agent Briefing

> This document is the single source of truth for building a LinkedIn content generation system.
> Read this fully before asking any questions or generating any files.
> At the end of this document you will find a list of open questions — ask them all before proceeding.

---

## 1. Who This Is For

A software engineer who has been inactive on LinkedIn for a long time. The account exists, has ~200 connections, a professional profile, but zero activity. The goal is to build a **repeatable, streamlined content system** — version-controlled, prompt-driven, and optimized so that going from "I have an idea" to "ready-to-post content" is fast and consistent.

---

## 2. Goals

- **Primary:** Build visibility and recognition in the tech space (personal brand)
- **Secondary (natural outcomes):** Job/internship interest, networking, freelance inquiries
- **Posting frequency:** Once per week minimum
- **Tone target:** Thoughtful, confident, minimal — not hype-y or cringe

---

## 3. Aesthetic & Brand Identity

This is non-negotiable. Every piece of generated content — copy, image prompts, carousel designs — must align with this identity:

- **Look:** Clean, minimal, monochrome, prestigious, expensive
- **Fonts:** Modern, editorial — think sharp sans-serifs (e.g. Inter, Helvetica Neue, Space Grotesk, Monument Extended)
- **Color palette:** Black, white, off-white, dark grays — no loud colors unless used as a single precise accent
- **Vibe references:** High-end tech / design studios, not startup cheerfulness
- **Images:** Should feel like editorial tech photography or generated abstract visuals — not stock photo smiles
- **Carousels:** Structured like a designed slide deck — tight grid, consistent margins, minimal text per slide

> ⚠️ The agent must never suggest generic, colorful, or "motivational poster" aesthetics. When in doubt, go darker, quieter, and more editorial.

---

## 4. Content Backlog (Mines to Dig From)

The user has existing material that was never posted. All of it is fair game:

- GitHub projects (personal + academic)
- Hackathon participations (results don't matter — the story does)
- Certifications completed
- Freelance work (anonymized if needed)
- Blog posts written
- Academic achievements / standout projects
- Anything learned deeply that could help someone else

**Retroactive posts are fully intentional** — frame them as "something I never shared" or "looking back at X" — this is authentic, not outdated.

---

## 5. Content Types to Support

The system must handle all of the following:

### 5a. Standard Post
- Text-only or text + single image
- 150–300 words
- Hook → Story/Insight → Takeaway → CTA

### 5b. Carousel Post
- 4–8 slides
- Slide 1: Bold hook / title
- Slides 2–N: One idea per slide, minimal text
- Last slide: CTA + handle/name
- Output: Slide-by-slide copy + layout description + image generation prompt per slide

### 5c. Image Post
- Single strong visual with minimal caption
- Output: Caption copy + detailed AI image generation prompt (style-consistent with brand identity above)

---

## 6. The Core Flow (Idea → Post)

When given a raw idea or event, the system should:

1. **Classify** the content type (built something / learned something / opinion / tutorial)
2. **Ask clarifying questions** if the input is vague (what was the outcome? what did you learn? who's the audience?)
3. **Generate** the post in the appropriate format
4. **Suggest** whether an image or carousel would improve it
5. **Output** an AI image generation prompt if visuals are needed (Midjourney / DALL-E style, matching the brand aesthetic)
6. **Optionally suggest** hashtags (3–5 max, relevant not spammy)

---

## 7. Repo Structure (Suggested — Agent Should Refine)

```
linkedin-content-system/
├── README.md                  # How to use the system
├── PROFILE.md                 # Personal brand context (filled by user)
├── BACKLOG.md                 # Running list of past events / ideas to post about
├── POSTED.md                  # Archive of what's been published
│
├── prompts/
│   ├── post-generator.md      # Main prompt: idea → post
│   ├── carousel-generator.md  # Prompt: idea → carousel copy + layout
│   ├── image-prompt.md        # Prompt: concept → AI image generation prompt
│   └── repurpose.md           # Prompt: blog/project → LinkedIn post
│
├── templates/
│   ├── standard-post.md       # Reusable structure for a standard post
│   ├── carousel-slide.md      # Single slide template
│   └── image-caption.md       # Caption + image prompt template
│
├── examples/
│   ├── example-post-01.md
│   └── example-carousel-01.md
│
└── SKILL.md                   # Agent skill file — tells the agent what this repo does
```

---

## 8. SKILL.md Purpose

The `SKILL.md` at the root should:
- Describe what this system does
- Tell the agent how to use each prompt file
- Define the brand aesthetic as a constraint
- List the content types and when to use each
- Include the core post-generation flow as a step-by-step instruction

---

## 9. What the Agent Should Build (Deliverables)

Once context is complete, generate the following files:

1. `SKILL.md` — the master agent instruction file for this repo
2. `PROFILE.md` — template with placeholders for the user to fill in
3. `BACKLOG.md` — template for logging past events
4. `prompts/post-generator.md` — the main content generation prompt
5. `prompts/carousel-generator.md`
6. `prompts/image-prompt.md`
7. `templates/standard-post.md`
8. `templates/carousel-slide.md`
9. `README.md` — explains the whole system clearly

---

## 10. Open Questions for the Agent to Ask Before Starting

Ask the user all of the following before generating any files:

1. **What is your name and current role/title?** (for PROFILE.md and post signatures)
2. **What is your LinkedIn handle or URL?** (for carousel CTAs)
3. **What specific tech stack or domains do you work in?** (e.g. backend, ML, web, systems — this shapes post framing)
4. **Do you have a personal website or blog?** If yes, URL?
5. **What is your writing voice preference?** Options: (a) First-person, raw and honest / (b) Clean and professional / (c) Somewhere in between
6. **For image generation — which AI tool will you use?** Midjourney, DALL-E, Stable Diffusion, or other? (affects prompt syntax)
7. **Do you want posts to ever mention your location / country?** Some people use this for local visibility.
8. **Any topics or content styles you absolutely want to avoid?** (e.g. no hustle culture, no politics, no personal life)
9. **Do you have any existing posts you liked — from yourself or others — that capture the vibe you want?** Share links or describe them.
10. **What tools are you using in your IDE?** (e.g. Cursor, Windsurf, Copilot — so the SKILL.md is formatted correctly for your agent)

---

> Once the user answers the above, proceed immediately to generating all files listed in Section 9.
> Do not ask further questions unless something is critically ambiguous.
> Optimize for shipping fast and iterating.