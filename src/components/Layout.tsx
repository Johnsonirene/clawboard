import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import BackButton from './BackButton';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isRoot = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)' }}>
      {/* Fixed top bar */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center px-6 h-14"
        style={{
          background: 'rgba(2, 6, 23, 0.85)',
          borderBottom: '1px solid rgba(51, 65, 85, 0.4)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center gap-4 w-full">
          {/* Back button — only visible when not on root */}
          {!isRoot && (
            <BackButton />
          )}

          {/* Title */}
          <h1
            className="text-lg font-semibold tracking-tight"
            style={{
              background: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            OpenClaw Benchmark
          </h1>
        </div>
      </header>

      {/* Main content area — padded below header */}
      <main className="flex-1 pt-14 flex flex-col">
        <div className={`px-4 py-6 md:px-8 md:py-8 ${isRoot ? 'flex-1 flex flex-col justify-center' : ''}`}>
          {children}
        </div>
      </main>
    </div>
  );
}
