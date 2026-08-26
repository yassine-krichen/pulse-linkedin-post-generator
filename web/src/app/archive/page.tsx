'use client';

import { useState, useEffect } from 'react';
import { Post, PostStats } from '@/types';
import { PostCard } from '@/components/post-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Archive, Loader2, TrendingUp, Eye, Heart, MessageCircle, Share2, BarChart2, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const PAGE_SIZE = 20;

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 p-4 rounded-lg border border-border/40 bg-card/30">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs font-mono uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-xl font-semibold tracking-tight">{value}</span>
    </div>
  );
}

interface EngagementFormState {
  impressions: string;
  likes: string;
  comments: string;
  shares: string;
}

function EngagementBar({
  post,
  onLog,
  onUpdate,
}: {
  post: Post;
  onLog: (id: string, data: { impressions: number; likes: number; comments: number; shares: number }) => Promise<void>;
  onUpdate: (updated: Post) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [postUrl, setPostUrl] = useState(post.postUrl ?? '');
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState<EngagementFormState>({
    impressions: String(post.impressions ?? ''),
    likes: String(post.likes ?? ''),
    comments: String(post.comments ?? ''),
    shares: String(post.shares ?? ''),
  });

  async function handleSavePostUrl() {
    const trimmed = postUrl.trim();
    if (trimmed === (post.postUrl ?? '')) return;
    const res = await fetch(`/api/posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postUrl: trimmed || null }),
    });
    if (!res.ok) {
      toast.error('Failed to save LinkedIn URL');
      return;
    }
    const updated: Post = await res.json();
    onUpdate(updated);
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/refresh-engagement`, { method: 'POST' });
      const body: { post: Post; refreshed: boolean; error?: string } = await res.json();
      if (!res.ok) {
        toast.error(body.error ?? 'Failed to refresh engagement');
        return;
      }
      onUpdate(body.post);
      setForm({
        impressions: String(body.post.impressions ?? ''),
        likes: String(body.post.likes ?? ''),
        comments: String(body.post.comments ?? ''),
        shares: String(body.post.shares ?? ''),
      });
      if (body.refreshed) {
        toast.success('Engagement refreshed');
      } else {
        toast.info("Couldn't fetch engagement — enter manually");
      }
    } finally {
      setRefreshing(false);
    }
  }

  const hasData = post.impressions !== undefined;
  const engRate =
    post.impressions && post.impressions > 0
      ? (((post.likes ?? 0) + (post.comments ?? 0) + (post.shares ?? 0)) / post.impressions) * 100
      : null;

  async function handleSave() {
    setSaving(true);
    await onLog(post.id, {
      impressions: Number(form.impressions) || 0,
      likes: Number(form.likes) || 0,
      comments: Number(form.comments) || 0,
      shares: Number(form.shares) || 0,
    });
    setSaving(false);
    setOpen(false);
  }

  if (!open) {
    return (
      <div className="flex items-center gap-3 px-1">
        {hasData ? (
          <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono flex-1">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" /> {fmt(post.impressions!)}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" /> {post.likes ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" /> {post.comments ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <Share2 className="w-3 h-3" /> {post.shares ?? 0}
            </span>
            {engRate !== null && (
              <span className="flex items-center gap-1 text-emerald-500/80">
                <TrendingUp className="w-3 h-3" /> {engRate.toFixed(1)}%
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/50 flex-1">No engagement logged</span>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs text-muted-foreground/60 hover:text-foreground px-2"
          onClick={() => setOpen(true)}
        >
          {hasData ? 'Update' : 'Log results'}
        </Button>
      </div>
    );
  }

  return (
    <div className="border border-border/40 rounded-lg p-4 bg-card/30 space-y-3">
      <p className="text-xs text-muted-foreground font-medium">Log LinkedIn engagement</p>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">LinkedIn post URL</label>
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://www.linkedin.com/posts/..."
            className="h-8 text-sm"
            value={postUrl}
            onChange={(e) => setPostUrl(e.target.value)}
            onBlur={handleSavePostUrl}
          />
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1 shrink-0"
            onClick={handleRefresh}
            disabled={refreshing || !post.postUrl}
          >
            {refreshing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Refresh
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground/60">
          Auto-fills likes and comments from the public post. Impressions and shares stay manual.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(
          [
            { key: 'impressions', label: 'Impressions', icon: Eye },
            { key: 'likes', label: 'Likes', icon: Heart },
            { key: 'comments', label: 'Comments', icon: MessageCircle },
            { key: 'shares', label: 'Shares / Reposts', icon: Share2 },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <div key={key} className="space-y-1">
            <label className="flex items-center gap-1 text-xs text-muted-foreground">
              <Icon className="w-3 h-3" />
              {label}
            </label>
            <Input
              type="number"
              min={0}
              className="h-8 text-sm font-mono"
              value={form[key]}
              onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="h-7 text-xs gap-1" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
          Save
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default function ArchivePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<PostStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  async function loadPage(offset: number) {
    const res = await fetch(`/api/posts?status=posted&limit=${PAGE_SIZE}&offset=${offset}`);
    const body: { posts: Post[]; total: number } = await res.json();
    setPosts((prev) => (offset === 0 ? body.posts : [...prev, ...body.posts]));
    setTotal(body.total);
  }

  async function loadStats() {
    const res = await fetch('/api/posts/stats');
    if (res.ok) {
      const data: PostStats = await res.json();
      setStats(data);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    Promise.all([loadPage(0), loadStats()]).finally(() => setLoading(false));
  }, []);

  async function handleLoadMore() {
    setLoadingMore(true);
    await loadPage(posts.length);
    setLoadingMore(false);
  }

  async function handleLogEngagement(
    id: string,
    data: { impressions: number; likes: number; comments: number; shares: number },
  ) {
    const res = await fetch(`/api/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return;
    const updated: Post = await res.json();
    setPosts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    loadStats();
  }

  function handleUpdate(updated: Post) {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  const byMonth: Record<string, Post[]> = {};
  for (const p of posts) {
    const date = p.postedDate ?? p.createdAt;
    const key = new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(p);
  }

  const showStats = stats && (stats.totalPosts > 0 || stats.totalImpressions > 0);

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

      {showStats && (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BarChart2 className="w-3.5 h-3.5" />
            <span className="font-mono uppercase tracking-wider">Performance</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={Eye} label="Impressions" value={fmt(stats.totalImpressions)} />
            <StatCard icon={Heart} label="Likes" value={fmt(stats.totalLikes)} />
            <StatCard icon={MessageCircle} label="Comments" value={fmt(stats.totalComments)} />
            <StatCard
              icon={TrendingUp}
              label="Avg. Rate"
              value={stats.avgEngagementRate > 0 ? `${stats.avgEngagementRate.toFixed(1)}%` : '—'}
            />
          </div>
          {stats.bestPost && (
            <p className="text-xs text-muted-foreground font-mono">
              Best post: <span className="text-foreground">{stats.bestPost.title}</span>{' '}
              <span className="text-muted-foreground/60">({fmt(stats.bestPost.impressions)} impressions)</span>
            </p>
          )}
        </div>
      )}

      {loading && <p className="text-sm text-muted-foreground font-mono animate-pulse">Loading...</p>}

      {!loading && posts.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nothing posted yet. Mark a post as &quot;posted&quot; from the Backlog and it will appear here.
        </p>
      )}

      <div className="space-y-10">
        {Object.entries(byMonth).map(([month, monthPosts]) => (
          <div key={month} className="space-y-4">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono border-b border-border/30 pb-2">
              {month}
            </p>
            {monthPosts.map((post) => (
              <div key={post.id} className="space-y-2">
                <PostCard post={post} showActions={false} onUpdate={handleUpdate} />
                <EngagementBar post={post} onLog={handleLogEngagement} onUpdate={handleUpdate} />
              </div>
            ))}
          </div>
        ))}
      </div>

      {!loading && posts.length < total && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={loadingMore}
            onClick={handleLoadMore}
          >
            {loadingMore && <Loader2 className="w-3 h-3 animate-spin" />}
            {loadingMore ? 'Loading...' : `Load more (${total - posts.length} remaining)`}
          </Button>
        </div>
      )}
    </div>
  );
}
