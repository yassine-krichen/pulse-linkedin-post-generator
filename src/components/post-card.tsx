'use client';

import { useState } from 'react';
import { Post, StandardPostContent, CarouselContent, ImagePostContent } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Copy,
  BookmarkPlus,
  CheckCircle2,
  Trash2,
  Image,
  Hash,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileText,
  Layers,
  ImageIcon,
} from 'lucide-react';

interface PostCardProps {
  post: Post;
  onSaveToBacklog?: (post: Post) => void;
  onMarkAsPosted?: (post: Post) => void;
  onDelete?: (post: Post) => void;
  showActions?: boolean;
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
  showActions = true,
}: PostCardProps) {
  const fullText = getFullText(post);

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
          {fullText && (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 text-xs gap-1.5"
              onClick={() => copyToClipboard(fullText)}
            >
              <Copy className="w-3 h-3" />
              Copy
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {post.format === 'standard' && (
          <StandardView content={post.content as StandardPostContent} />
        )}
        {post.format === 'carousel' && (
          <CarouselView content={post.content as CarouselContent} />
        )}
        {post.format === 'image' && <ImageView content={post.content as ImagePostContent} />}

        <Separator className="opacity-30" />

        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Image className="w-3 h-3 mt-0.5 text-muted-foreground/60 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5 font-mono">
                Image guidance
              </p>
              <p className="text-sm text-muted-foreground">{post.imageStrategy}</p>
            </div>
          </div>
          {post.hashtags.length > 0 && (
            <div className="flex items-start gap-2">
              <Hash className="w-3 h-3 mt-0.5 text-muted-foreground/60 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5 font-mono">
                  Hashtags
                </p>
                <p className="text-sm text-foreground">
                  {post.hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ')}
                </p>
              </div>
            </div>
          )}
        </div>

        {showActions && (
          <>
            <Separator className="opacity-30" />
            <div className="flex gap-2 flex-wrap">
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
