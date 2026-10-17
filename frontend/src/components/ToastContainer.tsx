'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { etherscanTx, shortAddr } from '@/lib/utils';

export interface Toast {
  id: string;
  type: 'pending' | 'success' | 'error' | 'info';
  title: string;
  message?: string;
  txHash?: string;
}

// Global toast store (simple, no redux needed)
type ToastListener = (toasts: Toast[]) => void;
let _toasts: Toast[] = [];
const _listeners = new Set<ToastListener>();

function notify() {
  _listeners.forEach(l => l([..._toasts]));
}

export const toasts = {
  add(t: Omit<Toast, 'id'>): string {
    const id = Math.random().toString(36).slice(2);
    _toasts.push({ ...t, id });
    notify();
    // Auto-remove success/error after 6s
    if (t.type !== 'pending') {
      setTimeout(() => toasts.remove(id), 6000);
    }
    return id;
  },
  remove(id: string) {
    _toasts = _toasts.filter(t => t.id !== id);
    notify();
  },
  update(id: string, patch: Partial<Toast>) {
    _toasts = _toasts.map(t => t.id === id ? { ...t, ...patch } : t);
    notify();
  },
};

function useToastStore(): Toast[] {
  const [state, setState] = useState<Toast[]>([..._toasts]);
  const listener = useCallback((t: Toast[]) => setState(t), []);

  // Subscribe
  if (typeof window !== 'undefined') {
    _listeners.add(listener);
  }

  return state;
}

const icons: Record<Toast['type'], string> = {
  pending: '⏳',
  success: '✅',
  error:   '❌',
  info:    'ℹ️',
};

const borderColors: Record<Toast['type'], string> = {
  pending: 'var(--color-turmeric)',
  success: 'var(--color-tulsi)',
  error:   'var(--color-sindoor)',
  info:    'var(--color-ink)',
};

export function ToastContainer() {
  const activeToasts = useToastStore();

  return (
    <div className="toast-container" role="status" aria-live="polite">
      <AnimatePresence>
        {activeToasts.map(t => (
          <motion.div
            key={t.id}
            layout
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0,   opacity: 1 }}
            exit={{    x: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="toast"
            style={{ borderLeftColor: borderColors[t.type], borderLeftWidth: 4 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <span className="text-base flex-shrink-0">{icons[t.type]}</span>
                <div className="min-w-0">
                  <p className="font-bold text-sm leading-tight">{t.title}</p>
                  {t.message && (
                    <p className="text-xs opacity-70 mt-0.5">{t.message}</p>
                  )}
                  {t.txHash && (
                    <a
                      href={etherscanTx(t.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-turmeric font-mono hover:underline mt-1 block"
                    >
                      {shortAddr(t.txHash)} ↗
                    </a>
                  )}
                </div>
              </div>
              <button
                onClick={() => toasts.remove(t.id)}
                className="text-xs opacity-40 hover:opacity-100 flex-shrink-0 mt-0.5"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
