'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';

export default function LandingPage() {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'problem' | 'solution'>('solution');

  return (
    <div className="flex flex-col min-h-screen">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. HERO SECTION
          ──────────────────────────────────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 px-4 overflow-hidden border-b-2 border-border bg-surface/50">
        {/* Subtle background glow effect */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-turmeric/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Eyebrow badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-border bg-surface shadow-hard-sm mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-tulsi animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-text-primary">
              Live on MST Mainnet/Testnet            </span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl sm:text-6xl md:text-7xl font-black text-text-primary tracking-tight leading-[1.08] mb-6"
          >
            Panchayat on-chain. <br />
            <span className="text-turmeric underline decoration-wavy decoration-turmeric/40">
              Bachat
            </span>{' '}
            bina organizer.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-xl text-text-secondary max-w-2xl mx-auto mb-8 font-ui leading-relaxed"
          >
            Replace WhatsApp chaos, disputed spreadsheets, and runaway organizers with trustless smart contracts on Ethereum.
            Lock collateral, automate pot draws via{' '}
            <code className="text-turmeric font-mono px-1.5 py-0.5 rounded bg-surface border border-border text-sm">
              prevrandao
            </code>
            , and mint your Soulbound credit score.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-14"
          >
            <Link href="/dashboard" className="btn btn-primary btn-lg shadow-hard-lg">
              <span>🚀 Launch Circles</span>
            </Link>
            <Link href="/dashboard?create=true" className="btn btn-secondary btn-lg shadow-hard-md">
              <span>➕ Nayi Bhishi Banayein</span>
            </Link>
            <Link href="/profile" className="btn btn-outline btn-lg font-mono text-xs">
              <span>🛡️ Check Trust Score</span>
            </Link>
          </motion.div>

          {/* Protocol Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto pt-6 border-t-2 border-border/20 font-mono text-xs">
            <div className="p-3 bg-surface border-2 border-border rounded shadow-hard-sm">
              <div className="text-text-muted text-[10px] uppercase">Organizer Fee</div>
              <div className="text-xl font-black text-turmeric mt-0.5">0.00%</div>
              <div className="text-[10px] text-text-secondary mt-0.5">Zero platform cut</div>
            </div>
            <div className="p-3 bg-surface border-2 border-border rounded shadow-hard-sm">
              <div className="text-text-muted text-[10px] uppercase">Collateral Escrow</div>
              <div className="text-xl font-black text-tulsi mt-0.5">100%</div>
              <div className="text-[10px] text-text-secondary mt-0.5">Auto-slashes defaulters</div>
            </div>
            <div className="p-3 bg-surface border-2 border-border rounded shadow-hard-sm">
              <div className="text-text-muted text-[10px] uppercase">Anti-Ghosting Holdback</div>
              <div className="text-xl font-black text-marigold mt-0.5">30%</div>
              <div className="text-[10px] text-text-secondary mt-0.5">Held till final round</div>
            </div>
            <div className="p-3 bg-surface border-2 border-border rounded shadow-hard-sm">
              <div className="text-text-muted text-[10px] uppercase">Trust Score</div>
              <div className="text-xl font-black text-text-primary mt-0.5">ERC-721 SBT</div>
              <div className="text-[10px] text-text-secondary mt-0.5">On-chain SVG metadata</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. THE REAL PROBLEM VS THE BHISHI GUARANTEE
          ──────────────────────────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 px-4 bg-primary border-b-2 border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-sindoor">
              Why Centralized Committees Fail
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-text-primary mt-2">
              The WhatsApp Nightmare vs. Smart Contracts
            </h2>
            <p className="text-sm text-text-secondary mt-2">
              Chit funds handle over $30 Billion annually across India, but rely entirely on fragile personal trust.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Left Card: Traditional WhatsApp Committee */}
            <div className="card p-6 border-2 border-sindoor bg-surface relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 text-xs font-mono font-bold bg-sindoor/15 text-sindoor border border-sindoor">
                    ⚠️ TRADITIONAL ROSCA
                  </span>
                  <span className="font-mono text-xs text-sindoor font-bold">VULNERABLE</span>
                </div>
                <h3 className="font-display text-2xl font-bold text-text-primary mb-2">
                  The Organizer Ghosted
                </h3>
                <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                  Every month it&apos;s the same story: 12 unanswered WhatsApp messages, disputed ledgers, and one person holding the kitty. Then someone wins Round 1 and disappears.
                </p>
              </div>

              {/* WhatsApp Mockup */}
              <div className="rounded-lg border-2 border-border bg-[#E5DDD5] dark:bg-[#111B21] p-3 space-y-2 font-ui text-xs">
                <div className="bg-[#075E54] text-white px-3 py-2 rounded flex items-center justify-between font-bold">
                  <span>Bhishi Group 2024 💰 (5 members)</span>
                  <span className="bg-sindoor text-white text-[10px] px-1.5 py-0.5 rounded">12 unread</span>
                </div>
                <div className="bg-white dark:bg-[#202C33] text-black dark:text-white p-2 rounded shadow-sm max-w-[80%]">
                  <span className="text-[10px] font-bold text-[#075E54] block">Ravi</span>
                  Bhai is it my turn this month? Who has the money?
                </div>
                <div className="bg-[#DCF8C6] dark:bg-[#005C4B] text-black dark:text-white p-2 rounded shadow-sm max-w-[80%] ml-auto text-right">
                  <span className="text-[10px] font-bold text-tulsi block">Priya</span>
                  Maine toh UPI kar diya tha pichle hafte!
                </div>
                <div className="bg-sindoor/10 border border-sindoor text-sindoor p-2 rounded text-center font-mono font-bold text-[11px]">
                  ❌ Admin removed everyone • ₹12,000 Unaccounted
                </div>
              </div>
            </div>

            {/* Right Card: The Bhishi.eth Guarantee */}
            <div className="card p-6 border-2 border-tulsi bg-surface relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 text-xs font-mono font-bold bg-tulsi/15 text-tulsi border border-tulsi">
                    ✓ BHISHI.MST PROTOCOL
                  </span>
                  <span className="font-mono text-xs text-tulsi font-bold">100% AUTONOMOUS</span>
                </div>
                <h3 className="font-display text-2xl font-bold text-text-primary mb-2">
                  The Contract is the Organizer
                </h3>
                <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                  No human middleman can touch or misappropriate funds. Deposits are escrowed, deadlines are enforced by timestamps, and the pot is awarded through mathematical randomness.
                </p>
              </div>

              {/* Smart Contract Guarantee Mockup */}
              <div className="rounded-lg border-2 border-border bg-surface-hover p-4 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between p-2 bg-surface border border-border rounded">
                  <span className="text-text-muted">Escrowed Collateral:</span>
                  <span className="font-bold text-tulsi">100% Refundable</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-surface border border-border rounded">
                  <span className="text-text-muted">Defaulter Penalty:</span>
                  <span className="font-bold text-sindoor">Instant Slash to Pot</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-surface border border-border rounded">
                  <span className="text-text-muted">Winner Randomness:</span>
                  <span className="font-bold text-turmeric">block.prevrandao PRNG</span>
                </div>
                <div className="p-2 bg-tulsi/15 border border-tulsi text-tulsi text-center font-bold">
                  🛡️ Pull-Payment Claim System (Zero Reentrancy Risk)
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. THE 4 INVARIANT RULES OF BHISHI
          ──────────────────────────────────────────────────────────────────────────── */}
      <section id="rules" className="py-16 md:py-24 px-4 bg-surface border-b-2 border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-turmeric">
              Mathematical Game Theory
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-text-primary mt-2">
              The 4 Bulletproof Rules of Bhishi.mst
            </h2>
            <p className="text-sm text-text-secondary mt-2">
              Engineered to make honesty the only mathematically profitable strategy for all committee members.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Rule 1 */}
            <div className="card p-5 bg-primary border-2 border-border flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-md bg-turmeric text-ink border-2 border-border font-mono font-black text-lg flex items-center justify-center mb-4 shadow-hard-sm">
                  01
                </div>
                <h4 className="font-display text-lg font-bold text-text-primary mb-2">
                  Collateral Escrow
                </h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Every member locks 1x round contribution upfront as collateral upon joining. If you pay on time every round, your collateral is refunded 100%.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/20 text-[11px] font-mono text-tulsi font-bold">
                ✓ Slashes if round missed
              </div>
            </div>

            {/* Rule 2 */}
            <div className="card p-5 bg-primary border-2 border-border flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-md bg-marigold text-white border-2 border-border font-mono font-black text-lg flex items-center justify-center mb-4 shadow-hard-sm">
                  02
                </div>
                <h4 className="font-display text-lg font-bold text-text-primary mb-2">
                  Autonomous Settle
                </h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  When the countdown expires or all members deposit, any user or keeper can settle the round. Defaulters get slashed and a random non-winner takes the pot.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/20 text-[11px] font-mono text-marigold font-bold">
                ✓ Permissionless Keeper Call
              </div>
            </div>

            {/* Rule 3 */}
            <div className="card p-5 bg-primary border-2 border-border flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-md bg-sindoor text-white border-2 border-border font-mono font-black text-lg flex items-center justify-center mb-4 shadow-hard-sm">
                  03
                </div>
                <h4 className="font-display text-lg font-bold text-text-primary mb-2">
                  30% Anti-Ghosting
                </h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Early winners receive 70% of the pot immediately. 30% is held back in smart-contract escrow and only released when the entire committee finishes.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/20 text-[11px] font-mono text-sindoor font-bold">
                ✓ Eliminates &quot;Win &amp; Ghost&quot;
              </div>
            </div>

            {/* Rule 4 */}
            <div className="card p-5 bg-primary border-2 border-border flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-md bg-tulsi text-white border-2 border-border font-mono font-black text-lg flex items-center justify-center mb-4 shadow-hard-sm">
                  04
                </div>
                <h4 className="font-display text-lg font-bold text-text-primary mb-2">
                  Soulbound Trust SBT
                </h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Each completed circle stamps a non-transferable ERC-721 NFT in your wallet. Earn +10 pts for on-time payments, -50 pts for defaults.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/20 text-[11px] font-mono text-tulsi font-bold">
                ✓ Portable Web3 Reputation
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. CTA READY BANNER
          ──────────────────────────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 px-4 bg-primary text-center">
        <div className="max-w-3xl mx-auto card p-8 sm:p-12 border-2 border-border bg-surface shadow-hard-lg">
          <div className="text-4xl mb-4">🪙</div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-text-primary mb-3">
            Ready to Start Your First Bhishi?
          </h2>
          <p className="text-text-secondary text-sm sm:text-base max-w-xl mx-auto mb-8 font-ui">
            Connect your wallet, deploy a circle in 30 seconds, or join an active community pool on MST Testnet.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/dashboard" className="btn btn-primary btn-lg shadow-hard-md">
              Shuru Karein (Go to Circles) →
            </Link>
            <Link href="/profile" className="btn btn-outline btn-lg">
              Check Your Trust Card
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5. FOOTER
          ──────────────────────────────────────────────────────────────────────────── */}
      <footer className="py-8 px-4 border-t-2 border-border bg-surface text-center font-mono text-xs text-text-muted">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-text-primary text-sm">भिशी.mst</span>
            <span>• Decentralized Community Savings</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="hover:text-text-primary transition-colors">
              Circles
            </Link>
            <Link href="/profile" className="hover:text-text-primary transition-colors">
              Trust Score
            </Link>
            <a
              href="https://testnet.mstscan.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text-primary transition-colors"
            >
              MSTScan ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
