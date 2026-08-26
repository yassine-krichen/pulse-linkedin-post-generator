'use client';

import { useEffect, useState } from 'react';
import { PublicStats } from '@/types';
import { Activity, Eye, Heart, MessageCircle, TrendingUp, Zap, CheckCircle2, Loader2 } from 'lucide-react';

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

// Public, no-login stats page — social proof for sponsors/investors.
// Fetches aggregate-only numbers from /api/public-stats (excluded from the
// auth gate in src/proxy.ts). Renders standalone; no nav bar dependency on auth.
export default function PublicStatsPage() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/public-stats')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load stats'))))
      .then((data: PublicStats) => setStats(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-6 py-16 space-y-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex items-center justify-center w-10 h-10 rounded-md bg-foreground text-background">
          <Activity className="w-5 h-5" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight text-foreground">Pulse</p>
          <p className="text-xs text-muted-foreground">Live usage stats</p>
        </div>
      </div>

      {loading && (
        <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground font-mono">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...
        </p>
      )}

      {!loading && error && (
        <p className="text-sm text-muted-foreground text-center">Couldn&apos;t load stats — try again later.</p>
      )}

      {!loading && !error && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard icon={Zap} label="Posts Generated" value={fmt(stats.totalPostsGenerated)} />
          <StatCard icon={CheckCircle2} label="Posts Published" value={fmt(stats.totalPostsPosted)} />
          <StatCard icon={Eye} label="Impressions" value={fmt(stats.totalImpressions)} />
          <StatCard icon={Heart} label="Likes" value={fmt(stats.totalLikes)} />
          <StatCard icon={MessageCircle} label="Comments" value={fmt(stats.totalComments)} />
          <StatCard
            icon={TrendingUp}
            label="Avg. Engagement"
            value={stats.avgEngagementRate > 0 ? `${stats.avgEngagementRate.toFixed(1)}%` : '—'}
          />
        </div>
      )}
    </div>
  );
}
