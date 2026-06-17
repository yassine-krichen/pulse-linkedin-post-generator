import { z } from 'zod';

const standardPostContentSchema = z.object({
  hook: z.string(),
  body: z.string(),
  takeaway: z.string(),
  cta: z.string(),
  fullText: z.string(),
});

const carouselSlideSchema = z.object({
  slideNumber: z.number(),
  title: z.string(),
  points: z.array(z.string()),
  layoutNotes: z.string(),
  imageStrategy: z.string(),
});

const carouselContentSchema = z.object({
  slides: z.array(carouselSlideSchema),
  fullText: z.string(),
});

const imagePostContentSchema = z.object({
  caption: z.string(),
  fullText: z.string(),
  imagePrompt: z.string().optional(),
});

const postContentSchema = z.union([
  standardPostContentSchema,
  carouselContentSchema,
  imagePostContentSchema,
]);

export const postUpdateSchema = z
  .object({
    status: z.enum(['draft', 'ready', 'posted']),
    title: z.string().min(1),
    content: postContentSchema,
    imageStrategy: z.string(),
    hashtags: z.array(z.string()).max(10),
    topicCategory: z.string(),
    scheduledDate: z.string().datetime().nullable(),
    postedDate: z.string().datetime().nullable(),
    notes: z.string().max(2000),
  })
  .partial()
  .strict();

export const settingsUpdateSchema = z
  .object({
    weeklyTarget: z.number().int().min(1).max(14),
  })
  .partial()
  .strict();

export const pipelineRequestSchema = z.object({
  input: z.string().trim().min(10).max(4000),
});

const trendingTopicSchema = z.object({
  title: z.string(),
  summary: z.string(),
  relevance: z.string(),
  url: z.string().optional(),
});

export const trendingRequestSchema = z
  .object({
    topic: trendingTopicSchema,
    researchPaste: z.string().min(1).max(50_000),
    scheduledDate: z.string().datetime(),
  })
  .partial()
  .strict()
  .refine((body) => Boolean(body.topic) || Boolean(body.researchPaste), {
    message: 'Provide either topic or researchPaste',
  });

export function formatZodError(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`).join('; ');
}
