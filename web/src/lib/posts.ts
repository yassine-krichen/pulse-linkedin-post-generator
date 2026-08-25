import { ContentType, Post, PostContent, PostFormat, PostSource, PostStatus } from '@/types';
import { createId } from '@/lib/id';

interface GeneratedPostFields {
  title: string;
  content: PostContent;
  imageStrategy: string;
  hashtags: string[];
  topicCategory: string;
}

interface CreatePostFromGenerationParams {
  rawInput: string;
  format: PostFormat;
  contentType: ContentType;
  generated: GeneratedPostFields;
  status: PostStatus;
  source: PostSource;
  scheduledDate?: string;
}

/**
 * Builds a new Post record from LLM-generated content, assigning a fresh id
 * and createdAt/updatedAt timestamps. Shared by the pipeline and trending
 * routes so both stay in sync on the Post shape.
 */
export function createPostFromGeneration(params: CreatePostFromGenerationParams): Post {
  const now = new Date().toISOString();
  return {
    id: createId(),
    rawInput: params.rawInput,
    format: params.format,
    contentType: params.contentType,
    title: params.generated.title,
    content: params.generated.content,
    imageStrategy: params.generated.imageStrategy,
    hashtags: params.generated.hashtags,
    status: params.status,
    source: params.source,
    topicCategory: params.generated.topicCategory,
    scheduledDate: params.scheduledDate,
    createdAt: now,
    updatedAt: now,
  };
}
