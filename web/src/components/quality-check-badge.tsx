'use client';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { QualityCheckResult } from '@/types';
import { Sparkles, Wand2 } from 'lucide-react';

interface QualityCheckBadgeProps {
  qualityCheck: QualityCheckResult;
}

/**
 * Surfaces the standard-post lint/humanizer pass (see `lib/quality-check.ts`
 * and `lib/prompts/humanize.ts`) that already runs server-side on every
 * generate/regenerate — this just makes the outcome visible.
 */
export function QualityCheckBadge({ qualityCheck }: QualityCheckBadgeProps) {
  if (!qualityCheck.wasRevised) {
    return (
      <Badge
        variant="outline"
        className="text-[10px] gap-1 py-0.5 text-emerald-500/80 border-emerald-500/30"
      >
        <Sparkles className="w-2.5 h-2.5" />
        Clean — no AI patterns flagged
      </Badge>
    );
  }

  const count = qualityCheck.issuesFound.length;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Badge
            variant="outline"
            className="text-[10px] gap-1 py-0.5 text-amber-500/80 border-amber-500/30 cursor-default"
          >
            <Wand2 className="w-2.5 h-2.5" />
            {count} {count === 1 ? 'issue' : 'issues'} auto-fixed
          </Badge>
        }
      />
      <TooltipContent side="bottom" align="start" className="max-w-sm whitespace-pre-line">
        {qualityCheck.issuesFound.join('\n')}
      </TooltipContent>
    </Tooltip>
  );
}
