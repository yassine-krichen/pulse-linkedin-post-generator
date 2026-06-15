'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PostCard } from '@/components/post-card';
import { Post, PipelineResult } from '@/types';
import { toast } from 'sonner';

type Step = 'idle' | 'evaluating' | 'classifying' | 'generating' | 'done' | 'rejected' | 'error';

export default function GeneratePage() {
  const [input, setInput] = useState('');
  const [step, setStep] = useState<Step>('idle');
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [post, setPost] = useState<Post | null>(null);

  async function handleGenerate() {
    if (!input.trim() || input.trim().length < 10) {
      toast.error('Add more detail — describe what you did, built, or learned.');
      return;
    }

    setStep('evaluating');
    setResult(null);
    setPost(null);

    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });

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

  const isLoading = ['evaluating', 'classifying', 'generating'].includes(step);

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
      <div className="space-y-1">
        <h1 className="text-lg font-medium tracking-tight">Generate</h1>
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
            {isLoading ? <StepLabel step={step} /> : input.length > 0 ? `${input.length} chars · Ctrl+Enter to generate` : ''}
          </span>
          <Button
            onClick={handleGenerate}
            disabled={isLoading || !input.trim()}
            className="text-sm"
          >
            {isLoading ? '...' : 'Evaluate & Generate'}
          </Button>
        </div>
      </div>

      {step === 'rejected' && result && (
        <Card className="border-border/40">
          <CardContent className="pt-4 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Not quite postable yet</p>
            <p className="text-sm text-foreground">{result.evaluation.reason}</p>
            {result.evaluation.suggestions && (
              <p className="text-xs text-muted-foreground border-t border-border/40 pt-3">
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
        />
      )}
    </div>
  );
}

function StepLabel({ step }: { step: Step }) {
  const map: Partial<Record<Step, string>> = {
    evaluating: '○ Evaluating...',
    classifying: '○ Classifying format...',
    generating: '○ Generating post...',
  };
  return <span className="animate-pulse">{map[step] ?? ''}</span>;
}
