'use client';

import { useState, useEffect } from 'react';
import { Post } from '@/types';
import { PostCard } from '@/components/post-card';

export default function ArchivePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/posts?status=posted')
      .then((r) => r.json())
      .then((data: Post[]) => {
        setPosts(data);
        setLoading(false);
      });
  }, []);

  const byMonth: Record<string, Post[]> = {};
  for (const p of posts) {
    const date = p.postedDate ?? p.createdAt;
    const key = new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(p);
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
      <div className="space-y-1">
        <h1 className="text-lg font-medium tracking-tight">Archive</h1>
        <p className="text-sm text-muted-foreground">
          {posts.length} post{posts.length !== 1 ? 's' : ''} published
        </p>
      </div>

      {loading && <p className="text-sm text-muted-foreground font-mono">Loading...</p>}

      {!loading && posts.length === 0 && (
        <p className="text-sm text-muted-foreground">Nothing posted yet.</p>
      )}

      <div className="space-y-10">
        {Object.entries(byMonth).map(([month, monthPosts]) => (
          <div key={month} className="space-y-4">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono">
              {month}
            </p>
            {monthPosts.map((post) => (
              <PostCard key={post.id} post={post} showActions={false} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
