'use client';

import { useChainId, useSwitchChain } from 'wagmi';
import { MST_TESTNET_CHAIN_ID, MST_MAINNET_CHAIN_ID } from '@/lib/wagmi';
import { switchMstNetwork } from '@/lib/wallet';
import { motion } from 'framer-motion';
import { toasts } from './ToastContainer';

export function WrongNetwork() {
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const handleSwitchNetwork = async (targetChainId: number) => {
    try {
      await switchMstNetwork(
        targetChainId,
        () => switchChainAsync({ chainId: targetChainId })
      );
    } catch (error) {
      console.warn('Network switch rejected or failed:', error);
      toasts.add({
        type: 'error',
        title: 'Network Switch Failed',
        message: error instanceof Error ? error.message : 'BridgeKey could not confirm the network switch.',
      });
    }
  };

  const isSupportedNetwork =
    chainId === MST_TESTNET_CHAIN_ID || chainId === MST_MAINNET_CHAIN_ID || chainId === 0;

  if (isSupportedNetwork) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <div className="card max-w-sm w-full mx-4 text-center p-6 bg-surface border-2 border-border" style={{ boxShadow: '8px 8px 0 #C1291B' }}>
        <div className="text-6xl mb-4">🪔</div>
        <h2 className="font-display text-2xl font-bold mb-2 text-text-primary">Galat Network!</h2>
        <p className="text-sm opacity-70 mb-2 text-text-secondary">Wrong network detected in BridgeKey.</p>
        <p className="text-sm font-semibold mb-6 text-text-primary">
          Bhishi runs on <span className="text-turmeric">MST Mainnet</span> or <span className="text-turmeric">MST Testnet</span>.
          <br />Please select your network:
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => handleSwitchNetwork(MST_MAINNET_CHAIN_ID)}
            className="btn btn-primary py-2.5 px-4 font-mono text-xs flex items-center justify-center gap-2 shadow-hard-sm"
          >
            <span>🌐</span>
            <span>Switch to MST Mainnet (4646)</span>
          </button>
          <button
            onClick={() => handleSwitchNetwork(MST_TESTNET_CHAIN_ID)}
            className="btn btn-secondary py-2.5 px-4 font-mono text-xs flex items-center justify-center gap-2 shadow-hard-sm"
          >
            <span>🧪</span>
            <span>Switch to MST Testnet (91562037)</span>
          </button>
        </div>

        <p className="text-[11px] opacity-40 mt-4 font-mono text-text-muted">
          Supported Chain IDs: 4646 (Mainnet), 91562037 (Testnet)
        </p>
      </div>
    </motion.div>
  );
}
