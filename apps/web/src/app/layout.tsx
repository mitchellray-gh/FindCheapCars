import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AutoFind - Reliable Used Cars Under $15K',
  description:
    'Find the best used cars under $15,000 with AI-powered scoring for reliability and value.',
  keywords: 'used cars, car search, reliable cars, affordable cars, car scoring',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen`}>
        <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="flex items-center justify-center w-9 h-9 bg-blue-600 rounded-lg group-hover:bg-blue-500 transition-colors">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 17h.01M16 17h.01M3 11l1.5-5A2 2 0 016.4 4h11.2a2 2 0 011.9 1.4L21 11M3 11h18M3 11v6a1 1 0 001 1h1a2 2 0 004 0h8a2 2 0 004 0h1a1 1 0 001-1v-6"
                    />
                  </svg>
                </div>
                <div>
                  <span className="text-lg font-bold text-white tracking-tight">
                    AutoFind
                  </span>
                  <span className="hidden sm:block text-xs text-slate-400 -mt-0.5">
                    Reliable Used Cars Under $15K
                  </span>
                </div>
              </Link>

              <div className="flex items-center gap-1">
                <Link
                  href="/"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Dashboard
                </Link>
                <a
                  href="#how-it-works"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  How It Works
                </a>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
