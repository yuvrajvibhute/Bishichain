'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DirectSepoliaConnect } from './DirectSepoliaConnect';
import { useChainId } from 'wagmi';
import { SEPOLIA_CHAIN_ID } from '@/lib/wagmi';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeProvider';

export function Navbar() {
  const chainId = useChainId();
  const pathname = usePathname();
  const { theme, toggleTheme, isMobilePreview, toggleMobilePreview } = useTheme();
  const wrongNetwork = chainId !== undefined && chainId !== SEPOLIA_CHAIN_ID && chainId !== 0;

  return (
    <header className="border-b-2 border-border bg-surface/90 backdrop-blur-md sticky top-0 z-50 transition-colors">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-md bg-turmeric border-2 border-border shadow-hard-sm flex items-center justify-center font-display font-black text-ink text-lg group-hover:scale-105 transition-transform">
            भ
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-display text-xl font-black text-text-primary tracking-tight">
                भिशी
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-turmeric/20 text-turmeric border border-turmeric/40">
                .eth
              </span>
            </div>
            <span className="text-[10px] font-mono text-text-muted hidden sm:block tracking-wider uppercase mt-0.5">
              Decentralized ROSCA
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <Link
            href="/dashboard"
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold uppercase tracking-wider transition-all border-2 ${
              pathname === '/dashboard'
                ? 'bg-turmeric text-ink border-border shadow-hard-sm'
                : 'text-text-secondary hover:text-text-primary border-transparent hover:border-border/20'
            }`}
          >
            🏛️ Circles
          </Link>
          <Link
            href="/profile"
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold uppercase tracking-wider transition-all border-2 ${
              pathname === '/profile'
                ? 'bg-turmeric text-ink border-border shadow-hard-sm'
                : 'text-text-secondary hover:text-text-primary border-transparent hover:border-border/20'
            }`}
          >
            🛡️ Trust SBT
          </Link>
          <Link
            href="/#rules"
            className="px-3 py-1.5 rounded-md text-xs font-mono font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary transition-all border-2 border-transparent hover:border-border/20"
          >
            📖 Rules
          </Link>
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile phone frame toggle */}
          <button
            onClick={toggleMobilePreview}
            title={isMobilePreview ? 'Switch to Full Width View' : 'Preview Mobile App Mode'}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-bold border-2 border-border bg-surface hover:bg-surface-hover rounded transition-all text-text-primary shadow-hard-sm"
          >
            <span>📱</span>
            <span className="hidden xl:inline">{isMobilePreview ? 'Desktop View' : 'App Mode'}</span>
          </button>

          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            className="w-9 h-9 border-2 border-border bg-surface hover:bg-surface-hover rounded flex items-center justify-center text-text-primary shadow-hard-sm transition-all"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Wrong Network Indicator */}
          {wrongNetwork && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 text-xs font-bold text-sindoor bg-sindoor/10 border-2 border-sindoor px-2.5 py-1 rounded"
            >
              ⚠ <span className="hidden sm:inline">Switch to</span> Sepolia
            </motion.span>
          )}

          {/* Wallet Connection: Direct 1-click Sepolia connect */}
          <DirectSepoliaConnect />
        </div>
      </div>
    </header>
  );
}
