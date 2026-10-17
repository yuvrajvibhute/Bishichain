'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { parseSbtMetadata } from '@/lib/utils';
import { useRef } from 'react';

interface TrustCardProps {
  score: number;
  completed: number;
  onTime: number;
  defaults: number;
  address: string;
  imageDataUri?: string;
}

export function TrustCard({ score, completed, onTime, defaults, address, imageDataUri }: TrustCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [12, -12]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-12, 12]), { stiffness: 300, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top)  / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const scoreColor = score >= 0 ? 'var(--color-tulsi)' : 'var(--color-sindoor)';
  const metadata = imageDataUri ? parseSbtMetadata(imageDataUri) : null;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 800 }}
      className="cursor-pointer select-none"
    >
      <div
        className="card relative overflow-hidden"
        style={{
          width: 300,
          height: 420,
          boxShadow: '8px 8px 0 var(--color-ink)',
        }}
      >
        {/* Header stripe */}
        <div
          className="absolute top-0 left-0 right-0 h-20"
          style={{ background: 'var(--color-turmeric)' }}
        />

        {/* Title */}
        <div className="relative pt-4 px-5">
          <p className="font-mono text-xs font-bold opacity-60 tracking-[0.15em] uppercase">Bhishi Trust Score</p>
          <h2 className="font-display text-2xl font-black mt-1">भरोसेमंद</h2>
        </div>

        {/* Score big number */}
        <div className="mt-8 px-5 flex items-baseline gap-2">
          <span
            className="font-mono text-7xl font-black tabular leading-none"
            style={{ color: scoreColor }}
          >
            {score >= 0 ? '+' : ''}{score}
          </span>
          <span className="text-sm font-bold opacity-50">pts</span>
        </div>

        {/* Stats row */}
        <div className="mt-5 mx-5 grid grid-cols-3 gap-2">
          {[
            { label: 'Circles', value: completed, color: 'var(--color-ink)' },
            { label: 'On Time', value: onTime,    color: 'var(--color-tulsi)' },
            { label: 'Defaults',value: defaults,  color: 'var(--color-sindoor)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <p className="font-mono text-2xl font-black tabular" style={{ color }}>{value}</p>
              <p className="text-xs opacity-50 mt-0.5 uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="divider-dashed mx-5 mt-4" />

        {/* Address */}
        <div className="px-5">
          <p className="font-mono text-xs opacity-40 break-all">{address}</p>
        </div>

        {/* Soulbound badge */}
        <div className="absolute bottom-5 right-5">
          <span
            className="stamp stamp-done text-xs"
            style={{ transform: 'rotate(3deg)', color: 'var(--color-tulsi)' }}
          >
            SOULBOUND
          </span>
        </div>

        {/* Rangoli pattern (decorative) */}
        <svg
          className="absolute bottom-4 left-4 opacity-5"
          width="60"
          height="60"
          viewBox="0 0 60 60"
        >
          <polygon points="30,5 55,50 5,50" fill="none" stroke="currentColor" strokeWidth="2"/>
          <polygon points="30,55 5,10 55,10" fill="none" stroke="currentColor" strokeWidth="2"/>
          <circle cx="30" cy="30" r="8" fill="none" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </div>
    </motion.div>
  );
}
