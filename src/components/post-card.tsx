'use client';

import { useState } from 'react';
import { Post, PostContent, StandardPostContent, CarouselContent, ImagePostContent } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Copy,
  BookmarkPlus,
  CheckCircle2,
  Trash2,
  Image as ImageGuidanceIcon,
  Hash,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileText,
  Layers,
  ImageIcon,
  Pencil,
  Save,
  X,
  RefreshCw,
} from 'lucide-react';

type RegenerateTone = 'default' | 'casual' | 'punchier' | 'technical';

const TONE_LABELS: Record<RegenerateTone, string> = {
  default: 'Default',
  casual: 'Casual',
  punchier: 'Punchier',
  technical: 'Technical',
};

interface PostCardProps {
  post: Post;
  onSaveToBacklog?: (post: Post) => void;
  onMarkAsPosted?: (post: Post) => void;
  onDelete?: (post: Post) => void;
  onUpdate?: (post: Post) => void;
  showActions?: boolean;
}

function hashtagLine(hashtags: string[]): string {
  return hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ');
}

function recomputeContent(format: Post['format'], content: PostContent, hashtags: string[]): PostContent {
  if (format === 'standard') {
    const c = content as StandardPostContent;
    return {
      ...c,
      fullText: [c.hook, c.body, c.takeaway, c.cta, hashtagLine(hashtags)].filter(Boolean).join('\n\n'),
    };
  }
  if (format === 'image') {
    const c = content as ImagePostContent;
    return {
      ...c,
      fullText: [c.caption, hashtagLine(hashtags)].filter(Boolean).join('\n\n'),
    };
  }
  const c = content as CarouselContent;
  return {
    ...c,
    fullText: c.slides
      .map((s) => [`Slide ${s.slideNumber}: ${s.title}`, ...s.points.map((p) => `- ${p}`)].join('\n'))
      .join('\n\n'),
  };
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => toast.success('Copied to clipboard'));
}

const FORMAT_META = {
  standard: { label: 'Standard', icon: FileText },
  carousel: { label: 'Carousel', icon: Layers },
  image: { label: 'Image Post', icon: ImageIcon },
};

function FormatBadge({ format }: { format: Post['format'] }) {
  const { label, icon: Icon } = FORMAT_META[format];
  return (
    <Badge variant="outline" className="text-xs font-mono gap-1 py-0.5">
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
}

function StandardView({ content }: { content: StandardPostContent }) {
  return (
    <div className="space-y-4 text-sm leading-relaxed">
      {[
        { label: 'Hook', value: content.hook },
        { label: 'Body', value: content.body, pre: true },
        { label: 'Takeaway', value: content.takeaway },
        { label: 'CTA', value: content.cta },
      ].map(({ label, value, pre }) => (
        <div key={label}>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 font-mono">
            {label}
          </p>
          {pre ? (
            <p className="text-foreground whitespace-pre-line">{value}</p>
          ) : (
            <p className="text-foreground">{value}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function StandardEdit({
  content,
  onChange,
}: {
  content: StandardPostContent;
  onChange: (content: StandardPostContent) => void;
}) {
  return (
    <div className="space-y-3 text-sm">
      {(['hook', 'body', 'takeaway', 'cta'] as const).map((field) => (
        <div key={field}>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 font-mono">
            {field}
          </p>
          <Textarea
            value={content[field]}
            onChange={(e) => onChange({ ...content, [field]: e.target.value })}
            className="min-h-16 resize-none text-sm bg-muted/20 border-border/60"
          />
        </div>
      ))}
    </div>
  );
}

function CarouselEdit({
  content,
  onChange,
}: {
  content: CarouselContent;
  onChange: (content: CarouselContent) => void;
}) {
  function updateSlide(index: number, field: 'title' | 'points', value: string) {
    const slides = content.slides.map((slide, i) =>
      i === index
        ? { ...slide, [field]: field === 'points' ? value.split('\n').filter(Boolean) : value }
        : slide,
    );
    onChange({ ...content, slides });
  }

  return (
    <div className="space-y-4 text-sm">
      {content.slides.map((slide, i) => (
        <div key={i} className="border border-border/60 rounded-lg p-3 space-y-2 bg-muted/20">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
            Slide {slide.slideNumber}
          </p>
          <Input
            value={slide.title}
            onChange={(e) => updateSlide(i, 'title', e.target.value)}
            className="text-sm bg-background"
            placeholder="Slide title"
          />
          <Textarea
            value={slide.points.join('\n')}
            onChange={(e) => updateSlide(i, 'points', e.target.value)}
            className="min-h-20 resize-none text-sm bg-background font-mono"
            placeholder="One point per line"
          />
        </div>
      ))}
    </div>
  );
}

function ImageEdit({
  content,
  onChange,
}: {
  content: ImagePostContent;
  onChange: (content: ImagePostContent) => void;
}) {
  return (
    <div className="space-y-3 text-sm">
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 font-mono">
          Caption
        </p>
        <Textarea
          value={content.caption}
          onChange={(e) => onChange({ ...content, caption: e.target.value })}
          className="min-h-20 resize-none text-sm bg-muted/20 border-border/60"
        />
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 font-mono">
          Gemini Image Prompt
        </p>
        <Textarea
          value={content.imagePrompt ?? ''}
          onChange={(e) => onChange({ ...content, imagePrompt: e.target.value })}
          className="min-h-20 resize-none text-sm bg-muted/20 border-border/60 font-mono"
        />
      </div>
    </div>
  );
}

function CarouselView({ content }: { content: CarouselContent }) {
  const [active, setActive] = useState(0);
  const slide = content.slides[active];

  return (
    <div className="space-y-3">
      {/* Slide navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          disabled={active === 0}
          onClick={() => setActive((i) => i - 1)}
        >
          <ChevronLeft className="w-3 h-3" />
        </Button>
        <div className="flex gap-1.5 flex-wrap">
          {content.slides.map((s, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`text-xs w-7 h-7 border rounded font-mono transition-colors ${
                active === i
                  ? 'border-foreground text-foreground bg-muted'
                  : 'border-border text-muted-foreground hover:border-foreground/50'
              }`}
            >
              {s.slideNumber}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          disabled={active === content.slides.length - 1}
          onClick={() => setActive((i) => i + 1)}
        >
          <ChevronRight className="w-3 h-3" />
        </Button>
      </div>

      {slide && (
        <div className="border border-border/60 rounded-lg p-4 space-y-3 bg-muted/20">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
            Slide {slide.slideNumber} / {content.slides.length}
          </p>
          <p className="font-semibold text-foreground">{slide.title}</p>
          {slide.points.length > 0 && (
            <ul className="space-y-1.5">
              {slide.points.map((p, i) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-foreground/30 font-mono shrink-0">—</span>
                  {p}
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-border/40 pt-2 space-y-1">
            <p className="text-[10px] text-muted-foreground/60">Layout: {slide.layoutNotes}</p>
            <p className="text-[10px] text-muted-foreground/60">Image: {slide.imageStrategy}</p>
          </div>
        </div>
      )}

      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 font-mono">
          Full Text
        </p>
        <p className="text-sm text-muted-foreground whitespace-pre-line">{content.fullText}</p>
      </div>
    </div>
  );
}

function ImageView({ content }: { content: ImagePostContent }) {
  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 font-mono">
          Caption
        </p>
        <p className="text-foreground">{content.caption}</p>
      </div>
      {content.imagePrompt && (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 font-mono">
            Gemini Image Prompt
          </p>
          <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground font-mono leading-relaxed border border-border/40">
            {content.imagePrompt}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 text-xs gap-1.5"
            onClick={() => copyToClipboard(content.imagePrompt!)}
          >
            <Copy className="w-3 h-3" />
            Copy Image Prompt
          </Button>
        </div>
      )}
    </div>
  );
}

function getFullText(post: Post): string {
  const c = post.content;
  if ('fullText' in c) return c.fullText;
  return '';
}

export function PostCard({
  post,
  onSaveToBacklog,
  onMarkAsPosted,
  onDelete,
  onUpdate,
  showActions = true,
}: PostCardProps) {
  const fullText = getFullText(post);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftContent, setDraftContent] = useState<PostContent>(post.content);
  const [draftHashtags, setDraftHashtags] = useState(post.hashtags.join(', '));
  const [draftImageStrategy, setDraftImageStrategy] = useState(post.imageStrategy);
  const [tone, setTone] = useState<RegenerateTone>('default');
  const [regenerating, setRegenerating] = useState(false);

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tone }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to regenerate');
      }
      const updated: Post = await res.json();
      onUpdate?.(updated);
      toast.success('Regenerated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to regenerate');
    } finally {
      setRegenerating(false);
    }
  }

  function startEditing() {
    setDraftContent(post.content);
    setDraftHashtags(post.hashtags.join(', '));
    setDraftImageStrategy(post.imageStrategy);
    setEditing(true);
  }

  async function handleSaveEdit() {
    const hashtags = draftHashtags
      .split(',')
      .map((h) => h.trim().replace(/^#/, ''))
      .filter(Boolean);
    const content = recomputeContent(post.format, draftContent, hashtags);

    setSaving(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, hashtags, imageStrategy: draftImageStrategy }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to save changes');
      }
      const updated: Post = await res.json();
      onUpdate?.(updated);
      setEditing(false);
      toast.success('Changes saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{post.title}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <FormatBadge format={post.format} />
              {post.topicCategory && (
                <span className="text-[10px] text-muted-foreground font-mono bg-muted/40 px-1.5 py-0.5 rounded">
                  {post.topicCategory}
                </span>
              )}
              {post.source === 'trending' && (
                <Badge variant="secondary" className="text-[10px] gap-1 py-0.5">
                  <TrendingUp className="w-2.5 h-2.5" />
                  Trending
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {showActions && !editing && (
              <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={startEditing}>
                <Pencil className="w-3 h-3" />
                Edit
              </Button>
            )}
            {!editing && fullText && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
                onClick={() => copyToClipboard(fullText)}
              >
                <Copy className="w-3 h-3" />
                Copy
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {editing ? (
          <>
            {post.format === 'standard' && (
              <StandardEdit
                content={draftContent as StandardPostContent}
                onChange={setDraftContent}
              />
            )}
            {post.format === 'carousel' && (
              <CarouselEdit content={draftContent as CarouselContent} onChange={setDraftContent} />
            )}
            {post.format === 'image' && (
              <ImageEdit content={draftContent as ImagePostContent} onChange={setDraftContent} />
            )}
          </>
        ) : (
          <>
            {post.format === 'standard' && (
              <StandardView content={post.content as StandardPostContent} />
            )}
            {post.format === 'carousel' && (
              <CarouselView content={post.content as CarouselContent} />
            )}
            {post.format === 'image' && <ImageView content={post.content as ImagePostContent} />}
          </>
        )}

        <Separator className="opacity-30" />

        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <ImageGuidanceIcon className="w-3 h-3 mt-0.5 text-muted-foreground/60 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5 font-mono">
                Image guidance
              </p>
              {editing ? (
                <Input
                  value={draftImageStrategy}
                  onChange={(e) => setDraftImageStrategy(e.target.value)}
                  className="text-sm bg-background"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{post.imageStrategy}</p>
              )}
            </div>
          </div>
          {(editing || post.hashtags.length > 0) && (
            <div className="flex items-start gap-2">
              <Hash className="w-3 h-3 mt-0.5 text-muted-foreground/60 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5 font-mono">
                  Hashtags
                </p>
                {editing ? (
                  <Input
                    value={draftHashtags}
                    onChange={(e) => setDraftHashtags(e.target.value)}
                    placeholder="SystemsDesign, FullStack"
                    className="text-sm bg-background"
                  />
                ) : (
                  <p className="text-sm text-foreground">{hashtagLine(post.hashtags)}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <Separator className="opacity-30" />

        {editing ? (
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" className="text-xs gap-1.5" disabled={saving} onClick={handleSaveEdit}>
              <Save className="w-3 h-3" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs gap-1.5 text-muted-foreground"
              disabled={saving}
              onClick={() => setEditing(false)}
            >
              <X className="w-3 h-3" />
              Cancel
            </Button>
          </div>
        ) : (
          showActions && (
            <div className="flex gap-2 flex-wrap items-center">
              <Select value={tone} onValueChange={(v) => setTone(v as RegenerateTone)}>
                <SelectTrigger size="sm" className="text-xs h-7">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TONE_LABELS) as RegenerateTone[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {TONE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                className="text-xs gap-1.5"
                disabled={regenerating}
                onClick={handleRegenerate}
              >
                <RefreshCw className={`w-3 h-3 ${regenerating ? 'animate-spin' : ''}`} />
                {regenerating ? 'Regenerating...' : 'Regenerate'}
              </Button>
              {post.status === 'draft' && onSaveToBacklog && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs gap-1.5"
                  onClick={() => onSaveToBacklog(post)}
                >
                  <BookmarkPlus className="w-3 h-3" />
                  Save to Backlog
                </Button>
              )}
              {post.status !== 'posted' && onMarkAsPosted && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs gap-1.5"
                  onClick={() => onMarkAsPosted(post)}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Mark as Posted
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs gap-1.5 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(post)}
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </Button>
              )}
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
