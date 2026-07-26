# Template: Carousel Slide

Use this template as a reference when structuring carousel slides. Each slide should feel distinct but maintain consistency across the deck.

---

## Slide Structure

Each carousel slide should follow this pattern:

```markdown
### SLIDE [N]: [Slide Title/Concept]

**Main Text/Title:** [Headline — 1–2 lines, bold or not]

**Key Points or Body:**
- [Point 1]
- [Point 2]
- [Point 3]

**Layout Notes:** [Describe visual composition, positioning, spacing]

**Visual Approach:** [Type of visual: Diagram / Icon / Text-focused / Screenshot / Illustration]

**Design Direction:** [How this slide fits the brand — minimal, clean, editorial, etc.]

---
```

---

## Full Carousel Slide Example

**Topic: "5 Principles of Scalable System Design"**

```markdown
### SLIDE 1: Hook

**Main Text:**
Building scalable systems isn't about power — it's about thinking.

Here are 5 principles that changed how I architect.

**Layout Notes:** Large text, centered, plenty of white space. Optional background texture (minimal).

**Visual Approach:** Text-focused or minimal abstract shape suggesting growth/scale.

**Design Direction:** Bold, confident, intriguing. Make readers want to see the next slide.

---

### SLIDE 2: Principle 1

**Main Text:** Design for Statelessness

**Key Points:**
- Every node is independent
- Requests can hit any server
- No single point of failure
- Simplifies horizontal scaling

**Layout Notes:** Title at top, bullet points below. Clean spacing. No overload.

**Visual Approach:** Simple diagram showing stateless nodes and load balancing.

**Design Direction:** Clean, educational, minimal. Show the concept without clutter.

---

### SLIDE 3: Principle 2

**Main Text:** Cache Strategically (Not Everywhere)

**Key Points:**
- Caching is a liability without a strategy
- Cache misses cost more than compute
- Measure cache hit rates
- Invalidate intentionally

**Layout Notes:** Title, bullets, maybe a small diagram or icon showing cache layers.

**Visual Approach:** Minimalist illustration of cache layers.

**Design Direction:** Professional, technical, clean.

---

[Continue for slides 4–5...]

---

### SLIDE 6: Closing / CTA

**Main Text:**
What principle would you add?

Or paste yours in the comments — curious what shapes your architecture.

**Layout Notes:** Clean, inviting, centered. Can include a subtle visual or logo.

**Visual Approach:** Text-focused or optional brand visual.

**Design Direction:** Warm but professional. Invite engagement without being pushy.

---
```

---

## Slide Design Checklist

For each slide, ensure:

- [ ] **One idea, clearly** — Not multiple concepts competing for attention
- [ ] **Minimal text** — 3–5 lines of main text + bullet points (if needed)
- [ ] **Visual hierarchy** — What's most important is most prominent
- [ ] **White space** — Breathing room between elements
- [ ] **Consistent brand** — Minimal, clean, monochrome aesthetic
- [ ] **Readable at thumb height** — Test the visual spacing, not too tight
- [ ] **Flows from previous slide** — Logical progression
- [ ] **Readable in 3–5 seconds** — Don't crowd

---

## Visual Approaches (Choose One Per Slide)

| Approach | Best For | Example |
|----------|----------|---------|
| **Text-Focused** | Quotes, principles, titles | Slide 1 (Hook), last slide (CTA) |
| **Minimal Diagram** | Showing systems, processes, relationships | Architecture slides, framework slides |
| **Icon + Text** | Highlighting one concept | Each principle in a list carousel |
| **Screenshot + Label** | Showing code, UI examples | Tutorial carousels |
| **Illustration** | Conceptual or visual metaphors | Abstract concepts, visual ideas |
| **Grid/Matrix** | Comparing options or showing steps | Step-by-step tutorials |

---

## Example: 3-Slide Mini Carousel

**Topic: "The Bug That Taught Me About Production" (Retrospective)**

```markdown
### SLIDE 1: Hook

**Main Text:**
I deployed a memory leak to production.

It took a week to find it. Here's what it taught me.

**Layout Notes:** Centered, bold typography, white space around text.

**Visual Approach:** Minimalist code snippet or abstract visualization.

**Design Direction:** Direct, honest, no dramatization.

---

### SLIDE 2: The Problem

**Main Text:**Different Layers, Same System

**Key Points:**
- Frontend: ✓ All requests sent successfully
- Backend: ✓ All responses processed correctly
- System: ✗ Memory growing indefinitely

**Layout Notes:** Title top, comparison in the middle. Use checkmarks sparingly.

**Visual Approach:** Simple layer diagram showing frontend, backend, memory.

**Design Direction:** Educational, shows the blindspot.

---

### SLIDE 3: The Lesson

**Main Text:**See the Seams

**Key Points:**
- System problems rarely live in one layer
- They live in the contract between layers
- Full-stack visibility is a superpower

**Layout Notes:** Clean, bold statement followed by insights.

**Visual Approach:** Text-focused with optional minimal illustration.

**Design Direction:** Professional, actionable, inspiring.

---
```

---

## Pro Tips for Carousel Slides

1. **Slide 1 is everything** — If it doesn't hook, no one scrolls. Make it bold and specific.
2. **One idea per slide** — Resist the urge to pack more. Trust the carousel format.
3. **Use visual breaks** — Alternate between text-heavy and visual-heavy slides for pacing.
4. **Numbers and specifics** — "3 mistakes I made" works better than "mistakes I've made."
5. **Build momentum** — Start simple, escalate complexity, then close strong.
6. **Last slide is a CTA** — Ask a question, invite reflection, or provide a resource.
7. **Consistency across visuals** — Same aesthetic, same color palette, same font style (even if generated).
8. **Test readability** — Zoom out and check if text is readable on a small phone screen.

