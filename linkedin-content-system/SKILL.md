# LinkedIn Content System — Agent Skill File

This is the operational guide for the LinkedIn content generation system. Use this whenever the user asks to generate content for LinkedIn.

## What This System Does

This repo contains a **repeatable, version-controlled workflow** for generating high-quality LinkedIn content from raw ideas. It's designed for a postgraduate software engineer with expertise in full-stack development, systems engineering, ML/AI integration, DevOps, and cloud platforms. The aesthetic is minimal, clean, and editorial—not motivational or generic.

---

## Brand Constraints (Non-Negotiable)

**Every piece of content must align with these:**

- **Aesthetic:** Clean, minimal, monochrome, prestigious, expensive
- **Fonts in design:** Modern sans-serifs (Inter, Helvetica Neue, Space Grotesk)
- **Color palette:** Black, white, off-white, dark grays — single precise accent only if needed
- **Vibe:** High-end tech/design studios, not startup cheerfulness
- **Images:** Editorial tech photography feel or abstract visuals — no stock smiles
- **Tone:** Clean, professional, thoughtful, confident — never hype-y or cringey
- **Topics to avoid:** No hustle culture, no politics, no personal life details
- **Location:** Do not mention location (working abroad strategy)

---

## Content Types & When to Use

### Standard Post
- **Best for:** Quick insights, lessons learned, project completion announcements
- **Format:** 150–300 words, text + optional single image
- **Structure:** Hook → Story/Insight → Takeaway → CTA
- **Use:** `prompts/post-generator.md`

### Carousel Post
- **Best for:** Tutorials, step-by-step processes, multi-part insights, complex ideas
- **Format:** 4–8 slides, minimal text per slide
- **Structure:** Slide 1 (hook), Slides 2–N (one idea each), Last slide (CTA)
- **Output:** Copy per slide + layout notes + image prompts
- **Use:** `prompts/carousel-generator.md`

### Image Post
- **Best for:** Concept launches, visual breakthroughs, design-heavy ideas
- **Format:** Single strong visual + minimal caption
- **Output:** Caption + detailed AI image prompt
- **Use:** `prompts/image-prompt.md`

---

## Core Post-Generation Flow

**When given a raw idea or event:**

1. **Classify** → Is this a "built something," "learned something," "opinion," or "tutorial"?
2. **Clarify** → If vague, ask: outcome? Learning? Target audience?
3. **Generate** → Create post in appropriate format using the matching prompt
4. **Suggest visuals** → Recommend image or carousel enhancement if it improves impact
5. **Image prompt** → Use `prompts/image-prompt.md` to generate AI image prompt (Gemini syntax)
6. **Hashtags** → Optionally suggest 3–5 relevant hashtags (no spam)
7. **Output** → Standard markdown file in `examples/` folder for user to review and post manually

---

## Key Files & How to Use Them

| File | Purpose | When to Use |
|------|---------|------------|
| `PROFILE.md` | User context (name, role, tech stack, URL, voice) | Reference before generating any content |
| `BACKLOG.md` | Running list of past events / ideas | Check here before generating new posts |
| `POSTED.md` | Archive of published posts with dates | Avoid repeating topics; track posting cadence |
| `prompts/post-generator.md` | Main prompt for single posts | Use for standard + image posts |
| `prompts/carousel-generator.md` | Prompt for carousel generation | Use for multi-slide posts |
| `prompts/image-prompt.md` | Converts static ideas to AI image prompts | Use when visuals are needed |
| `templates/standard-post.md` | Reusable structure for quick reference | Copy and fill in when generating |
| `templates/carousel-slide.md` | Single slide template | Reference when structuring carousel content |
| `examples/` | Sample posts and carousels | Study tone, pacing, structure |

---

## How to Generate Content

### Quick Start (Single Post)

1. User provides idea or raw input
2. You read `PROFILE.md` to understand context
3. You call the prompt from `prompts/post-generator.md` with the idea as input
4. You generate post in `examples/` folder in markdown
5. User reviews, adjusts, posts manually

### Carousel Generation

1. User provides topic or idea suitable for carousel format
2. You call `prompts/carousel-generator.md`
3. Generate slide-by-slide copy + layout + image prompts
4. Output as markdown with clear slide breaks
5. User reviews and publishes

### Image Generation

1. User describes concept or visual idea
2. You call `prompts/image-prompt.md` with the concept
3. Generate detailed prompt in **Gemini-compatible syntax** (user will paste into Gemini web interface)
4. User generates image manually in Gemini, downloads, and attaches to post

---

## Important Notes for Agent

- **Image tool:** User uses Gemini (web-based). Generate prompts in descriptive, natural language (not Midjourney syntax). Assume user will paste prompt manually.
- **No location data:** Posts should never reference where the user is located.
- **Tech focus:** User works across full-stack, systems, ML/AI, DevOps, cloud. Tailor post framing to this versatility.
- **Posting frequency:** Aim for minimum 1 post per week. Use `BACKLOG.md` to prep ideas in advance.
- **Archive as you go:** After user posts, move content to `POSTED.md` with date and performance notes if available.

---

## Aesthetic Quick Ref (For Image Prompts)

When generating image prompts, reference this language:

> "Clean, minimal design with black/white/dark gray palette, editorial tech photography style, high-end minimal aesthetic, no colorful elements, sharp modern sans-serif typography, prestigious and expensive feel, think high-end tech studio not startup, abstract geometric or technical focus, professional not cheerful, luxury minimalist design"

---

## Agent Instructions Summary

1. **Always** check PROFILE.md and BACKLOG.md before generating
2. **Never** suggest colorful, motivational, or stock photo aesthetics
3. **Always** frame content as clean, professional, and technically focused
4. **Generate** image prompts in natural language (for Gemini, not Midjourney)
5. **Archive** posts to POSTED.md after publishing
6. **Suggest** carousels for complex topics; single posts for quick insights
7. **Avoid** hustle culture, politics, personal life, and location mentions
8. **Output** content as markdown files for review before posting

---

## File Structure

```
linkedin-content-system/
├── SKILL.md                  # This file
├── README.md                 # System overview & quick start
├── PROFILE.md                # Personal context (user fills in)
├── BACKLOG.md                # Ideas waiting to be developed
├── POSTED.md                 # Archive of published content
│
├── prompts/
│   ├── post-generator.md     # Standard post prompt
│   ├── carousel-generator.md # Multi-slide carousel prompt
│   └── image-prompt.md       # AI image generation prompt
│
├── templates/
│   ├── standard-post.md      # Quick post template
│   └── carousel-slide.md     # Single slide template
│
└── examples/
    ├── example-post-01.md    # Sample standard post
    └── example-carousel-01.md # Sample carousel
```

