'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { formatMst, mstscanTx } from '@/lib/utils';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toasts } from './ToastContainer';
import { useEffect, useRef } from 'react';

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  amount?: bigint;
  actionLabel: string;
  onConfirm: () => void;
  isLoading?: boolean;
  microcopy?: string;
}

export function ActionSheet({
  isOpen,
  onClose,
  title,
  description,
  amount,
  actionLabel,
  onConfirm,
  isLoading,
  microcopy,
}: ActionSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="sheet-overlay"
            onClick={onClose}
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            {/* Handle bar */}
            <div className="w-10 h-1 bg-ink rounded-full mx-auto mb-5 opacity-20" />

            <h2 className="font-display text-xl font-bold mb-1">{title}</h2>
            <p className="text-sm opacity-70 mb-4">{description}</p>

            {amount !== undefined && (
              <div
                className="card mb-4"
                style={{ background: 'var(--color-turmeric)', color: '#111827', boxShadow: 'var(--shadow-hard-sm)' }}
              >
                <p className="text-xs font-bold opacity-75 uppercase tracking-wider mb-1" style={{ color: '#111827' }}>Amount</p>
                <p className="font-mono text-2xl font-black tabular" style={{ color: '#111827' }}>{formatMst(amount)}</p>
              </div>
            )}

            {microcopy && (
              <p className="text-xs opacity-60 italic mb-4">{microcopy}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="btn btn-secondary flex-1"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="btn btn-primary flex-1"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Spinner /> Confirming…
                  </span>
                ) : actionLabel}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}

/**
 * Hook: wraps a writeContract call with toast notifications and ActionSheet flow.
 */
export function useTxWithToast() {
  const { writeContractAsync } = useWriteContract();
  const toastIdRef = useRef<string | null>(null);

  const execute = async (
    params: Parameters<typeof writeContractAsync>[0],
    label: string
  ) => {
    try {
      toastIdRef.current = toasts.add({
        type: 'pending',
        title: `${label}…`,
        message: 'Waiting for wallet confirmation',
      });

      const hash = await writeContractAsync(params);

      toasts.update(toastIdRef.current!, {
        type: 'pending',
        title: `${label} submitted`,
        message: 'Mining on MST Testnet…',
        txHash: hash,
      });

      return hash;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transaction failed';
      if (toastIdRef.current) {
        toasts.update(toastIdRef.current, {
          type: 'error',
          title: `${label} failed`,
          message: msg.slice(0, 100),
        });
      } else {
        toasts.add({ type: 'error', title: `${label} failed`, message: msg.slice(0, 100) });
      }
      throw err;
    }
  };

  return { execute };
}

/**
 * Component: watches a tx hash and fires a success toast on confirmation.
 */
export function TxWatcher({ hash, label }: { hash: `0x${string}` | undefined; label: string }) {
  const { isSuccess, isError } = useWaitForTransactionReceipt({ hash });
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    if (isSuccess) {
      firedRef.current = true;
      toasts.add({ type: 'success', title: `${label} confirmed!`, txHash: hash });
    }
    if (isError) {
      firedRef.current = true;
      toasts.add({ type: 'error', title: `${label} failed on-chain` });
    }
  }, [isSuccess, isError, hash, label]);

  return null;
}
