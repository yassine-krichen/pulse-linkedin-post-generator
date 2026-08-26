import fs from 'fs';
import path from 'path';
import { db } from '@/lib/db';
import { Post, PostFormat } from '@/types';

const CONTENT_SYSTEM_DIR = path.join(process.cwd(), '..', 'content-studio');

function readFile(filePath: string): string {
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf-8');
}

// Nothing has been posted through this app yet on a fresh install, so voice
// matching would otherwise have nothing to work with. Mirrors the same two
// static files `profile.ts` reads, but only as a fallback — real posted
// history is always preferred once it exists.
function readStaticExampleFallback(): string {
  const examplePostPath = path.join(CONTENT_SYSTEM_DIR, 'examples', 'example-post-01.md');
  const exampleCarouselPath = path.join(CONTENT_SYSTEM_DIR, 'examples', 'example-carousel-01.md');

  const examplePost = readFile(examplePostPath);
  const exampleCarousel = readFile(exampleCarouselPath);

  return [
    examplePost ? `EXAMPLE STANDARD POST:\n${examplePost}` : '',
    exampleCarousel ? `EXAMPLE CAROUSEL POST:\n${exampleCarousel}` : '',
  ]
    .filter(Boolean)
    .join('\n\n---\n\n');
}

function fullTextOf(post: Post): string {
  // All PostContent variants (standard/carousel/image) carry a `fullText`
  // field per @/types — extract it uniformly regardless of the post's format.
  return (post.content as { fullText: string }).fullText;
}

/**
 * Pulls up to 3 real posted examples to ground voice matching in what the
 * user has actually published, not just static seed files. Prefers examples
 * of the same format, falling back to any format when there isn't enough
 * posted history yet — a real post in a different format still beats none.
 * Runs a fresh DB query every call since posted history changes constantly,
 * unlike the static profile files cached in `profile.ts`.
 */
export async function getVoiceExamples(format: PostFormat): Promise<string> {
  const TARGET_COUNT = 3;

  const sameFormat = await db.posts.findPosted({ format, limit: TARGET_COUNT });
  const posts = [...sameFormat];

  if (posts.length < TARGET_COUNT) {
    const anyFormat = await db.posts.findPosted({ limit: TARGET_COUNT });
    const seen = new Set(posts.map((p) => p.id));
    for (const post of anyFormat) {
      if (posts.length >= TARGET_COUNT) break;
      if (!seen.has(post.id)) {
        posts.push(post);
        seen.add(post.id);
      }
    }
  }

  if (posts.length === 0) return readStaticExampleFallback();

  return posts
    .map((post) => `EXAMPLE (posted, ${post.format}):\n${fullTextOf(post)}`)
    .join('\n\n---\n\n');
}
