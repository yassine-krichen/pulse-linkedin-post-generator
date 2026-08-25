import fs from 'fs';
import path from 'path';
import { db } from '../src/lib/db';
import { Post, Settings } from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

async function main() {
  if (fs.existsSync(POSTS_FILE)) {
    const posts: Post[] = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
    for (const post of posts) {
      const existing = await db.posts.findById(post.id);
      if (existing) continue;
      await db.posts.create(post);
    }
    console.log(`Migrated ${posts.length} post(s) from posts.json.`);
  } else {
    console.log('No posts.json found, skipping.');
  }

  if (fs.existsSync(SETTINGS_FILE)) {
    const settings: Settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    await db.settings.update(settings);
    console.log('Migrated settings.json.');
  } else {
    console.log('No settings.json found, skipping.');
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
