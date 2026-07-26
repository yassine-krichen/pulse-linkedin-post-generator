# Prompt: Standard Post Generator

Use this prompt to convert a raw idea into a polished LinkedIn standard post (text + optional single image).

---

## Input

**User provides:**
- Raw idea, event, or learning
- (Optional) Outcome, context, or specific angle they want to emphasize

---

## Your Task

Generate a post that follows the structure below. Tailor tone and framing to the user profile.

---

## Output Structure

### 1. Post Copy (150–300 words)

**Format:**
1. **Hook** (1–3 sentences): Grab attention. Lead with the most interesting insight or question.
2. **Body** (3–4 sentences or short paragraphs): Tell the story. What happened? What did you learn? What surprised you?
3. **Insight/Takeaway** (1–2 sentences): Articulate the key learning. What's the principle or pattern?
4. **CTA** (1 sentence): Mild call to action. Ask a question, invite discussion, or link to deeper resource.

**Tone Requirements:**
- ✓ Clean and professional
- ✓ Thoughtful and confident
- ✓ Authentic but polished
- ✓ No hype, no cringe, no hustle culture
- ✓ Assume audience is technically savvy

### 2. Visual Recommendation

**Ask yourself:**
- Does this post benefit from a single image?
- If yes: Image type (concept illustration, code screenshot, design mockup, diagram, abstract visual)?
- If no: Say "Text-only post — strong voice makes visuals unnecessary"

### 3. Image Prompt (if needed)

If an image is recommended, generate a **detailed, natural-language prompt** for Gemini:
- Describe the concept clearly
- Reference the brand aesthetic: clean, minimal, monochrome, editorial, prestigious, high-end tech feel
- No colorful or cheerful elements
- Specify any technical or abstract focus
- Include: "High-end minimal design, black/white/gray palette, editorial tech photography style, professional and prestigious"

**Example structure:**
> An editorial-style image showing [visual concept]. Clean, minimal design with black and white color palette. Modern sans-serif typography. Professional tech studio aesthetic, expensive and prestigious feel. Abstract geometric elements or technical focus. No colorful elements or cheerful vibes. High-end minimal design, like luxury tech publication photography.

### 4. Hashtag Recommendations (Optional)

- 3–5 relevant hashtags (NO spam)
- Lowercase
- Industry or topic focused, not personal branding spam
- Examples: #SystemsEngineering, #CloudArchitecture, #MLOps (not #DayInMyLife)

---

## Step-by-Step Generation Process

1. **Classify the idea**
   - Is this a "built something," "learned something," "opinion," or "how-to"?
   - Adjust framing accordingly

2. **Ask clarifying questions if needed**
   - Outcome? Audience? Specific insight to lead with?
   - (Keep it concise — don't over-ask)

3. **Generate hook**
   - Start with the most surprising, useful, or interesting part
   - Make it feel fresh, not generic

4. **Tell the story**
   - What happened? Show context in 2–3 sentences
   - Lead the reader through your thinking

5. **Extract the insight**
   - What principle or pattern emerges?
   - Why should someone else care?

6. **Suggest CTA**
   - Open-ended question? Link to code? Invite discussion?
   - Keep it light — not "like and share"

7. **Assess visual need**
   - Will a single image strengthen this? Or is the voice strong enough on its own?

8. **Generate image prompt**
   - If visual needed, describe it in natural language for Gemini
   - Reference brand aesthetic

9. **Add hashtags**
   - 3–5, topic-focused, no spam

---

## Output Format (Markdown)

```markdown
---
Title: [Auto-generated or user-provided]
Type: Standard Post
Author: [User name from PROFILE.md]
Date: [Today's date]
Status: Ready for Review
---

## Post Copy

[Full post text here — 150–300 words, formatted with natural line breaks]

---

## Visual Recommendation

[Image needed? Yes / No. If yes, describe type and why]

### Image Prompt (For Gemini)

[Natural-language prompt for user to paste into Gemini]

---

## Hashtag Suggestions

#Tag1 #Tag2 #Tag3 #Tag4

---

## Notes for User

[Any context or suggestions for refinement before posting]

```

---

## Key Constraints to Remember

- **No location** — never mention where the user is
- **No hustle culture** — avoid "grinding," "no days off," "built this at 3am," etc.
- **No politics** — stay neutral
- **No personal life** — no family, dating, home life
- **Clean aesthetic** — if suggesting visuals, always reference minimal, editorial, high-end style
- **Technical audience** — assume they know what you're talking about; avoid over-explaining unless necessary

---

## Examples

### Example 1: Built Something

**Input:** "I just shipped a real-time ML inference pipeline on AWS Lambda that handles high-volume predictions with sub-100ms latency."

**Output Hook:** "Shipping ML inference at sub-100ms latency taught me that scale and speed aren't contradictions — they're architecture problems."

### Example 2: Learned Something

**Input:** "Spent 3 weeks debugging why my system had memory leaks in production. Turns out it was event listener cleanup."

**Output Hook:** "Three weeks of production debugging led to one principle: every async operation is a promise you have to keep."

### Example 3: Opinion / Process

**Input:** "I think full-stack developers have an unfair advantage — they see the problem end-to-end."

**Output Hook:** "Full-stack developers aren't just people who do everything — they're people who see the whole system."

