# Prompt: Carousel Post Generator

Use this prompt to convert an idea into a multi-slide carousel post. Best for tutorials, processes, frameworks, or complex multi-part ideas.

---

## Input

**User provides:**
- Topic or idea suitable for multiple slides
- (Optional) Specific steps, components, or framework to explore

---

## Your Task

Generate a carousel that works as a complete, self-contained story across 4–8 slides. Each slide must stand alone visually but flow logically.

---

## Carousel Structure

### Slide 1: Hook / Title
- **Purpose:** Stop the scroll, establish topic
- **Content:** Bold statement, question, or title
- **Visual:** Strong concept or title text
- **Text:** 1–2 lines maximum
- **Tone:** Confident, intriguing

### Slides 2–N: Main Content (One idea per slide)
- **Purpose:** Deliver one concept, step, or insight per slide
- **Content:** One idea clearly explained
- **Visual:** Diagram, icon, screenshot, or concept illustration
- **Text:** 3–5 short lines (titles, labels, minimal copy)
- **Pacing:** Each slide should take 3–5 seconds to read and absorb

### Last Slide: CTA + Info
- **Purpose:** Close strong, invite engagement
- **Content:** Question, reflection, or resource link
- **Visual:** Optional — can be text-focused
- **Text:** 2–3 lines max
- **Include:** LinkedIn handle or link to relevant resource

---

## Output Structure

### 1. Carousel Copy (Slide-by-Slide)

**For each slide:**
- **Slide [N]:** Title or main text
- **Layout notes:** Positioning, visual approach
- **Key points:** Bullet list of what appears on screen

### 2. Visual Strategy

**For each slide, describe:**
- Visual type: Diagram / Icon / Screenshot / Illustration / Text-only
- Design direction: How it fits the brand aesthetic
- Key visual elements

### 3. Image Prompts

**For visually complex slides, generate:**
- Natural-language prompts for Gemini
- Brand aesthetic references (minimal, clean, editorial, monochrome)

### 4. Hashtags

- 3–5 topic-focused hashtags
- No spam

---

## Step-by-Step Generation Process

1. **Classify the carousel type**
   - Tutorial (step-by-step process)?
   - Framework or system (components / layers)?
   - Opinion series (linked ideas)?
   - How-to / Best practices?

2. **Outline the flow**
   - Slide 1: Hook (1 line)
   - Slides 2–N: Each one idea (list it)
   - Last slide: CTA

3. **Write hook (Slide 1)**
   - Make it immediately clear what this carousel teaches / explores
   - Use curiosity or a strong statement

4. **Develop main content (Slides 2–N)**
   - Each slide = one complete idea
   - Use titles, short labels, minimal copy
   - Build momentum (easier → harder, or intro → application)

5. **Design layout notes**
   - Describe how text, visuals, and spacing work
   - "Left-aligned title, icon on right," or "Top half diagram, bottom half labels," etc.

6. **Close strong (Last slide)**
   - Reflection, question for engagement, or resource link
   - Reinforce your LinkedIn profile

7. **Visual approach**
   - Decide which slides need custom images vs. diagrams vs. text
   - Reference brand aesthetic for custom visuals

8. **Image prompts**
   - For complex visuals, generate Gemini-compatible prompts
   - Keep them descriptive and editorial

---

## Output Format (Markdown)

```markdown
---
Title: [Auto-generated or user-provided]
Type: Carousel Post
Author: [User name from PROFILE.md]
Date: [Today's date]
Total Slides: [N]
Status: Ready for Review
---

## Carousel Outline

[Bullet list of all slides with main idea for each]

---

## Slide-by-Slide Content

### SLIDE 1: Hook
**Text:** [Main hook — 1–2 lines]

**Layout Notes:** [Visual approach: centered text, image, or icon]

**Design Direction:** Bold and intriguing

---

### SLIDE 2: [Main idea]
**Title/Text:** [Main heading or key points]

**Key Points:**
- [Bullet]
- [Bullet]
- [Bullet]

**Layout Notes:** [Position of text, visual elements, spacing]

**Design Direction:** [Clean layout, minimal text, visual focus]

---

### [REPEAT for Slides 3–N]

---

### SLIDE [N] (Final Slide): CTA / Closing
**Text:** [Reflection, question, or resource link — 2–3 lines]

**Layout Notes:** [Can be text-focused or include visual]

**Design Direction:** Professional close

---

## Visual Strategy

| Slide | Visual Type | Design Notes |
|-------|------------|--------------|
| 1 | Title/Hook | Bold, clean, intriguing |
| 2–N | [Diagram/Icon/Screenshot/Text] | [One per slide] |
| Final | [CTA Visual or Text] | [Closing visual] |

---

## Image Prompts (For Gemini)

### Image for Slide [N]: [Concept]

[Full natural-language description for Gemini]
Reference: Clean, minimal, monochrome, editorial style, high-end tech aesthetic, black/white/gray palette, professional and prestigious.

---

## Hashtag Suggestions

#Tag1 #Tag2 #Tag3 #Tag4

---

## Notes for User

[Any context or refinement suggestions]

```

---

## Key Constraints

- **Slide economy:** One idea per slide — don't crowd
- **Text minimalism:** 3–5 lines max per slide (except slides with heavy diagrams)
- **Visual consistency:** Same aesthetic across all slides
- **No location** — never mention where user is
- **Brand aesthetic** — all visuals should feel minimal, editorial, high-end, monochrome
- **Flow and pacing** — each slide should feel like a natural progression
- **Engagement-focused** — last slide should invite discussion or provide value

---

## Carousel Types & Examples

### Type 1: Tutorial / Process

**Example topic:** "5 Steps to Building a Scalable API"

- Slide 1: "Building Scalable APIs — Here's What We Learned"
- Slide 2: "1. Design for Statelessness"
- Slide 3: "2. Implement Caching Strategically"
- Slide 4: "3. Monitor from Day 1"
- Slide 5: "4. Plan for Scale Before You Need It"
- Slide 6: "5. Version Your API Early"
- Slide 7: "What patterns have saved you? Drop a comment."

### Type 2: Framework / System

**Example topic:** "The Full-Stack Developer's Advantage"

- Slide 1: "Why Full-Stack Developers See Problems Differently"
- Slide 2: "They Own the Data Layer"
- Slide 3: "They Understand the Frontend Constraints"
- Slide 4: "They Think End-to-End from Day 1"
- Slide 5: "Result: Faster Problem Solving"
- Slide 6: "How does your stack shape your perspective?"

### Type 3: Opinion Series

**Example topic:** "Three Mistakes I Made in Production"

- Slide 1: "Three Mistakes I Made in Production (So You Don't Have To)"
- Slide 2: "Mistake 1: Assuming Logs Are Sufficient"
- Slide 3: "Mistake 2: Scaling Horizontally Before Optimizing Vertically"
- Slide 4: "Mistake 3: Skipping the Retrospective"
- Slide 5: "The common thread? Rushed decisions. What's cost you?"

