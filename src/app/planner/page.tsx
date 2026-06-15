'use client';

import { useState, useEffect, useCallback } from 'react';
import { Post, TrendingTopic } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { PostCard } from '@/components/post-card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  'Each reply extends your post\'s visible window — treat them as mini-posts',
];

function getWeekBounds(offset: number): { start: Date; end: Date } {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

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
    const [allPosts, settings]: [Post[], { weeklyTarget: number }] = await Promise.all([
      postsRes.json(),
      settingsRes.json(),
    ]);
    setPosts(allPosts);
    setWeeklyTarget(settings.weeklyTarget);
  }, []);

  useEffect(() => {
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
          <h1 className="text-lg font-medium tracking-tight">Planner</h1>
          <p className="text-sm text-muted-foreground">
            {filledCount}/{weeklyTarget} post{weeklyTarget !== 1 ? 's' : ''} this week
            {gapCount > 0 && (
              <span className="text-foreground/50 ml-2">· {gapCount} gap{gapCount !== 1 ? 's' : ''}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-mono">Target/week:</span>
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                onClick={() => updateTarget(n)}
                className={cn(
                  'w-7 h-7 text-xs rounded border font-mono transition-colors',
                  weeklyTarget === n
                    ? 'border-foreground text-foreground'
                    : 'border-border text-muted-foreground hover:border-foreground/50',
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs px-2"
              onClick={() => setWeekOffset((o) => o - 1)}
            >
              ←
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs min-w-24"
              onClick={() => setWeekOffset(0)}
            >
              {weekLabel}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs px-2"
              onClick={() => setWeekOffset((o) => o + 1)}
            >
              →
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
                'border rounded p-2 space-y-2 min-h-28 flex flex-col',
                isToday ? 'border-foreground/30' : 'border-border/40',
                isPast && !dayPost ? 'opacity-40' : '',
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'text-xs font-mono',
                    isToday ? 'text-foreground font-medium' : 'text-muted-foreground',
                  )}
                >
                  {DAY_NAMES[day.getDay()]}
                </span>
                <span className="text-xs text-muted-foreground/60 font-mono">{day.getDate()}</span>
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
                      className="text-[10px] px-1"
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
                    <p className="text-[10px] text-muted-foreground/40 font-mono leading-tight">
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
                  className="text-xs"
                  onClick={() => setExpandedPost(null)}
                >
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
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {gapCount} slot{gapCount !== 1 ? 's' : ''} to fill
              </p>
              <p className="text-xs text-muted-foreground">
                No personal content? Generate from a trending topic.
              </p>
            </div>
            {/* Mode toggle */}
            <div className="flex items-center border border-border rounded overflow-hidden text-xs font-mono">
              <button
                onClick={() => setResearchMode('llm')}
                className={cn(
                  'px-3 py-1.5 transition-colors',
                  researchMode === 'llm'
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                AI Suggest
              </button>
              <button
                onClick={() => setResearchMode('manual')}
                className={cn(
                  'px-3 py-1.5 border-l border-border transition-colors',
                  researchMode === 'manual'
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Web Research
              </button>
            </div>
          </div>

          {researchMode === 'llm' && (
            <div className="space-y-3">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={loadLlmTopics}
                disabled={loadingTopics}
              >
                {loadingTopics ? 'Generating suggestions...' : 'Find Topics'}
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
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono">
                      Research Prompt
                    </p>
                    {researchPrompt && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          if (!researchPrompt) {
                            toast.error('Load the prompt first by clicking Find Topics in AI mode');
                            return;
                          }
                          navigator.clipboard.writeText(researchPrompt);
                          toast.success('Prompt copied — paste it into Perplexity, ChatGPT, or any web AI');
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
                        className="text-xs"
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
                        {loadingTopics ? 'Loading...' : 'Load Research Prompt'}
                      </Button>
                    </div>
                  ) : (
                    <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap bg-muted/20 rounded p-3 max-h-48 overflow-y-auto">
                      {researchPrompt}
                    </pre>
                  )}
                  <p className="text-xs text-muted-foreground/60">
                    1. Copy prompt → paste into Perplexity / ChatGPT / any web AI
                    <br />
                    2. Copy the JSON response → paste below
                    <br />
                    3. Click Parse → select a topic → Generate post
                  </p>
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
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono">
          Comment Strategy
        </p>
        <Card className="border-border/30">
          <CardHeader className="pb-1 pt-4">
            <p className="text-xs text-muted-foreground">
              Engagement in the first hour determines reach. After each post:
            </p>
          </CardHeader>
          <CardContent className="space-y-2.5 pb-4">
            {COMMENT_TIPS.map((tip, i) => (
              <div key={i} className="flex gap-3 text-xs text-muted-foreground">
                <span className="shrink-0 font-mono text-foreground/30">{i + 1}.</span>
                <span>{tip}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Best times legend */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono">
          Posting Times
        </p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1">
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

interface TopicListProps {
  topics: TrendingTopic[];
  generatingFor: string | null;
  onGenerate: (topic: TrendingTopic) => void;
}

function TopicList({ topics, generatingFor, onGenerate }: TopicListProps) {
  if (topics.length === 0) return null;

  return (
    <div className="space-y-2">
      {topics.map((topic, i) => (
        <Card key={i} className="border-border/40">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium">{topic.title}</p>
                <p className="text-xs text-muted-foreground">{topic.summary}</p>
                {topic.relevance && (
                  <p className="text-xs text-muted-foreground/50">{topic.relevance}</p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-xs shrink-0"
                disabled={generatingFor !== null}
                onClick={() => onGenerate(topic)}
              >
                {generatingFor ? '...' : 'Generate'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
