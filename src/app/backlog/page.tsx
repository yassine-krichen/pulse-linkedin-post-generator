'use client';

import { useState, useEffect } from 'react';
import { Post } from '@/types';
import { PostCard } from '@/components/post-card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Filter = 'all' | 'draft' | 'ready';

export default function BacklogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/posts');
    const data: Post[] = await res.json();
    setPosts(data.filter((p) => p.status !== 'posted'));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

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
          <h1 className="text-lg font-medium tracking-tight">Backlog</h1>
          <p className="text-sm text-muted-foreground">
            {posts.length} post{posts.length !== 1 ? 's' : ''} queued
          </p>
        </div>
        <div className="flex gap-2">
          {(['all', 'draft', 'ready'] as Filter[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'secondary' : 'ghost'}
              size="sm"
              className="text-xs capitalize"
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-muted-foreground font-mono">Loading...</p>}

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
          />
        ))}
      </div>
    </div>
  );
}
