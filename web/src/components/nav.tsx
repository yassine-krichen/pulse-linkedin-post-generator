'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Activity, Zap, Calendar, Layers, Archive, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const links = [
  { href: '/generate', label: 'Generate', icon: Zap },
  { href: '/planner', label: 'Planner', icon: Calendar },
  { href: '/backlog', label: 'Backlog', icon: Layers },
  { href: '/archive', label: 'Archive', icon: Archive },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground hover:text-foreground"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border/50 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-foreground text-background">
            <Activity className="w-4 h-4" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-tight text-foreground">
              Pulse
            </span>
            <span className="text-[10px] text-muted-foreground tracking-wide">
              Your work. LinkedIn-ready.
            </span>
          </div>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors',
                  active
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      <ThemeToggle />
    </nav>
  );
}
