'use client';

import { useState } from 'react';
import { Post, StandardPostContent, CarouselContent, ImagePostContent } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

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

function FormatBadge({ format }: { format: Post['format'] }) {
  const labels = { standard: 'Standard', carousel: 'Carousel', image: 'Image Post' };
  return (
    <Badge variant="outline" className="text-xs tracking-wide uppercase font-mono">
      {labels[format]}
    </Badge>
  );
}

function StandardView({ content }: { content: StandardPostContent }) {
  return (
    <div className="space-y-4 text-sm leading-relaxed">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-mono">Hook</p>
        <p className="text-foreground">{content.hook}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-mono">Body</p>
        <p className="text-foreground whitespace-pre-line">{content.body}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-mono">Takeaway</p>
        <p className="text-foreground">{content.takeaway}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-mono">CTA</p>
        <p className="text-foreground">{content.cta}</p>
      </div>
    </div>
  );
}

function CarouselView({ content }: { content: CarouselContent }) {
  const [active, setActive] = useState(0);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {content.slides.map((s, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`text-xs px-3 py-1 border rounded font-mono transition-colors ${
              active === i
                ? 'border-foreground text-foreground'
                : 'border-border text-muted-foreground hover:border-foreground/50'
            }`}
          >
            {s.slideNumber}
          </button>
        ))}
      </div>
      {content.slides[active] && (
        <div className="border border-border rounded p-4 space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono">
            Slide {content.slides[active].slideNumber}
          </p>
          <p className="font-medium text-foreground">{content.slides[active].title}</p>
          {content.slides[active].points.length > 0 && (
            <ul className="space-y-1">
              {content.slides[active].points.map((p, i) => (
                <li key={i} className="text-sm text-muted-foreground">
                  — {p}
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground border-t border-border/50 pt-3">
            Layout: {content.slides[active].layoutNotes}
          </p>
          <p className="text-xs text-muted-foreground">
            Image: {content.slides[active].imageStrategy}
          </p>
        </div>
      )}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-mono">
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
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-mono">Caption</p>
        <p className="text-foreground">{content.caption}</p>
      </div>
      {content.imagePrompt && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-mono">
            Gemini Image Prompt
          </p>
          <div className="bg-muted/30 rounded p-3 text-xs text-muted-foreground font-mono leading-relaxed">
            {content.imagePrompt}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 text-xs"
            onClick={() => copyToClipboard(content.imagePrompt!)}
          >
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

export function PostCard({ post, onSaveToBacklog, onMarkAsPosted, onDelete, showActions = true }: PostCardProps) {
  const fullText = getFullText(post);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="font-medium text-sm text-foreground">{post.title}</p>
            <div className="flex items-center gap-2">
              <FormatBadge format={post.format} />
              {post.topicCategory && (
                <span className="text-xs text-muted-foreground font-mono">
                  {post.topicCategory}
                </span>
              )}
              {post.source === 'trending' && (
                <Badge variant="secondary" className="text-xs">
                  Trending
                </Badge>
              )}
            </div>
          </div>
          {fullText && (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 text-xs"
              onClick={() => copyToClipboard(fullText)}
            >
              Copy Post
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {post.format === 'standard' && <StandardView content={post.content as StandardPostContent} />}
        {post.format === 'carousel' && <CarouselView content={post.content as CarouselContent} />}
        {post.format === 'image' && <ImageView content={post.content as ImagePostContent} />}

        <Separator className="opacity-30" />

        <div className="space-y-2">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1 font-mono">
              Image
            </p>
            <p className="text-sm text-muted-foreground">{post.imageStrategy}</p>
          </div>
          {post.hashtags.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1 font-mono">
                Hashtags
              </p>
              <p className="text-sm text-foreground">
                {post.hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ')}
              </p>
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
                  className="text-xs"
                  onClick={() => onSaveToBacklog(post)}
                >
                  Save to Backlog
                </Button>
              )}
              {post.status !== 'posted' && onMarkAsPosted && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => onMarkAsPosted(post)}
                >
                  Mark as Posted
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(post)}
                >
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
