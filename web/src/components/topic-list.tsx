import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingTopic } from '@/types';
import { Sparkles } from 'lucide-react';

interface TopicListProps {
  topics: TrendingTopic[];
  generatingFor: string | null;
  onGenerate: (topic: TrendingTopic) => void;
}

export function TopicList({ topics, generatingFor, onGenerate }: TopicListProps) {
  if (topics.length === 0) return null;

  return (
    <div className="space-y-2">
      {topics.map((topic, i) => (
        <Card key={i} className="border-border/40">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug">{topic.title}</p>
                <p className="text-xs text-muted-foreground">{topic.summary}</p>
                {topic.relevance && (
                  <p className="text-xs text-muted-foreground/50">{topic.relevance}</p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-xs shrink-0 gap-1.5"
                disabled={generatingFor !== null}
                onClick={() => onGenerate(topic)}
              >
                <Sparkles className="w-3 h-3" />
                {generatingFor ? 'Working...' : 'Generate'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
