# content-studio — Quick Start Guide

A version-controlled, prompt-driven system for generating high-quality LinkedIn content. Go from idea to polished post in minutes.

This is the manual, no-infrastructure counterpart to the `web/` app in this repo — a fully agent-assisted workflow for when you want full manual control over publishing, or the web app isn't available. See the [root README](../README.md) for how the two systems relate.

---

## What This System Does

This repo contains everything needed to build and maintain a consistent LinkedIn presence:

- **Reusable prompts** for generating posts, carousels, and image prompts
- **Templates** for quick reference when writing
- **Your profile context** (PROFILE.md) so every post is on-brand
- **Content backlog** (BACKLOG.md) to keep ideas organized
- **Publishing archive** (POSTED.md) to track what's already live
- **Brand guidelines** embedded throughout — minimal, clean, editorial, no hype

**Posting target:** 1 post per week minimum

**Output:** All content in markdown, ready to copy/paste into LinkedIn

---

## Getting Started

### 1. Fill in Your Profile

Open `PROFILE.md` and complete:
- Your name, role, LinkedIn URL
- Tech stack and expertise areas
- Writing voice preference (clean + professional)
- Topics to avoid (hustle culture, politics, personal life)
- Links to your personal website/portfolio (optional)

This file is referenced for every piece of generated content.

### 2. Prime Your Backlog

Open `BACKLOG.md` and brain-dump:
- 4–6 ideas or past events you could post about
- Keep it unstructured at first — just capture them
- Use the template format when ready to develop

**Good backlog ideas:**
- GitHub projects or repositories
- Hackathon participation or results
- Certifications or courses completed
- Freelance work (anonymized)
- Lessons learned from past projects
- Technical problems you solved
- System architecture decisions you made

### 3. Generate Your First Post

**Choose your idea format:**

| Format | When to Use | How |
|--------|------------|-----|
| **Standard Post** | Single insight, quick lesson, announcement | Use `prompts/post-generator.md` |
| **Carousel** | Tutorial, process, framework, multi-part idea | Use `prompts/carousel-generator.md` |
| **Image Post** | Visual concept, design idea, technical diagram | Use `prompts/image-prompt.md` |

**Steps:**
1. Pick an idea from BACKLOG.md
2. Provide the idea + any context to the AI agent
3. Agent generates content using the appropriate prompt
4. Review markdown in `examples/`
5. Copy to LinkedIn, make final polish, and post
6. Move to POSTED.md with date and any performance notes

---

## File Structure

```
content-studio/
├── SKILL.md                  # Agent instruction file (read by AI)
├── README.md                 # This file
├── PROFILE.md                # Your personal brand context
├── BACKLOG.md                # Ideas waiting to be developed
├── POSTED.md                 # Archive of published content
│
├── prompts/
│   ├── post-generator.md     # Generate standard posts
│   ├── carousel-generator.md # Generate carousel posts
│   └── image-prompt.md       # Generate AI image generation prompts
│
├── templates/
│   ├── standard-post.md      # Quick post template
│   └── carousel-slide.md     # Carousel slide reference
│
└── examples/
    └── [Generated posts go here]
```

---

## Core Workflow

### From Idea to Post (5 Steps)

1. **Capture** — Add idea to BACKLOG.md with context
2. **Generate** — Use appropriate prompt to create content
3. **Review** — Read markdown, consider visual enhancements
4. **Polish** — Make any final tone/clarity tweaks
5. **Post** — Copy to LinkedIn, publish, then archive to POSTED.md

### Example Workflow

```
BACKLOG.md: "[ ] Built a real-time ML inference pipeline on AWS Lambda"
      ↓
Ask agent: "Generate a standard post about this using post-generator.md"
      ↓
Agent creates: examples/post-ml-inference-pipeline.md
      ↓
You review → consider if image would help
      ↓
Copy to LinkedIn → Post → Add to POSTED.md with date
```

---

## Post Types Explained

### Standard Post (150–300 words)

**Structure:**
- **Hook:** Make them stop scrolling (1–3 sentences)
- **Body:** Tell the story or share the insight (2–3 paragraphs)
- **Takeaway:** Principle or lesson (1–2 sentences)
- **CTA:** Invite discussion or link (1 sentence)

**When to use:**
- Quick insight or lesson learned
- Project completion announcement
- Technical realization or breakthrough
- Opinion or perspective

**Example:** "Shipping ML inference at sub-100ms latency taught me that scale and speed aren't contradictions — they're architecture problems."

---

### Carousel Post (4–8 slides)

**Structure:**
- **Slide 1:** Bold hook or title (1–2 lines)
- **Slides 2–N:** One idea per slide (minimal text)
- **Last slide:** CTA or reflection

**When to use:**
- Tutorial or step-by-step process
- Framework or system breakdown
- List of principles or patterns
- Multi-part idea or opinion

**Example:** "5 Principles of Scalable System Design" — one principle per slide

---

### Image Post

**Structure:**
- **Concept visual:** Strong, minimal, editorial
- **Caption:** Minimal text (1–3 sentences)

**When to use:**
- Visual breakthrough or concept
- Design or diagram
- Abstract visual that's worth its own focus

**Aesthetic:**
- Clean, minimal, monochrome
- Editorial tech photography feel
- No stock photos or cheerful vibes
- Professional and expensive

---

## Brand Guidelines

**Remember for every post:**

✓ **Do:**
- Use clean, professional tone
- Share authentic lessons and insights
- Focus on technical depth
- Use specific examples and numbers
- Lead with the most interesting part

✗ **Don't:**
- Use hustle culture language ("no days off," "grinding," etc.)
- Mention your location (working abroad strategy)
- Include politics or personal life details
- Use generic motivational language
- Use colorful or cheerful aesthetics

---

## Image Generation (Gemini)

The system uses **Gemini** for AI-generated images. Here's how:

1. **Agent generates prompt** using `prompts/image-prompt.md`
2. **You copy prompt** into Gemini's image generation interface
3. **You download result** and attach to LinkedIn post

**Tips:**
- Prompts are designed for natural language input (not Midjourney syntax)
- All prompts emphasize minimal, clean, editorial aesthetic
- If result is too colorful/cheerful, regenerate with: "Make it more sophisticated and editorial, less startup-y"
- Save good prompts — reuse structure for similar concepts

---

## Posting Cadence

**Target:** 1 post per week minimum

**Strategy:**
1. Keep 4–6 ideas ready in BACKLOG.md
2. Generate content in batches (Wednesday?) for Saturday posting
3. Schedule or post manually, but track in POSTED.md
4. Adjust based on engagement (if you track it)

**Batching benefit:** 30 minutes of content creation = 4–6 weeks of ideas queued

---

## Updating Your Profile

As things change, update PROFILE.md:
- New role or achievement? Add it
- New tech stack? Update expertise areas
- New website or blog? Link it
- New direction or focus? Adjust content pillars

**Everything flows from PROFILE.md**, so keeping it current keeps your content aligned.

---

## Archiving Posts

After you publish, move the markdown to `POSTED.md` and add:

```markdown
### [Date] — [Post Title]
- **Type:** Standard / Carousel / Image
- **Topic:** [Brief category]
- **Link:** [LinkedIn post URL, if available]
- **Notes:** [Optional performance observations]
```

This creates a record and helps you spot topic patterns over time.

---

## Pro Tips

1. **Batch idea capture** — When you have 3+ ideas, batch-generate 2–3 posts at once
2. **Carousels get more engagement** — Use them for tutorials or frameworks
3. **Lead with specificity** — "Built a 50-line script that..." works better than "Built something cool..."
4. **Use numbers** — "3 mistakes I made," "5 principles," etc.
5. **Archive everything** — POSTED.md becomes your portfolio over time
6. **Iterate on your backlog** — Combine small ideas or break big ones into series
7. **Read aloud** — Check tone and rhythm before posting
8. **Stay consistent** — One post per week is better than 4 posts in one week

---

## FAQ

**Q: Can I post retroactively (old projects)?**
A: Yes! Frame it as "never shared this" or "looking back at..." — it's authentic, not outdated.

**Q: How long should posts be?**
A: Standard posts: 150–300 words. Carousel slides: 3–5 lines each max. Shorter usually better.

**Q: Should I use hashtags?**
A: 3–5 max, topic-focused (not personal branding spam). Examples: #SystemsEngineering, #CloudArchitecture

**Q: Can I edit PROFILE.md?**
A: Yes, frequently. It's your north star — update it as your role, tech stack, or focus shifts.

**Q: What if I run out of ideas?**
A: Mine BACKLOG.md categories: projects, lessons learned, certifications, freelance work, academic achievements, deep dives.

**Q: Do posts need images?**
A: No. Strong voice stands alone. Only add images if they strengthen the post meaningfully.

---

## Support

For help using this system:
- Refer to `SKILL.md` for agent instructions
- Check `templates/` for quick structural reference
- Look at `examples/` for tone and structure examples
- Update `PROFILE.md` if your brand context shifts

---

**Now, head to PROFILE.md and fill in your context. Then capture 4–6 ideas in BACKLOG.md. You're ready to start posting.**

