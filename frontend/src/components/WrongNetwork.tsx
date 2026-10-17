'use client';

import { useChainId } from 'wagmi';
import { SEPOLIA_CHAIN_ID } from '@/lib/wagmi';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function WrongNetwork() {
  const chainId = useChainId();
  if (chainId === SEPOLIA_CHAIN_ID || chainId === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-[999] flex items-center justify-center bg-paper/90 backdrop-blur-sm"
    >
      <div className="card max-w-sm w-full mx-4 text-center" style={{ boxShadow: '8px 8px 0 #C1291B' }}>
        {/* Illustrated sad pot */}
        <div className="text-6xl mb-4">🪔</div>
        <h2 className="font-display text-2xl font-bold mb-2">Galat Network!</h2>
        <p className="text-sm opacity-70 mb-1">Wrong network detected.</p>
        <p className="text-sm font-semibold mb-6">
          Bhishi runs on <span className="text-turmeric">Ethereum Sepolia</span> testnet.
          <br />Please switch your wallet.
        </p>
        <div className="flex justify-center">
          <ConnectButton chainStatus="full" showBalance={false} />
        </div>
        <p className="text-xs opacity-40 mt-4 font-mono">Chain ID required: 11155111</p>
      </div>
    </motion.div>
  );
}
