import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@/generated/prisma/client';
import { Post, PostContent, PostFormat, PostStats, PostStatus, PublicStats, Settings } from '@/types';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Reuse a single PrismaClient across hot reloads in dev — avoids exhausting
// Postgres connections when Next.js recompiles modules.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

const SETTINGS_ID = 'global';

type PostRow = {
  id: string;
  rawInput: string;
  format: string;
  contentType: string;
  title: string;
  content: Prisma.JsonValue;
  imageStrategy: string;
  hashtags: string[];
  status: string;
  source: string;
  topicCategory: string | null;
  scheduledDate: Date | null;
  postedDate: Date | null;
  notes: string | null;
  postUrl: string | null;
  impressions: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  wasEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function toPost(row: PostRow): Post {
  return {
    id: row.id,
    rawInput: row.rawInput,
    format: row.format as Post['format'],
    contentType: row.contentType as Post['contentType'],
    title: row.title,
    content: row.content as unknown as PostContent,
    imageStrategy: row.imageStrategy,
    hashtags: row.hashtags,
    status: row.status as PostStatus,
    source: row.source as Post['source'],
    topicCategory: row.topicCategory ?? undefined,
    scheduledDate: row.scheduledDate?.toISOString(),
    postedDate: row.postedDate?.toISOString(),
    notes: row.notes ?? undefined,
    postUrl: row.postUrl ?? undefined,
    impressions: row.impressions ?? undefined,
    likes: row.likes ?? undefined,
    comments: row.comments ?? undefined,
    shares: row.shares ?? undefined,
    wasEdited: row.wasEdited,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function fromPost(post: Post) {
  return {
    id: post.id,
    rawInput: post.rawInput,
    format: post.format,
    contentType: post.contentType,
    title: post.title,
    content: post.content as unknown as Prisma.InputJsonValue,
    imageStrategy: post.imageStrategy,
    hashtags: post.hashtags,
    status: post.status,
    source: post.source,
    topicCategory: post.topicCategory ?? null,
    scheduledDate: post.scheduledDate ? new Date(post.scheduledDate) : null,
    postedDate: post.postedDate ? new Date(post.postedDate) : null,
    notes: post.notes ?? null,
    postUrl: post.postUrl ?? null,
  };
}

function partialFromPost(updates: Partial<Post>) {
  const data: Record<string, unknown> = {};
  if (updates.rawInput !== undefined) data.rawInput = updates.rawInput;
  if (updates.format !== undefined) data.format = updates.format;
  if (updates.contentType !== undefined) data.contentType = updates.contentType;
  if (updates.title !== undefined) data.title = updates.title;
  if (updates.content !== undefined) data.content = updates.content;
  if (updates.imageStrategy !== undefined) data.imageStrategy = updates.imageStrategy;
  if (updates.hashtags !== undefined) data.hashtags = updates.hashtags;
  if (updates.status !== undefined) data.status = updates.status;
  if (updates.source !== undefined) data.source = updates.source;
  if (updates.topicCategory !== undefined) data.topicCategory = updates.topicCategory;
  if (updates.scheduledDate !== undefined) {
    data.scheduledDate = updates.scheduledDate ? new Date(updates.scheduledDate) : null;
  }
  if (updates.postedDate !== undefined) {
    data.postedDate = updates.postedDate ? new Date(updates.postedDate) : null;
  }
  if (updates.notes !== undefined) data.notes = updates.notes;
  if (updates.postUrl !== undefined) data.postUrl = updates.postUrl;
  if (updates.impressions !== undefined) data.impressions = updates.impressions;
  if (updates.likes !== undefined) data.likes = updates.likes;
  if (updates.comments !== undefined) data.comments = updates.comments;
  if (updates.shares !== undefined) data.shares = updates.shares;
  if (updates.wasEdited !== undefined) data.wasEdited = updates.wasEdited;
  return data;
}

export interface PagingOptions {
  limit?: number;
  offset?: number;
}

export interface PagedPosts {
  posts: Post[];
  total: number;
}

export const db = {
  posts: {
    async findAll(opts: PagingOptions = {}): Promise<PagedPosts> {
      const [rows, total] = await Promise.all([
        prisma.post.findMany({ orderBy: { createdAt: 'desc' }, take: opts.limit, skip: opts.offset }),
        prisma.post.count(),
      ]);
      return { posts: rows.map(toPost), total };
    },

    async findById(id: string): Promise<Post | null> {
      const row = await prisma.post.findUnique({ where: { id } });
      return row ? toPost(row) : null;
    },

    async findByStatus(status: PostStatus, opts: PagingOptions = {}): Promise<PagedPosts> {
      const where = { status };
      const [rows, total] = await Promise.all([
        prisma.post.findMany({ where, orderBy: { createdAt: 'desc' }, take: opts.limit, skip: opts.offset }),
        prisma.post.count({ where }),
      ]);
      return { posts: rows.map(toPost), total };
    },

    // Voice-learning needs recent real posted history, preferring the same
    // format as the one being generated. Ordered by postedDate (falling back
    // to updatedAt for the rare row missing it) rather than createdAt, since
    // "recently posted" is the signal that matters here, not "recently drafted".
    async findPosted(opts: { format?: PostFormat; limit: number }): Promise<Post[]> {
      const where = { status: 'posted' as PostStatus, ...(opts.format ? { format: opts.format } : {}) };
      const rows = await prisma.post.findMany({
        where,
        orderBy: [{ postedDate: 'desc' }, { updatedAt: 'desc' }],
        take: opts.limit,
      });
      return rows.map(toPost);
    },

    async findByWeek(weekStart: Date, weekEnd: Date): Promise<Post[]> {
      const rows = await prisma.post.findMany({
        where: { scheduledDate: { gte: weekStart, lte: weekEnd } },
        orderBy: { scheduledDate: 'asc' },
      });
      return rows.map(toPost);
    },

    async create(post: Post): Promise<Post> {
      const row = await prisma.post.create({ data: fromPost(post) });
      return toPost(row);
    },

    async update(id: string, updates: Partial<Post>): Promise<Post | null> {
      try {
        const row = await prisma.post.update({
          where: { id },
          data: partialFromPost(updates),
        });
        return toPost(row);
      } catch {
        return null;
      }
    },

    async delete(id: string): Promise<boolean> {
      try {
        await prisma.post.delete({ where: { id } });
        return true;
      } catch {
        return false;
      }
    },

    async stats(): Promise<PostStats> {
      const [agg, best] = await Promise.all([
        prisma.post.aggregate({
          where: { status: 'posted' },
          _count: { id: true },
          _sum: { impressions: true, likes: true, comments: true, shares: true },
        }),
        prisma.post.findFirst({
          where: { status: 'posted', impressions: { gt: 0 } },
          orderBy: { impressions: 'desc' },
          select: { id: true, title: true, impressions: true },
        }),
      ]);
      const totalImpressions = agg._sum.impressions ?? 0;
      const totalLikes = agg._sum.likes ?? 0;
      const totalComments = agg._sum.comments ?? 0;
      const totalShares = agg._sum.shares ?? 0;
      return {
        totalPosts: agg._count.id,
        totalImpressions,
        totalLikes,
        totalComments,
        totalShares,
        avgEngagementRate:
          totalImpressions > 0
            ? ((totalLikes + totalComments + totalShares) / totalImpressions) * 100
            : 0,
        bestPost: best ? { id: best.id, title: best.title, impressions: best.impressions! } : null,
      };
    },

    // Public, unauthenticated social-proof numbers — aggregate counts only,
    // never post titles/content. Extends the same aggregate query as stats()
    // with the total-generated count, deliberately omitting bestPost.
    async publicStats(): Promise<PublicStats> {
      const [totalGenerated, agg] = await Promise.all([
        prisma.post.count(),
        prisma.post.aggregate({
          where: { status: 'posted' },
          _count: { id: true },
          _sum: { impressions: true, likes: true, comments: true, shares: true },
        }),
      ]);
      const totalImpressions = agg._sum.impressions ?? 0;
      const totalLikes = agg._sum.likes ?? 0;
      const totalComments = agg._sum.comments ?? 0;
      const totalShares = agg._sum.shares ?? 0;
      return {
        totalPostsGenerated: totalGenerated,
        totalPostsPosted: agg._count.id,
        totalImpressions,
        totalLikes,
        totalComments,
        totalShares,
        avgEngagementRate:
          totalImpressions > 0
            ? ((totalLikes + totalComments + totalShares) / totalImpressions) * 100
            : 0,
      };
    },
  },

  settings: {
    async get(): Promise<Settings> {
      const row = await prisma.weeklyTarget.findUnique({ where: { id: SETTINGS_ID } });
      return { weeklyTarget: row?.postsPerWeek ?? 1 };
    },

    async update(updates: Partial<Settings>): Promise<Settings> {
      const row = await prisma.weeklyTarget.upsert({
        where: { id: SETTINGS_ID },
        create: { id: SETTINGS_ID, postsPerWeek: updates.weeklyTarget ?? 1 },
        update: updates.weeklyTarget !== undefined ? { postsPerWeek: updates.weeklyTarget } : {},
      });
      return { weeklyTarget: row.postsPerWeek };
    },
  },
};
