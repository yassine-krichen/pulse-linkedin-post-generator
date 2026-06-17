'use client';

import { useState, useEffect } from 'react';
import { Post } from '@/types';
import { PostCard } from '@/components/post-card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Layers, Filter } from 'lucide-react';

type Filter = 'all' | 'draft' | 'ready';

export default function BacklogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/posts');
    const body: { posts: Post[] } = await res.json();
    setPosts(body.posts.filter((p) => p.status !== 'posted'));
    setLoading(false);
  }

  useEffect(() => {
    // `load` is also reused by the mutation handlers below to refresh the
    // list — the compiler's effect analysis flags that indirection even
    // though this is the documented fetch-on-mount pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function handleMarkReady(p: Post) {
    await fetch(`/api/posts/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ready' }),
    });
    toast.success('Marked as ready');
    load();
  }

  async function handleMarkPosted(p: Post) {
    await fetch(`/api/posts/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'posted', postedDate: new Date().toISOString() }),
    });
    toast.success('Marked as posted');
    load();
  }

  async function handleDelete(p: Post) {
    await fetch(`/api/posts/${p.id}`, { method: 'DELETE' });
    toast.success('Deleted');
    load();
  }

  const filtered = posts.filter((p) => filter === 'all' || p.status === filter);

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-muted-foreground" />
            <h1 className="text-lg font-semibold tracking-tight">Backlog</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {posts.length} post{posts.length !== 1 ? 's' : ''} queued
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-muted-foreground/60 mr-1" />
          {(['all', 'draft', 'ready'] as Filter[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'secondary' : 'ghost'}
              size="sm"
              className="text-xs capitalize h-7 px-2.5"
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground font-mono animate-pulse">Loading...</p>
      )}

      {!loading && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {filter === 'all' ? 'Backlog is empty. Generate a post first.' : `No ${filter} posts.`}
        </p>
      )}

      <div className="space-y-4">
        {filtered.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onSaveToBacklog={post.status === 'draft' ? handleMarkReady : undefined}
            onMarkAsPosted={handleMarkPosted}
            onDelete={handleDelete}
            onUpdate={load}
          />
        ))}
      </div>
    </div>
  );
}
