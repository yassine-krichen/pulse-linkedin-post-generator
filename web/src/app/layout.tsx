import type { Metadata } from 'next';
import { Space_Grotesk, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Nav } from '@/components/nav';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme-provider';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Pulse',
  description: 'Your work. LinkedIn-ready.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <Nav />
          <main className="flex-1">{children}</main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
