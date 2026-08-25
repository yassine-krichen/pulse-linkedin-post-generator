'use client';

import { useState, useEffect, useCallback } from 'react';
import { Post, TrendingTopic } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { PostCard } from '@/components/post-card';
import { TopicList } from '@/components/topic-list';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getWeekBounds, isSameDay } from '@/lib/date';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Globe,
  X,
  MessageSquare,
  Clock,
  Target,
} from 'lucide-react';

// LinkedIn best posting times based on published engagement research
const BEST_TIMES: Record<number, { label: string; quality: 'high' | 'medium' | 'low' }> = {
  0: { label: 'Avoid — very low reach', quality: 'low' },
  1: { label: '7–8 AM or 12 PM', quality: 'medium' },
  2: { label: '7–8 AM, 10 AM–12 PM, 5–6 PM', quality: 'high' },
  3: { label: '7–8 AM, 10 AM–12 PM, 5–6 PM', quality: 'high' },
  4: { label: '7–8 AM, 10 AM–12 PM, 5–6 PM', quality: 'high' },
  5: { label: '10 AM–12 PM', quality: 'medium' },
  6: { label: 'Low engagement', quality: 'low' },
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const COMMENT_TIPS = [
  'Reply to the first 5–10 comments within 1 hour — the algorithm rewards early engagement velocity',
  'Add substance to replies, not just "Thanks!" — a question back keeps the thread alive',
  'Like meaningful comments even when you reply — it registers as additional engagement',
  'If someone leaves a standout comment, quote it in a future post (with credit)',
  "Each reply extends your post's visible window — treat them as mini-posts",
];

type ResearchMode = 'llm' | 'manual';

export default function PlannerPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [weeklyTarget, setWeeklyTarget] = useState(1);
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [researchPrompt, setResearchPrompt] = useState('');
  const [researchPaste, setResearchPaste] = useState('');
  const [parsedTopics, setParsedTopics] = useState<TrendingTopic[]>([]);
  const [researchMode, setResearchMode] = useState<ResearchMode>('llm');
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);

  const { start, end } = getWeekBounds(weekOffset);

  const loadData = useCallback(async () => {
    const [postsRes, settingsRes] = await Promise.all([
      fetch('/api/posts'),
      fetch('/api/settings'),
    ]);
    const [postsBody, settings]: [{ posts: Post[] }, { weeklyTarget: number }] = await Promise.all([
      postsRes.json(),
      settingsRes.json(),
    ]);
    setPosts(postsBody.posts);
    setWeeklyTarget(settings.weeklyTarget);
  }, []);

  useEffect(() => {
    // `loadData` is reused by mutation handlers to refresh the week view —
    // the compiler's effect analysis flags that indirection even though
    // this is the documented fetch-on-mount pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  const postedThisWeek = posts.filter((p) => {
    const d = p.postedDate ? new Date(p.postedDate) : null;
    return d && d >= start && d <= end;
  });

  const scheduledThisWeek = posts.filter((p) => {
    const d = p.scheduledDate ? new Date(p.scheduledDate) : null;
    return d && d >= start && d <= end && p.status !== 'posted';
  });

  const filledCount = postedThisWeek.length + scheduledThisWeek.length;
  const gapCount = Math.max(0, weeklyTarget - filledCount);

  function getPostForDay(day: Date): Post | undefined {
    return posts.find((p) => {
      const scheduled = p.scheduledDate ? new Date(p.scheduledDate) : null;
      const posted = p.postedDate ? new Date(p.postedDate) : null;
      return (scheduled && isSameDay(scheduled, day)) || (posted && isSameDay(posted, day));
    });
  }

  async function loadLlmTopics() {
    setLoadingTopics(true);
    setTopics([]);
    try {
      const res = await fetch('/api/trending');
      const data: { topics: TrendingTopic[]; researchPrompt: string } = await res.json();
      setTopics(data.topics ?? []);
      setResearchPrompt(data.researchPrompt ?? '');
    } catch {
      toast.error('Failed to generate topic suggestions');
    } finally {
      setLoadingTopics(false);
    }
  }

  function handleParseResearch() {
    if (!researchPaste.trim()) {
      toast.error('Paste your research results first');
      return;
    }
    try {
      const parsed = JSON.parse(researchPaste.trim().match(/\[[\s\S]*\]/)?.[0] ?? researchPaste);
      if (!Array.isArray(parsed)) throw new Error('Expected an array');
      setParsedTopics(parsed as TrendingTopic[]);
    } catch {
      toast.error('Could not parse results. Make sure you copied the full JSON array.');
    }
  }

  async function generateFromTopic(topic: TrendingTopic, day: Date) {
    const key = day.toISOString();
    setGeneratingFor(key);
    try {
      const res = await fetch('/api/trending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, scheduledDate: day.toISOString() }),
      });
      if (!res.ok) throw new Error('Generation failed');
      toast.success('Post generated and scheduled');
      await loadData();
      setTopics([]);
      setParsedTopics([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setGeneratingFor(null);
    }
  }

  async function updateTarget(n: number) {
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weeklyTarget: n }),
    });
    setWeeklyTarget(n);
  }

  const weekLabel =
    weekOffset === 0
      ? 'This Week'
      : weekOffset === 1
        ? 'Next Week'
        : weekOffset === -1
          ? 'Last Week'
          : start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const displayTopics = researchMode === 'llm' ? topics : parsedTopics;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <h1 className="text-lg font-semibold tracking-tight">Planner</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {filledCount}/{weeklyTarget} post{weeklyTarget !== 1 ? 's' : ''} this week
            {gapCount > 0 && (
              <span className="text-foreground/50 ml-2">
                · {gapCount} gap{gapCount !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Target className="w-3 h-3 text-muted-foreground/60" />
            <span className="text-xs text-muted-foreground font-mono">Target:</span>
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                onClick={() => updateTarget(n)}
                className={cn(
                  'w-7 h-7 text-xs rounded border font-mono transition-colors',
                  weeklyTarget === n
                    ? 'border-foreground text-foreground bg-muted'
                    : 'border-border text-muted-foreground hover:border-foreground/50',
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-0.5 border border-border/60 rounded-lg p-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setWeekOffset((o) => o - 1)}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs min-w-24 h-7 font-mono"
              onClick={() => setWeekOffset(0)}
            >
              {weekLabel}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setWeekOffset((o) => o + 1)}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayPost = getPostForDay(day);
          const bestTime = BEST_TIMES[day.getDay()];
          const isToday = isSameDay(day, new Date());
          const isPast = day < new Date() && !isToday;

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'border rounded-lg p-2 space-y-2 min-h-28 flex flex-col',
                isToday ? 'border-foreground/40 bg-muted/10' : 'border-border/40',
                isPast && !dayPost ? 'opacity-40' : '',
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'text-xs font-mono',
                    isToday ? 'text-foreground font-semibold' : 'text-muted-foreground',
                  )}
                >
                  {DAY_NAMES[day.getDay()]}
                </span>
                <span className="text-xs text-muted-foreground/50 font-mono">
                  {day.getDate()}
                </span>
              </div>
              <div
                className={cn(
                  'w-full h-0.5 rounded-full',
                  bestTime.quality === 'high'
                    ? 'bg-foreground/50'
                    : bestTime.quality === 'medium'
                      ? 'bg-foreground/20'
                      : 'bg-border/30',
                )}
              />
              {dayPost ? (
                <button
                  onClick={() => setExpandedPost(expandedPost === dayPost.id ? null : dayPost.id)}
                  className="text-left flex-1"
                >
                  <div className="space-y-1">
                    <Badge
                      variant={dayPost.status === 'posted' ? 'default' : 'secondary'}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {dayPost.status}
                    </Badge>
                    <p className="text-[11px] text-muted-foreground leading-tight line-clamp-2">
                      {dayPost.title}
                    </p>
                  </div>
                </button>
              ) : (
                !isPast && (
                  <div className="flex-1 flex items-end">
                    <p className="text-[10px] text-muted-foreground/35 font-mono leading-tight">
                      {bestTime.label}
                    </p>
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>

      {/* Expanded post preview */}
      {expandedPost &&
        (() => {
          const p = posts.find((x) => x.id === expandedPost);
          if (!p) return null;
          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono">
                  Scheduled Post
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1.5 h-7"
                  onClick={() => setExpandedPost(null)}
                >
                  <X className="w-3 h-3" />
                  Close
                </Button>
              </div>
              <PostCard post={p} showActions={false} />
            </div>
          );
        })()}

      {/* Gap fill */}
      {gapCount > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">
                {gapCount} slot{gapCount !== 1 ? 's' : ''} to fill
              </p>
              <p className="text-xs text-muted-foreground">
                No personal content? Generate from a trending topic.
              </p>
            </div>
            {/* Mode toggle */}
            <div className="flex items-center border border-border rounded-lg overflow-hidden text-xs font-mono">
              <button
                onClick={() => setResearchMode('llm')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 transition-colors',
                  researchMode === 'llm'
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Sparkles className="w-3 h-3" />
                AI Suggest
              </button>
              <button
                onClick={() => setResearchMode('manual')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 border-l border-border transition-colors',
                  researchMode === 'manual'
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Globe className="w-3 h-3" />
                Web Research
              </button>
            </div>
          </div>

          {researchMode === 'llm' && (
            <div className="space-y-3">
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
                onClick={loadLlmTopics}
                disabled={loadingTopics}
              >
                <Sparkles className="w-3 h-3" />
                {loadingTopics ? 'Generating...' : 'Find Topics'}
              </Button>
              <TopicList
                topics={displayTopics}
                generatingFor={generatingFor}
                onGenerate={(topic) => {
                  const nextEmpty = weekDays.find((d) => !getPostForDay(d) && d >= new Date());
                  if (nextEmpty) generateFromTopic(topic, nextEmpty);
                  else toast.error('No empty slots remaining this week');
                }}
              />
            </div>
          )}

          {researchMode === 'manual' && (
            <div className="space-y-4">
              <Card className="border-border/40">
                <CardHeader className="pb-2 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono">
                        Research Prompt
                      </p>
                    </div>
                    {researchPrompt && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1.5"
                        onClick={() => {
                          navigator.clipboard.writeText(researchPrompt);
                          toast.success(
                            'Prompt copied — paste it into Perplexity, ChatGPT, or any web AI',
                          );
                        }}
                      >
                        Copy Prompt
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pb-4 space-y-3">
                  {!researchPrompt ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Load the research prompt first:
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1.5"
                        onClick={async () => {
                          setLoadingTopics(true);
                          try {
                            const res = await fetch('/api/trending');
                            const data: { topics: TrendingTopic[]; researchPrompt: string } =
                              await res.json();
                            setResearchPrompt(data.researchPrompt ?? '');
                          } finally {
                            setLoadingTopics(false);
                          }
                        }}
                        disabled={loadingTopics}
                      >
                        <Globe className="w-3 h-3" />
                        {loadingTopics ? 'Loading...' : 'Load Research Prompt'}
                      </Button>
                    </div>
                  ) : (
                    <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap bg-muted/20 rounded-lg p-3 max-h-48 overflow-y-auto border border-border/30">
                      {researchPrompt}
                    </pre>
                  )}
                  <div className="text-xs text-muted-foreground/60 space-y-0.5">
                    <p>1. Copy prompt → paste into Perplexity / ChatGPT / any web AI</p>
                    <p>2. Copy the JSON response → paste below</p>
                    <p>3. Click Parse → select a topic → Generate post</p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Textarea
                  value={researchPaste}
                  onChange={(e) => setResearchPaste(e.target.value)}
                  placeholder='Paste the JSON array from the web AI here: [{ "title": "...", "summary": "...", "relevance": "..." }, ...]'
                  className="min-h-32 text-xs font-mono bg-muted/20 border-border/60 resize-none"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={handleParseResearch}
                  disabled={!researchPaste.trim()}
                >
                  Parse Results
                </Button>
              </div>

              <TopicList
                topics={parsedTopics}
                generatingFor={generatingFor}
                onGenerate={(topic) => {
                  const nextEmpty = weekDays.find((d) => !getPostForDay(d) && d >= new Date());
                  if (nextEmpty) generateFromTopic(topic, nextEmpty);
                  else toast.error('No empty slots remaining this week');
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Comment strategy */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono">
            Comment Strategy
          </p>
        </div>
        <Card className="border-border/30">
          <CardContent className="pt-4 space-y-2.5 pb-4">
            <p className="text-xs text-muted-foreground mb-3">
              Engagement in the first hour determines reach. After each post:
            </p>
            {COMMENT_TIPS.map((tip, i) => (
              <div key={i} className="flex gap-3 text-xs text-muted-foreground">
                <span className="shrink-0 font-mono text-foreground/30 w-4">{i + 1}.</span>
                <span>{tip}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Best times legend */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono">
            Posting Times
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
          {Object.entries(BEST_TIMES).map(([day, info]) => (
            <div key={day} className="flex items-center gap-2.5 text-xs">
              <div
                className={cn(
                  'w-1.5 h-1.5 rounded-full shrink-0',
                  info.quality === 'high'
                    ? 'bg-foreground/60'
                    : info.quality === 'medium'
                      ? 'bg-foreground/25'
                      : 'bg-border/40',
                )}
              />
              <span className="text-muted-foreground w-7 font-mono">{DAY_NAMES[Number(day)]}</span>
              <span className="text-muted-foreground/60">{info.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
