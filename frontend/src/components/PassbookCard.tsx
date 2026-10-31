'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { shortAddr, formatMst, circleStateName } from '@/lib/utils';

interface PassbookCardProps {
  address: string;
  contribution: bigint;
  maxMembers: number;
  memberCount: number;
  currentRound: number;
  totalRounds: number;
  state: number;
  isMyTurn?: boolean;
}

const stateConfig = {
  OPEN:    { color: 'var(--color-turmeric)', label: 'OPEN',    rotate: '-3deg' },
  RUNNING: { color: 'var(--color-marigold)', label: 'RUNNING', rotate: '2deg'  },
  DONE:    { color: 'var(--color-tulsi)',    label: 'DONE',    rotate: '-1deg' },
};

export function PassbookCard({
  address,
  contribution,
  maxMembers,
  memberCount,
  currentRound,
  totalRounds,
  state,
  isMyTurn,
}: PassbookCardProps) {
  const stateName = circleStateName(state);
  const cfg       = stateConfig[stateName as keyof typeof stateConfig] || stateConfig.OPEN;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="card relative overflow-hidden bg-surface border-2 border-border shadow-hard-md hover:shadow-hard-lg"
    >
      {/* "Your turn" banner */}
      {isMyTurn && (
        <div className="absolute top-0 left-0 right-0 py-1 text-center text-xs font-black uppercase tracking-wider bg-sindoor text-white">
          ⚡ Aapki baari! — Pay now
        </div>
      )}

      <div className={isMyTurn ? 'mt-6' : ''}>
        {/* Top row: address + stamp */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-mono text-[11px] text-text-muted uppercase tracking-wider">Circle Address</p>
            <p className="font-mono text-sm font-bold text-text-primary mt-0.5">{shortAddr(address)}</p>
          </div>
          {/* Stamp */}
          <span
            className="stamp font-mono text-xs px-2.5 py-0.5"
            style={{
              color: cfg.color,
              borderColor: cfg.color,
              transform: `rotate(${cfg.rotate})`,
            }}
          >
            {cfg.label}
          </span>
        </div>

        {/* Contribution */}
        <div className="mb-4">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-0.5">Per Round Deposit</p>
          <p className="font-mono text-2xl font-black text-text-primary tabular">{formatMst(contribution, 3)}</p>
        </div>

        <div className="w-full h-px bg-border/20 mb-4" />

        {/* Members progress */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1.5">Members Joined</p>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: maxMembers }, (_, i) => (
                <div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full border border-border"
                  style={{
                    background: i < memberCount ? 'var(--color-turmeric)' : 'transparent',
                  }}
                />
              ))}
            </div>
            <p className="text-xs font-mono font-bold text-text-primary mt-1">{memberCount}/{maxMembers} Filled</p>
          </div>

          {/* Round progress */}
          {state === 1 && (
            <div className="text-right">
              <p className="text-xs text-text-muted uppercase tracking-wider">Current Round</p>
              <p className="font-mono text-xl font-black text-text-primary tabular">{currentRound}/{totalRounds}</p>
            </div>
          )}
        </div>

        {/* Action button */}
        <Link
          href={`/circle/${address}`}
          className="btn btn-primary w-full text-center block"
        >
          {state === 0 ? 'Join Circle' : state === 1 ? 'View Living Circle' : 'View Results'}
        </Link>
      </div>
    </motion.div>
  );
}
