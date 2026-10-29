'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { DirectSepoliaConnect } from './DirectSepoliaConnect';
import { useChainId } from 'wagmi';
import { MST_TESTNET_CHAIN_ID, MST_MAINNET_CHAIN_ID } from '@/lib/wagmi';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeProvider';

export function Navbar() {
  const chainId = useChainId();
  const pathname = usePathname();
  const { theme, toggleTheme, isMobilePreview, toggleMobilePreview } = useTheme();
  const wrongNetwork = chainId !== undefined && chainId !== MST_TESTNET_CHAIN_ID && chainId !== MST_MAINNET_CHAIN_ID && chainId !== 0;

  return (
    <header className="border-b-2 border-border bg-surface/90 backdrop-blur-md sticky top-0 z-50 transition-colors">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image
            src="/bhishi-matka.svg"
            alt="Bhishi"
            width={40}
            height={40}
            className="transition-transform group-hover:scale-105"
          />
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-display text-xl font-black text-text-primary tracking-tight">
                भिशी Chain
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
              ⚠ <span className="hidden sm:inline">Unsupported</span> Network
            </motion.span>
          )}

          {/* Wallet Connection: Direct 1-click BridgeKey connect */}
          <DirectSepoliaConnect />
        </div>
      </div>
    </header>
  );
}
