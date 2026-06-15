import fs from 'fs';
import path from 'path';
import { Post, PostStatus, Settings } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readPosts(): Post[] {
  ensureDataDir();
  if (!fs.existsSync(POSTS_FILE)) return [];
  return JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
}

function writePosts(posts: Post[]): void {
  ensureDataDir();
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
}

function readSettings(): Settings {
  ensureDataDir();
  if (!fs.existsSync(SETTINGS_FILE)) return { weeklyTarget: 1 };
  return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
}

function writeSettings(settings: Settings): void {
  ensureDataDir();
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

export const db = {
  posts: {
    findAll(): Post[] {
      return readPosts();
    },

    findById(id: string): Post | undefined {
      return readPosts().find((p) => p.id === id);
    },

    findByStatus(status: PostStatus): Post[] {
      return readPosts().filter((p) => p.status === status);
    },

    findByWeek(weekStart: Date, weekEnd: Date): Post[] {
      return readPosts().filter((p) => {
        if (!p.scheduledDate) return false;
        const d = new Date(p.scheduledDate);
        return d >= weekStart && d <= weekEnd;
      });
    },

    create(post: Post): Post {
      const posts = readPosts();
      posts.unshift(post);
      writePosts(posts);
      return post;
    },

    update(id: string, updates: Partial<Post>): Post | null {
      const posts = readPosts();
      const idx = posts.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      posts[idx] = { ...posts[idx], ...updates, updatedAt: new Date().toISOString() };
      writePosts(posts);
      return posts[idx];
    },

    delete(id: string): boolean {
      const posts = readPosts();
      const filtered = posts.filter((p) => p.id !== id);
      if (filtered.length === posts.length) return false;
      writePosts(filtered);
      return true;
    },
  },

  settings: {
    get(): Settings {
      return readSettings();
    },
    update(updates: Partial<Settings>): Settings {
      const current = readSettings();
      const updated = { ...current, ...updates };
      writeSettings(updated);
      return updated;
    },
  },
};
