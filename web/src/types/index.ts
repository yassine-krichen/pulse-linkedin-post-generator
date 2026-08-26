export type PostFormat = 'standard' | 'carousel' | 'image';
export type PostStatus = 'draft' | 'ready' | 'posted';
export type PostSource = 'user' | 'trending';
export type ContentType = 'built' | 'learned' | 'opinion' | 'tutorial';

export interface StandardPostContent {
  hook: string;
  body: string;
  takeaway: string;
  cta: string;
  fullText: string;
}

export interface CarouselSlide {
  slideNumber: number;
  title: string;
  points: string[];
  layoutNotes: string;
  imageStrategy: string;
}

export interface CarouselContent {
  slides: CarouselSlide[];
  fullText: string;
}

export interface ImagePostContent {
  caption: string;
  fullText: string;
  imagePrompt?: string;
}

export type PostContent = StandardPostContent | CarouselContent | ImagePostContent;

export interface Post {
  id: string;
  rawInput: string;
  format: PostFormat;
  contentType: ContentType;
  title: string;
  content: PostContent;
  imageStrategy: string;
  hashtags: string[];
  status: PostStatus;
  source: PostSource;
  topicCategory?: string;
  scheduledDate?: string | null;
  postedDate?: string | null;
  notes?: string;
  postUrl?: string | null;
  impressions?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  wasEdited?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PostStats {
  totalPosts: number;
  totalImpressions: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  avgEngagementRate: number;
  bestPost: { id: string; title: string; impressions: number } | null;
}

// Aggregate-only counts safe to expose on a public, unauthenticated page —
// no post titles, content, or raw input.
export interface PublicStats {
  totalPostsGenerated: number;
  totalPostsPosted: number;
  totalImpressions: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  avgEngagementRate: number;
}

export interface EvaluationResult {
  worthy: boolean;
  reason: string;
  suggestions?: string;
  classifiedAs?: ContentType;
  similarTo?: string;
}

export interface ClassificationResult {
  format: PostFormat;
  reason: string;
}

// Result of the quality-lint/humanizer pass — only meaningful for standard
// posts, since that's the only format the linter/humanizer currently runs
// against. `null` when the format doesn't apply.
export interface QualityCheckResult {
  issuesFound: string[];
  wasRevised: boolean;
}

export interface PipelineResult {
  evaluation: EvaluationResult;
  classification?: ClassificationResult;
  post?: Post;
  qualityCheck?: QualityCheckResult | null;
  error?: string;
}

export interface Settings {
  weeklyTarget: number;
}

export interface TrendingTopic {
  title: string;
  summary: string;
  relevance: string;
  url?: string;
}
