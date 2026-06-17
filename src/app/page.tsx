'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PostCard } from '@/components/post-card';
import { Post, PipelineResult } from '@/types';
import { toast } from 'sonner';
import { Zap, Search, Tag, Wand2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 'idle' | 'evaluating' | 'classifying' | 'generating' | 'done' | 'rejected' | 'error';

const STEP_SEQUENCE: Step[] = ['evaluating', 'classifying', 'generating'];

const STEP_META: Record<string, { label: string; icon: React.ElementType }> = {
  evaluating: { label: 'Evaluating', icon: Search },
  classifying: { label: 'Classifying', icon: Tag },
  generating: { label: 'Generating', icon: Wand2 },
};

export default function GeneratePage() {
  const [input, setInput] = useState('');
  const [step, setStep] = useState<Step>('idle');
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [post, setPost] = useState<Post | null>(null);

  async function handleGenerate() {
    if (!input.trim() || input.trim().length < 10) {
      toast.error('Add more detail — describe what you did, built, or learned.');
      return;
    }

    setStep('evaluating');
    setActiveStepIdx(0);
    setResult(null);
    setPost(null);

    // Advance the step indicator at realistic intervals while the API runs.
    const timer1 = setTimeout(() => setActiveStepIdx(1), 3000);
    const timer2 = setTimeout(() => setActiveStepIdx(2), 6000);

    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const data: PipelineResult & { error?: string } = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error ?? 'Generation failed');
      }

      if (!data.evaluation.worthy) {
        setStep('rejected');
        setResult(data);
        return;
      }

      setPost(data.post ?? null);
      setResult(data);
      setStep('done');
    } catch (err) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setStep('error');
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  async function handleSaveToBacklog(p: Post) {
    await fetch(`/api/posts/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ready' }),
    });
    toast.success('Saved to backlog');
    setPost((prev) => (prev ? { ...prev, status: 'ready' } : prev));
  }

  async function handleMarkAsPosted(p: Post) {
    await fetch(`/api/posts/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'posted', postedDate: new Date().toISOString() }),
    });
    toast.success('Marked as posted');
    setPost((prev) => (prev ? { ...prev, status: 'posted' } : prev));
  }

  const isLoading = STEP_SEQUENCE.includes(step as (typeof STEP_SEQUENCE)[number]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">Generate</h1>
        <p className="text-sm text-muted-foreground">
          Describe what you built, learned, or did. Raw is fine.
        </p>
      </div>

      <div className="space-y-3">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="I built a REST API with NestJS that handles X. The tricky part was Y — I learned that Z..."
          className="min-h-36 resize-none text-sm bg-muted/20 border-border/60 font-mono placeholder:text-muted-foreground/40"
          disabled={isLoading}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleGenerate();
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-mono">
            {isLoading ? (
              <StepIndicator activeIdx={activeStepIdx} />
            ) : input.length > 0 ? (
              `${input.length} chars · Ctrl+Enter to generate`
            ) : (
              ''
            )}
          </span>
          <Button
            onClick={handleGenerate}
            disabled={isLoading || !input.trim()}
            size="sm"
            className="gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            {isLoading ? 'Working...' : 'Evaluate & Generate'}
          </Button>
        </div>
      </div>

      {step === 'rejected' && result && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500/70 shrink-0" />
              <p className="text-sm font-medium">Not quite postable yet</p>
            </div>
            <p className="text-sm text-muted-foreground pl-6">{result.evaluation.reason}</p>
            {result.evaluation.suggestions && (
              <p className="text-xs text-muted-foreground/70 border-t border-border/40 pt-3 pl-6">
                → {result.evaluation.suggestions}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {step === 'done' && post && (
        <PostCard
          post={post}
          onSaveToBacklog={post.status === 'draft' ? handleSaveToBacklog : undefined}
          onMarkAsPosted={post.status !== 'posted' ? handleMarkAsPosted : undefined}
          onUpdate={setPost}
        />
      )}
    </div>
  );
}

function StepIndicator({ activeIdx }: { activeIdx: number }) {
  return (
    <div className="flex items-center gap-3">
      {STEP_SEQUENCE.map((s, i) => {
        const { label, icon: Icon } = STEP_META[s];
        const done = i < activeIdx;
        const active = i === activeIdx;
        return (
          <div
            key={s}
            className={cn(
              'flex items-center gap-1 text-xs transition-colors',
              active ? 'text-foreground' : done ? 'text-foreground/40' : 'text-muted-foreground/30',
            )}
          >
            <Icon className={cn('w-3 h-3', active && 'animate-pulse')} />
            {label}
            {i < STEP_SEQUENCE.length - 1 && (
              <span className="ml-1 text-muted-foreground/20">·</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
