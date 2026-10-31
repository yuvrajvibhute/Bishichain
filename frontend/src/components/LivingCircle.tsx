'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { addrColor, addrInitials, formatMst, shortAddr } from '@/lib/utils';

interface Member {
  address: string;
  joined: boolean;
  hasWon: boolean;
  paidThisRound: boolean;
  defaultCount: number;
  collateral: bigint;
  onTimeCount: number;
}

interface LivingCircleProps {
  members: Member[];
  maxMembers: number;
  potAmount: bigint;
  secondsToDeadline: number;
  roundDuration: number;
  currentRound: number;
  totalRounds: number;
  state: number; // 0=Open, 1=Active, 2=Completed
  recentWinner?: string;
  onMemberClick?: (addr: string) => void;
}

const SIZE   = 320;
const CENTER = SIZE / 2;
const RING_R = 110;
const POT_R  = 38;
const SEAT_R = 22;

function polarToXY(angle: number, r: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return {
    x: CENTER + r * Math.cos(rad),
    y: CENTER + r * Math.sin(rad),
  };
}

export function LivingCircle({
  members,
  maxMembers,
  potAmount,
  secondsToDeadline,
  roundDuration,
  currentRound,
  totalRounds,
  state,
  recentWinner,
  onMemberClick,
}: LivingCircleProps) {
  const prefersReduced = useReducedMotion();
  const [hoveredMember, setHoveredMember] = useState<string | null>(null);
  const [showWheel, setShowWheel] = useState(false);
  const [spinAngle, setSpinAngle] = useState(0);
  const [confetti, setConfetti] = useState(false);

  // Arc timer: how much of the ring has drained
  const timerFraction = roundDuration > 0
    ? Math.max(0, Math.min(1, secondsToDeadline / roundDuration))
    : 1;

  const arcAngle = timerFraction * 360;
  const circumference = 2 * Math.PI * RING_R;
  const timerStrokeDashoffset = circumference * (1 - timerFraction);

  // Winner spin animation
  useEffect(() => {
    if (recentWinner && !prefersReduced) {
      setShowWheel(true);
      let frame = 0;
      const totalFrames = 60;
      const animate = () => {
        frame++;
        // Ease out spin: fast then slow
        const ease = 1 - Math.pow(1 - frame / totalFrames, 3);
        setSpinAngle(ease * 720);
        if (frame < totalFrames) {
          requestAnimationFrame(animate);
        } else {
          setConfetti(true);
          setTimeout(() => { setShowWheel(false); setConfetti(false); }, 2500);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [recentWinner, prefersReduced]);

  // Time color: green → yellow → red as deadline approaches
  const timeColor = timerFraction > 0.5
    ? 'var(--color-tulsi)'
    : timerFraction > 0.2
    ? 'var(--color-turmeric)'
    : 'var(--color-sindoor)';

  // Seat positions around the ring
  const seatAngles = useMemo(() => {
    const n = maxMembers || 6;
    return Array.from({ length: n }, (_, i) => (360 / n) * i);
  }, [maxMembers]);

  const hoveredInfo = hoveredMember
    ? members.find(m => m.address === hoveredMember)
    : null;

  return (
    <div className="relative inline-block" style={{ width: SIZE, height: SIZE + 60 }}>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={`Bhishi circle, round ${currentRound} of ${totalRounds}`}
      >
        {/* Background ring */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RING_R}
          fill="none"
          stroke="var(--color-mist)"
          strokeWidth="18"
        />

        {/* Timer arc (drains clockwise) */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RING_R}
          fill="none"
          stroke={timeColor}
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={prefersReduced ? 0 : timerStrokeDashoffset}
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 1s ease' }}
        />

        {/* Inner border ring */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RING_R}
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="1.5"
          opacity="0.2"
        />

        {/* Pot (matka) in center */}
        <motion.g
          animate={prefersReduced ? {} : { scale: [1, 1.03, 1] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          style={{ originX: CENTER, originY: CENTER }}
        >
          {/* Pot shadow */}
          <ellipse cx={CENTER + 2} cy={CENTER + 2} rx={POT_R} ry={POT_R} fill="var(--color-ink)" opacity="0.1" />
          {/* Pot body */}
          <circle cx={CENTER} cy={CENTER} r={POT_R} fill="var(--color-turmeric)" stroke="var(--color-ink)" strokeWidth="2"/>
          {/* Pot shine */}
          <circle cx={CENTER - 10} cy={CENTER - 10} r={8} fill="white" opacity="0.2"/>
          {/* Pot text: amount */}
          <text
            x={CENTER}
            y={CENTER - 4}
            textAnchor="middle"
            fontFamily="monospace"
            fontSize="8"
            fontWeight="800"
            fill="var(--color-ink)"
          >
            {formatMst(potAmount, 3)}
          </text>
          <text
            x={CENTER}
            y={CENTER + 8}
            textAnchor="middle"
            fontFamily="monospace"
            fontSize="6"
            fill="var(--color-ink)"
            opacity="0.6"
          >
            IN POT
          </text>
        </motion.g>

        {/* Member seats */}
        {seatAngles.map((angle, idx) => {
          const pos   = polarToXY(angle, RING_R);
          const member= members[idx];
          if (!member) {
            // Empty seat
            return (
              <g key={idx}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={SEAT_R}
                  fill="var(--color-mist)"
                  stroke="var(--color-ink)"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  opacity="0.5"
                />
                <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize="12" opacity="0.3">+</text>
              </g>
            );
          }

          const isHovered  = hoveredMember === member.address;
          const isPaid     = member.paidThisRound;
          const isDefaulter= member.defaultCount > 0;
          const hasWon     = member.hasWon;
          const isWinner   = recentWinner === member.address;
          const bgColor    = addrColor(member.address);

          // Ring pulse color for unpaid members
          const pulseColor = state === 1 && !isPaid && timerFraction < 0.3
            ? 'var(--color-sindoor)'
            : 'var(--color-ink)';

          return (
            <motion.g
              key={member.address}
              animate={
                !prefersReduced && state === 1 && !isPaid && timerFraction < 0.3
                  ? { opacity: [1, 0.5, 1] }
                  : { opacity: 1 }
              }
              transition={{ repeat: Infinity, duration: 1.2 }}
              onClick={() => onMemberClick?.(member.address)}
              onMouseEnter={() => setHoveredMember(member.address)}
              onMouseLeave={() => setHoveredMember(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Shadow */}
              <circle cx={pos.x + 2} cy={pos.y + 2} r={SEAT_R} fill="var(--color-ink)" opacity="0.15"/>
              {/* Main circle */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={SEAT_R}
                fill={isDefaulter && state === 1 ? '#888' : bgColor}
                stroke={pulseColor}
                strokeWidth={isHovered ? 3 : 2}
                opacity={isDefaulter && state === 1 ? 0.5 : 1}
              />
              {/* Paid checkmark */}
              {isPaid && state === 1 && (
                <motion.text
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  x={pos.x}
                  y={pos.y + 5}
                  textAnchor="middle"
                  fontSize="14"
                >
                  ✓
                </motion.text>
              )}
              {/* Defaulter slash */}
              {isDefaulter && state === 1 && (
                <>
                  <line
                    x1={pos.x - 10}
                    y1={pos.y - 10}
                    x2={pos.x + 10}
                    y2={pos.y + 10}
                    stroke="var(--color-sindoor)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1={pos.x + 10}
                    y1={pos.y - 10}
                    x2={pos.x - 10}
                    y2={pos.y + 10}
                    stroke="var(--color-sindoor)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </>
              )}
              {/* Winner crown */}
              {hasWon && !isDefaulter && (
                <text x={pos.x} y={pos.y - SEAT_R - 2} textAnchor="middle" fontSize="12">
                  👑
                </text>
              )}
              {/* Initials if no check */}
              {!isPaid && !isDefaulter && (
                <text
                  x={pos.x}
                  y={pos.y + 4}
                  textAnchor="middle"
                  fontFamily="monospace"
                  fontSize="10"
                  fontWeight="700"
                  fill="var(--color-ink)"
                >
                  {addrInitials(member.address)}
                </text>
              )}
            </motion.g>
          );
        })}

        {/* Wheel spin overlay */}
        {showWheel && recentWinner && (
          <motion.g animate={{ rotate: spinAngle }} style={{ originX: CENTER, originY: CENTER }}>
            <circle cx={CENTER} cy={CENTER} r={90} fill="none" stroke="var(--color-turmeric)" strokeWidth="2" strokeDasharray="8 4"/>
          </motion.g>
        )}

        {/* Confetti particles */}
        {confetti && !prefersReduced && (
          <>
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * 360;
              const p = polarToXY(a, 80);
              return (
                <motion.circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={4}
                  fill={['#F2A900','#E8752A','#2D7A4F','#C1291B'][i % 4]}
                  initial={{ opacity: 1, scale: 1 }}
                  animate={{ opacity: 0, scale: 0, y: -30 }}
                  transition={{ duration: 1, delay: i * 0.05 }}
                />
              );
            })}
          </>
        )}
      </svg>

      {/* Round label below ring */}
      <div className="text-center mt-2">
        {state === 1 && (
          <>
            <p className="font-mono text-xs font-bold opacity-50 uppercase">
              Round {currentRound}/{totalRounds}
            </p>
            <p className="font-mono text-lg font-black tabular" style={{ color: timeColor }}>
              {secondsToDeadline > 0
                ? formatTime(secondsToDeadline)
                : 'Deadline passed'}
            </p>
          </>
        )}
        {state === 0 && (
          <p className="font-mono text-xs font-bold opacity-50 uppercase tracking-wider">
            Waiting for members…
          </p>
        )}
        {state === 2 && (
          <p className="font-mono text-sm font-black" style={{ color: 'var(--color-tulsi)' }}>
            ✓ Circle Complete!
          </p>
        )}
      </div>

      {/* Hover card */}
      <AnimatePresence>
        {hoveredInfo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute z-10 card"
            style={{
              top: '50%',
              left: SIZE + 8,
              transform: 'translateY(-50%)',
              minWidth: 180,
              boxShadow: 'var(--shadow-hard-sm)',
            }}
          >
            <p className="font-mono text-xs font-bold truncate mb-2">
              {shortAddr(hoveredInfo.address)}
            </p>
            <div className="text-xs space-y-1">
              <p>🟢 On-time: <strong>{hoveredInfo.onTimeCount}</strong></p>
              <p>🔴 Defaults: <strong>{hoveredInfo.defaultCount}</strong></p>
              <p>💎 Collateral: <strong className="tabular">{formatMst(hoveredInfo.collateral, 3)}</strong></p>
              {hoveredInfo.hasWon && <p className="text-tulsi font-bold">👑 Won this circle</p>}
              {hoveredInfo.paidThisRound && <p className="text-tulsi font-bold">✓ Paid round {currentRound}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
