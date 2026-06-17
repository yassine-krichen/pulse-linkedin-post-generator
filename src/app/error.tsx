'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[unhandled UI error]', error);
  }, [error]);

  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center space-y-4">
      <AlertTriangle className="w-6 h-6 text-amber-500/70 mx-auto" />
      <p className="text-sm font-medium">Something went wrong</p>
      <p className="text-sm text-muted-foreground">
        The page hit an unexpected error. Your data is safe — try reloading this view.
      </p>
      <Button size="sm" variant="outline" className="gap-1.5" onClick={reset}>
        <RotateCcw className="w-3 h-3" />
        Try again
      </Button>
    </div>
  );
}
