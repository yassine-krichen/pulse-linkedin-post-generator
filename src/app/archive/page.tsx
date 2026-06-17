'use client';

import { useState, useEffect } from 'react';
import { Post } from '@/types';
import { PostCard } from '@/components/post-card';
import { Button } from '@/components/ui/button';
import { Archive, Loader2 } from 'lucide-react';

const PAGE_SIZE = 20;

export default function ArchivePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  async function loadPage(offset: number) {
    const res = await fetch(`/api/posts?status=posted&limit=${PAGE_SIZE}&offset=${offset}`);
    const body: { posts: Post[]; total: number } = await res.json();
    setPosts((prev) => (offset === 0 ? body.posts : [...prev, ...body.posts]));
    setTotal(body.total);
  }

  useEffect(() => {
    // `loadPage` is reused by the Load More button — the compiler's effect
    // analysis flags that indirection even though this is the documented
    // fetch-on-mount pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPage(0).finally(() => setLoading(false));
  }, []);

  async function handleLoadMore() {
    setLoadingMore(true);
    await loadPage(posts.length);
    setLoadingMore(false);
  }

  const byMonth: Record<string, Post[]> = {};
  for (const p of posts) {
    const date = p.postedDate ?? p.createdAt;
    const key = new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(p);
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Archive className="w-4 h-4 text-muted-foreground" />
          <h1 className="text-lg font-semibold tracking-tight">Archive</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {total} post{total !== 1 ? 's' : ''} published
        </p>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground font-mono animate-pulse">Loading...</p>
      )}

      {!loading && posts.length === 0 && (
        <p className="text-sm text-muted-foreground">Nothing posted yet.</p>
      )}

      <div className="space-y-10">
        {Object.entries(byMonth).map(([month, monthPosts]) => (
          <div key={month} className="space-y-4">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono border-b border-border/30 pb-2">
              {month}
            </p>
            {monthPosts.map((post) => (
              <PostCard key={post.id} post={post} showActions={false} />
            ))}
          </div>
        ))}
      </div>

      {!loading && posts.length < total && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" className="gap-1.5" disabled={loadingMore} onClick={handleLoadMore}>
            {loadingMore && <Loader2 className="w-3 h-3 animate-spin" />}
            {loadingMore ? 'Loading...' : `Load more (${total - posts.length} remaining)`}
          </Button>
        </div>
      )}
    </div>
  );
}
