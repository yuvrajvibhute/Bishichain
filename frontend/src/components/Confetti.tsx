'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
}

const COLORS = ['#FF9933', '#138808', '#D9381E', '#FFD700', '#F5A623', '#2E7D32'];

export function Confetti({ active, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; r: number; color: string; scale: number; speed: number }>>([]);

  useEffect(() => {
    if (active) {
      const p = Array.from({ length: 45 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100, // %
        y: -10, // start above
        r: Math.random() * 360,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        scale: 0.6 + Math.random() * 0.8,
        speed: 1.5 + Math.random() * 2,
      }));
      setParticles(p);

      const timer = setTimeout(() => {
        setParticles([]);
        if (onComplete) onComplete();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [active, onComplete]);

  if (!active || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, rotate: 0, opacity: 1 }}
          animate={{
            y: '105vh',
            x: `${p.x + (Math.random() * 20 - 10)}vw`,
            rotate: p.r + 720,
            opacity: [1, 1, 0.8, 0],
          }}
          transition={{
            duration: p.speed,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          style={{
            position: 'absolute',
            width: `${10 * p.scale}px`,
            height: `${14 * p.scale}px`,
            backgroundColor: p.color,
            borderRadius: '2px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
          }}
        />
      ))}
    </div>
  );
}
