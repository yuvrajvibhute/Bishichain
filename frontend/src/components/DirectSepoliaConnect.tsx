'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useSwitchChain, useChainId } from 'wagmi';
import { MST_TESTNET_CHAIN_ID, MST_TESTNET_RPC } from '@/lib/wagmi';
import { shortAddr, etherscanAddr } from '@/lib/utils';
import { getBridgeKeyProvider } from '@/lib/wallet';
import { motion, AnimatePresence } from 'framer-motion';
import { toasts } from './ToastContainer';

export function DirectBridgeKeyConnect() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connectors, connectAsync, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [account, setAccount] = useState<string | null>(address || null);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync state
  useEffect(() => {
    if (address) {
      setAccount(address);
    }
  }, [address]);

  // Auto-connect on mount if BridgeKey already authorized
  useEffect(() => {
    async function autoConnect() {
      const provider = getBridgeKeyProvider();
      if (provider) {
        try {
          const accounts = await provider.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0 && !isConnected) {
            setAccount(accounts[0]);
            const injected =
              connectors.find(
                (c) =>
                  c.id === 'bridgekey' ||
                  c.name.toLowerCase().includes('bridgekey') ||
                  (c.id === 'injected' && !c.name.toLowerCase().includes('metamask'))
              ) || connectors.find((c) => c.id === 'injected') || connectors[0];
            if (injected) {
              await connectAsync({ connector: injected, chainId: MST_TESTNET_CHAIN_ID });
            }
          }
        } catch (e) {
          console.warn('Auto-connect error:', e);
        }
      }
    }
    autoConnect();
  }, [connectors, connectAsync, isConnected]);

  // Listen to accountsChanged and chainChanged directly from BridgeKey
  useEffect(() => {
    const provider = getBridgeKeyProvider();
    if (provider && provider.on) {
      const handleAccounts = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount(null);
          disconnect();
        }
      };
      provider.on('accountsChanged', handleAccounts);
      return () => {
        if (provider.removeListener) {
          provider.removeListener('accountsChanged', handleAccounts);
        }
      };
    }
  }, [disconnect]);

  // Listen for global connect trigger requests
  useEffect(() => {
    const handleConnectTrigger = () => {
      connectWallet();
    };
    window.addEventListener('bhishi:request-connect', handleConnectTrigger);
    return () => {
      window.removeEventListener('bhishi:request-connect', handleConnectTrigger);
    };
  }, [connectors, connectAsync]);

  async function connectWallet() {
    const provider = getBridgeKeyProvider();
    if (!provider) {
      alert("Please install and unlock BridgeKey Wallet extension. MetaMask has been disabled to ensure all MST transactions and rewards route directly to BridgeKey.");
      return;
    }
    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);

      // Connect wagmi connector to synchronize all contract hooks
      const injected =
        connectors.find(
          (c) =>
            c.id === 'bridgekey' ||
            c.name.toLowerCase().includes('bridgekey') ||
            (c.id === 'injected' && !c.name.toLowerCase().includes('metamask'))
        ) || connectors.find((c) => c.id === 'injected') || connectors[0];
      if (injected) {
        try {
          await connectAsync({ connector: injected, chainId: MST_TESTNET_CHAIN_ID });
        } catch (wagmiErr) {
          console.warn('Wagmi sync notice:', wagmiErr);
        }
      }

      const hexChainId = '0x' + MST_TESTNET_CHAIN_ID.toString(16);

      // Automatically ensure MST Testnet chain
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: hexChainId }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: hexChainId,
                chainName: 'MST Testnet',
                nativeCurrency: { name: 'tMSTC', symbol: 'tMSTC', decimals: 18 },
                rpcUrls: [MST_TESTNET_RPC],
                blockExplorerUrls: ['https://testnet.mstscan.com'],
              },
            ],
          });
        }
      }

      toasts.add({
        type: 'success',
        title: 'BridgeKey Connected',
        message: `Connected to MST Testnet as ${shortAddr(accounts[0])}`,
      });
    } catch (e: any) {
      console.error('Connection error:', e);
      toasts.add({
        type: 'error',
        title: 'Connection Cancelled',
        message: 'Wallet connection cancelled.',
      });
    }
  }

  const activeAddress = address || account;
  const isWalletConnected = isConnected || !!account;
  const isWrongNetwork = isWalletConnected && chainId !== undefined && chainId !== MST_TESTNET_CHAIN_ID && chainId !== 0;

  const handleCopy = () => {
    if (activeAddress) {
      navigator.clipboard.writeText(activeAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isWalletConnected) {
    return (
      <button
        onClick={connectWallet}
        disabled={isPending}
        className="btn btn-primary shadow-hard-sm text-xs py-2 px-3.5 flex items-center gap-1.5"
      >
        <span>🔑</span>
        <span>{isPending ? 'Connecting...' : 'Connect BridgeKey'}</span>
      </button>
    );
  }

  if (isWrongNetwork) {
    return (
      <button
        onClick={() => switchChain({ chainId: MST_TESTNET_CHAIN_ID })}
        className="btn btn-danger text-xs py-2 px-3 flex items-center gap-1.5 shadow-hard-sm animate-pulse"
      >
        <span>⚠️</span>
        <span>Switch to MST Testnet</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 bg-surface border-2 border-border rounded shadow-hard-sm text-xs font-mono font-bold flex items-center gap-2 hover:bg-surface-hover transition-all text-text-primary"
      >
        <span className="w-2 h-2 rounded-full bg-tulsi animate-pulse" />
        <span className="hidden sm:inline text-text-muted">BridgeKey:</span>
        <span>{shortAddr(activeAddress || '')}</span>
        <span className="text-[10px] opacity-60">▼</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 5 }}
              className="absolute right-0 mt-2 w-64 bg-surface border-2 border-border shadow-hard-lg rounded-lg p-3 z-50 font-mono text-xs space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border/20">
                <span className="text-[10px] uppercase font-bold text-tulsi flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-tulsi" /> BridgeKey Connected
                </span>
                <span className="text-[10px] text-text-muted">ID: {MST_TESTNET_CHAIN_ID}</span>
              </div>

              <div>
                <div className="text-[10px] text-text-muted mb-0.5">Wallet Address</div>
                <div className="font-bold text-text-primary break-all text-[11px] bg-surface-hover p-1.5 rounded border border-border/20">
                  {activeAddress}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex-1 py-1.5 bg-surface hover:bg-surface-hover border border-border rounded text-[11px] font-bold text-text-primary text-center"
                >
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
                <a
                  href={etherscanAddr(address || '')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 bg-surface hover:bg-surface-hover border border-border rounded text-[11px] font-bold text-text-primary text-center"
                >
                  Explorer ↗
                </a>
              </div>

              <div className="pt-2 border-t border-border/20">
                <button
                  onClick={() => {
                    disconnect();
                    setIsOpen(false);
                  }}
                  className="w-full py-1.5 text-center text-sindoor hover:bg-sindoor/10 rounded font-bold transition-colors"
                >
                  🚪 Disconnect Wallet
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Backwards-compatible alias
export const DirectSepoliaConnect = DirectBridgeKeyConnect;
