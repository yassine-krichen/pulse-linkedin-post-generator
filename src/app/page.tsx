'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  Shield,
  TrendingUp,
  Clock,
  Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Demo animation ────────────────────────────────────────────────────────────

const RAW_NOTE =
  `Spent 3h debugging a JWT race condition tonight. Two async calls hitting the auth middleware at the same millisecond — first one refreshes the token, second one still has the old one cached. Both succeed. Only one is valid. Took forever to reproduce in staging.`;

const GENERATED_POST =
  `JWT race conditions are sneaky.

Two requests arrive at the same millisecond. Auth middleware refreshes the token on request 1. Request 2 still has the old token cached — but both succeed.

Only one token is valid.

Here's what finally fixed it: a mutex lock on the refresh call. Simple, obvious in hindsight, impossible to spot without the right logs in place.

If your auth has concurrent requests, your token refresh probably isn't atomic.

Check it before production does.

#backend #auth #javascript`;

const TYPING_SPEED = 18; // ms per char
const PAUSE_AFTER_NOTE = 1200;
const FADE_DURATION = 600;
const PAUSE_AFTER_POST = 4000;

type DemoPhase = 'typing' | 'pausing' | 'showing' | 'resetting';

function AnimatedDemo() {
  const [phase, setPhase] = useState<DemoPhase>('typing');
  const [typed, setTyped] = useState('');
  const [postVisible, setPostVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let charIdx = 0;
    let timer: ReturnType<typeof setTimeout>;

    function typeNext() {
      if (cancelled) return;
      if (charIdx >= RAW_NOTE.length) {
        timer = setTimeout(() => {
          if (cancelled) return;
          setPhase('pausing');
          timer = setTimeout(() => {
            if (cancelled) return;
            setPhase('showing');
            setPostVisible(true);
            timer = setTimeout(() => {
              if (cancelled) return;
              setPhase('resetting');
              setPostVisible(false);
              timer = setTimeout(() => {
                if (cancelled) return;
                charIdx = 0;
                setTyped('');
                setPhase('typing');
                typeNext();
              }, FADE_DURATION);
            }, PAUSE_AFTER_POST);
          }, PAUSE_AFTER_NOTE);
        }, 0);
        return;
      }
      setTyped(RAW_NOTE.slice(0, charIdx + 1));
      charIdx++;
      timer = setTimeout(typeNext, TYPING_SPEED);
    }

    typeNext();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl mx-auto">
      {/* Raw note */}
      <div className="rounded-xl border border-border/40 bg-muted/10 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">
            Your note
          </span>
        </div>
        <p className="text-sm font-mono text-muted-foreground leading-relaxed min-h-[120px]">
          {typed}
          {phase === 'typing' && (
            <span className="inline-block w-0.5 h-3.5 bg-foreground/60 ml-0.5 animate-pulse" />
          )}
        </p>
      </div>

      {/* Generated post */}
      <div
        className={cn(
          'rounded-xl border border-border/40 bg-muted/10 p-5 space-y-3 transition-opacity',
          postVisible ? 'opacity-100 duration-700' : 'opacity-0 duration-300',
        )}
        style={{ transitionDuration: `${FADE_DURATION}ms` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">
            LinkedIn post
          </span>
          <Badge
            variant="outline"
            className="text-[9px] gap-0.5 py-0 h-4 text-emerald-500/80 border-emerald-500/30"
          >
            <CheckCircle2 className="w-2 h-2" />
            Reviewed
          </Badge>
        </div>
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-line min-h-[120px]">
          {GENERATED_POST}
        </p>
      </div>
    </div>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: 'Which AI model does it use?',
    a: 'claude-web-bridge — a local server that drives the real Claude.ai UI via browser automation. No API keys, no monthly bill, just the account you already have.',
  },
  {
    q: 'Does it post automatically?',
    a: "No. Pulse generates the post and saves it to your backlog. You copy, paste, and post manually on LinkedIn. There's no automation of the posting step — keeping you in full control and within LinkedIn's ToS.",
  },
  {
    q: "Will LinkedIn penalize AI-assisted content?",
    a: "LinkedIn penalizes low-quality, low-engagement generic content — not AI-assisted writing. They even ship their own AI writing assistant. Pulse addresses the quality problem by training on your specific technical background and voice, not a template.",
  },
  {
    q: 'Is this against LinkedIn ToS?',
    a: "LinkedIn's ToS prohibits automated bots that post without human involvement. Pulse is a writing tool. You read, edit, approve, then manually paste and post — same workflow as using any word processor or ghostwriter.",
  },
  {
    q: 'How do I prove it works?',
    a: 'Log your LinkedIn analytics in the Archive tab after each post. Impressions, likes, comments, shares — Pulse tracks them all and shows aggregate stats. One month of real data beats any theoretical argument.',
  },
];

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-2 w-full max-w-2xl mx-auto">
      {FAQ_ITEMS.map((item, i) => (
        <div key={i} className="border border-border/40 rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium hover:bg-muted/20 transition-colors"
            onClick={() => setOpen(open === i ? null : i)}
          >
            {item.q}
            <ChevronDown
              className={cn(
                'w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200',
                open === i && 'rotate-180',
              )}
            />
          </button>
          {open === i && (
            <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-3">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Comparison table ──────────────────────────────────────────────────────────

const COMPARISON = [
  {
    aspect: 'Understands your stack',
    manager: 'Unlikely without a lengthy brief',
    pulse: 'Yes — trained on your profile',
  },
  {
    aspect: 'Note → post speed',
    manager: '1–2 days turnaround',
    pulse: '30 seconds',
  },
  {
    aspect: 'Consistent during your vacation',
    manager: 'No',
    pulse: 'Yes',
  },
  {
    aspect: 'Monthly cost',
    manager: '€500–2,000',
    pulse: '~€0',
  },
  {
    aspect: 'Human reviews before posting',
    manager: 'Depends on the workflow',
    pulse: 'Always — you copy-paste manually',
  },
];

// ── Objection cards ───────────────────────────────────────────────────────────

const OBJECTIONS = [
  {
    icon: Shield,
    title: 'Will LinkedIn shadow-ban this?',
    body: "LinkedIn penalizes low-engagement generic content — not AI-assisted writing. They even ship their own AI writing tool. Pulse addresses the actual problem: output trained on your specific voice, projects, and technical depth.",
  },
  {
    icon: CheckCircle2,
    title: 'Is this against ToS?',
    body: "LinkedIn's ToS bans automated bots that post without human involvement. Pulse is a writing tool. You read, edit, approve, paste, and post. Same as a human ghostwriter — except it knows what a JWT race condition is.",
  },
  {
    icon: Brain,
    title: "What if the output sounds generic?",
    body: 'Every LLM call receives your full profile — your stack, writing voice, example posts, things you never say. The output sounds like you because it starts from you. You still edit before saving.',
  },
  {
    icon: TrendingUp,
    title: 'How do I know it actually works?',
    body: 'Track every post. Log LinkedIn analytics in the Archive tab — impressions, likes, comments, shares. Pulse aggregates them over time. Real numbers from your real audience beat any theoretical objection.',
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="space-y-24 pb-24">
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-16 text-center space-y-8">
        <div className="space-y-4">
          <Badge variant="outline" className="text-xs gap-1.5 px-3 py-1">
            <Zap className="w-3 h-3" />
            Personal edition · claude-web-bridge
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            From note to LinkedIn post.
            <br />
            <span className="text-muted-foreground">30 seconds.</span>
          </h1>
          <p className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            You did the work. Pulse turns your raw technical notes into polished LinkedIn posts — in
            your voice, with your projects, reviewed by you before anything goes live.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Link href="/generate" className={buttonVariants({ size: 'lg', className: 'gap-2' })}>
            <Zap className="w-4 h-4" />
            Open app
          </Link>
          <Link
            href="/archive"
            className={buttonVariants({ variant: 'ghost', size: 'lg', className: 'gap-1.5 text-muted-foreground' })}
          >
            View archive
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <AnimatedDemo />
      </section>

      {/* How it works */}
      <section className="max-w-2xl mx-auto px-6 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
          <p className="text-sm text-muted-foreground">Three steps. The hard part is yours — the writing isn&apos;t.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              icon: Brain,
              title: 'Paste your note',
              body: 'Raw is fine. Bullet points, messy prose, a Slack message to yourself at 11pm.',
            },
            {
              step: '02',
              icon: Zap,
              title: 'Pulse evaluates & writes',
              body: 'Evaluates if it’s worth posting, picks the best format, generates a complete post in your voice.',
            },
            {
              step: '03',
              icon: Clock,
              title: 'You review & post',
              body: 'Read it, edit it, copy it to LinkedIn. Pulse never posts on your behalf.',
            },
          ].map(({ step, icon: Icon, title, body }) => (
            <div key={step} className="space-y-3 p-5 rounded-xl border border-border/40 bg-muted/10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground/50">{step}</span>
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="max-w-2xl mx-auto px-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">vs. a social media manager</h2>
          <p className="text-sm text-muted-foreground">
            A human who doesn&apos;t know what a mutex is, costs €500/month, and needs a week of context.
          </p>
        </div>
        <div className="rounded-xl border border-border/40 overflow-hidden">
          <div className="grid grid-cols-3 text-xs font-medium text-muted-foreground bg-muted/20 border-b border-border/40">
            <div className="px-4 py-3"></div>
            <div className="px-4 py-3">Social media manager</div>
            <div className="px-4 py-3 text-foreground">Pulse</div>
          </div>
          {COMPARISON.map(({ aspect, manager, pulse }, i) => (
            <div
              key={aspect}
              className={cn(
                'grid grid-cols-3 text-sm',
                i < COMPARISON.length - 1 && 'border-b border-border/30',
              )}
            >
              <div className="px-4 py-3 text-muted-foreground font-medium">{aspect}</div>
              <div className="px-4 py-3 text-muted-foreground">{manager}</div>
              <div className="px-4 py-3 font-medium">{pulse}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Objections */}
      <section className="max-w-2xl mx-auto px-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Common objections</h2>
          <p className="text-sm text-muted-foreground">Answered directly.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {OBJECTIONS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="p-5 rounded-xl border border-border/40 bg-muted/10 space-y-3">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-semibold">{title}</p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">FAQ</h2>
        </div>
        <FaqAccordion />
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-6 text-center space-y-6">
        <div className="rounded-2xl border border-border/40 bg-muted/10 p-10 space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight">
            Ship the post. Keep the day job.
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            You already did the hard part. Pulse handles the write-up.
          </p>
          <Link href="/generate" className={buttonVariants({ size: 'lg', className: 'gap-2' })}>
            <Zap className="w-4 h-4" />
            Start generating
          </Link>
        </div>
      </section>
    </div>
  );
}
