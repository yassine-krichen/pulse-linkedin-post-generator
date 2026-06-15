'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', label: 'Generate' },
  { href: '/planner', label: 'Planner' },
  { href: '/backlog', label: 'Backlog' },
  { href: '/archive', label: 'Archive' },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border/50 px-6 py-4 flex items-center gap-8">
      <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">
        LinkedIn Engine
      </span>
      <div className="flex items-center gap-6">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'text-sm transition-colors',
              pathname === link.href
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
