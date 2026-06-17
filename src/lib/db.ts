import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@/generated/prisma/client';
import { Post, PostContent, PostStatus, Settings } from '@/types';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? 'file:./dev.db' });

// Reuse a single PrismaClient across hot reloads in dev — avoids exhausting
// SQLite connections when Next.js recompiles modules.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

const SETTINGS_ID = 'global';

type PostRow = {
  id: string;
  rawInput: string;
  format: string;
  title: string;
  content: string;
  imageStrategy: string;
  hashtags: string;
  status: string;
  source: string;
  topicCategory: string | null;
  scheduledDate: Date | null;
  postedDate: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function toPost(row: PostRow): Post {
  return {
    id: row.id,
    rawInput: row.rawInput,
    format: row.format as Post['format'],
    title: row.title,
    content: JSON.parse(row.content) as PostContent,
    imageStrategy: row.imageStrategy,
    hashtags: JSON.parse(row.hashtags) as string[],
    status: row.status as PostStatus,
    source: row.source as Post['source'],
    topicCategory: row.topicCategory ?? undefined,
    scheduledDate: row.scheduledDate?.toISOString(),
    postedDate: row.postedDate?.toISOString(),
    notes: row.notes ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function fromPost(post: Post) {
  return {
    id: post.id,
    rawInput: post.rawInput,
    format: post.format,
    title: post.title,
    content: JSON.stringify(post.content),
    imageStrategy: post.imageStrategy,
    hashtags: JSON.stringify(post.hashtags),
    status: post.status,
    source: post.source,
    topicCategory: post.topicCategory ?? null,
    scheduledDate: post.scheduledDate ? new Date(post.scheduledDate) : null,
    postedDate: post.postedDate ? new Date(post.postedDate) : null,
    notes: post.notes ?? null,
  };
}

function partialFromPost(updates: Partial<Post>) {
  const data: Record<string, unknown> = {};
  if (updates.rawInput !== undefined) data.rawInput = updates.rawInput;
  if (updates.format !== undefined) data.format = updates.format;
  if (updates.title !== undefined) data.title = updates.title;
  if (updates.content !== undefined) data.content = JSON.stringify(updates.content);
  if (updates.imageStrategy !== undefined) data.imageStrategy = updates.imageStrategy;
  if (updates.hashtags !== undefined) data.hashtags = JSON.stringify(updates.hashtags);
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
  return data;
}

export const db = {
  posts: {
    async findAll(): Promise<Post[]> {
      const rows = await prisma.post.findMany({ orderBy: { createdAt: 'desc' } });
      return rows.map(toPost);
    },

    async findById(id: string): Promise<Post | null> {
      const row = await prisma.post.findUnique({ where: { id } });
      return row ? toPost(row) : null;
    },

    async findByStatus(status: PostStatus): Promise<Post[]> {
      const rows = await prisma.post.findMany({
        where: { status },
        orderBy: { createdAt: 'desc' },
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
