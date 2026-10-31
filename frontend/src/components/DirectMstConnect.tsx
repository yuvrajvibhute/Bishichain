'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAccount, useConnect, useDisconnect, useSwitchChain, useChainId } from 'wagmi';
import { MST_TESTNET_CHAIN_ID, MST_MAINNET_CHAIN_ID } from '@/lib/wagmi';
import { shortAddr, mstscanAddr } from '@/lib/utils';
import { getBridgeKeyProvider, connectDirectMst, MST_NETWORKS, switchMstNetwork } from '@/lib/wallet';
import { motion, AnimatePresence } from 'framer-motion';
import { toasts } from './ToastContainer';

export function DirectBridgeKeyConnect() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connectors, connectAsync, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const [account, setAccount] = useState<string | null>(address || null);
  const [isOpen, setIsOpen] = useState(false);
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync state
  useEffect(() => {
    if (address) {
      setAccount(address);
    }
  }, [address]);

  // Keep localStorage active chain in sync
  useEffect(() => {
    if (chainId) {
      localStorage.setItem('bhishi_active_chain', String(chainId));
    }
  }, [chainId]);

  // Auto-connect on mount if BridgeKey already authorized
  useEffect(() => {
    async function autoConnect() {
      const provider = getBridgeKeyProvider();
      if (provider) {
        try {
          const accounts = await provider.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0 && !isConnected) {
            setAccount(accounts[0]);
            const targetId =
              typeof window !== 'undefined' && localStorage.getItem('bhishi_active_chain') === String(MST_MAINNET_CHAIN_ID)
                ? MST_MAINNET_CHAIN_ID
                : MST_TESTNET_CHAIN_ID;

            const injected =
              connectors.find(
                (c: any) =>
                  c.id === 'bridgekey' ||
                  c.name?.toLowerCase().includes('bridgekey') ||
                  (c.id === 'injected' && !c.name?.toLowerCase().includes('metamask'))
              ) || connectors.find((c: any) => c.id === 'injected') || connectors[0];

            if (injected) {
              await connectAsync({ connector: injected, chainId: targetId });
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
      const handleChainChanged = (newChainId: string) => {
        const id = parseInt(newChainId, 16);
        localStorage.setItem('bhishi_active_chain', String(id));
      };

      provider.on('accountsChanged', handleAccounts);
      provider.on('chainChanged', handleChainChanged);
      return () => {
        if (provider.removeListener) {
          provider.removeListener('accountsChanged', handleAccounts);
          provider.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [disconnect]);

  // Listen for global connect trigger requests
  useEffect(() => {
    const handleConnectTrigger = () => {
      setIsNetworkModalOpen(true);
    };
    window.addEventListener('bhishi:request-connect', handleConnectTrigger);
    return () => {
      window.removeEventListener('bhishi:request-connect', handleConnectTrigger);
    };
  }, []);

  async function handleSelectNetworkAndConnect(targetChainId: number) {
    setIsNetworkModalOpen(false);
    const provider = getBridgeKeyProvider();
    if (!provider) {
      alert("Please install and unlock BridgeKey Wallet extension. MetaMask has been disabled to ensure all MST transactions and rewards route directly to BridgeKey.");
      return;
    }

    try {
      // Connect first — localStorage updated only AFTER confirmed connection
      const connectedAccount = await connectDirectMst(targetChainId, connectors, connectAsync);
      if (connectedAccount) {
        // Now confirmed: persist the active chain
        localStorage.setItem('bhishi_active_chain', String(targetChainId));
        setAccount(connectedAccount);
        const netName = targetChainId === MST_MAINNET_CHAIN_ID ? 'MST Mainnet' : 'MST Testnet';
        toasts.add({
          type: 'success',
          title: 'BridgeKey Connected',
          message: `Connected to ${netName} as ${shortAddr(connectedAccount)}`,
        });
      } else {
        // connectDirectMst returned null — user cancelled
        toasts.add({
          type: 'error',
          title: 'Connection Cancelled',
          message: 'Wallet connection was cancelled or rejected in BridgeKey.',
        });
      }
    } catch (e: any) {
      console.error('Connection error:', e);
      toasts.add({
        type: 'error',
        title: 'Connection Failed',
        message: e?.message || 'Wallet connection failed.',
      });
    }
  }

  const activeAddress = address || account;
  const isWalletConnected = isConnected || !!account;
  const isMainnet = chainId === MST_MAINNET_CHAIN_ID;
  const isTestnet = chainId === MST_TESTNET_CHAIN_ID;
  const isSupportedNetwork = isMainnet || isTestnet;
  const isWrongNetwork = isWalletConnected && chainId !== undefined && !isSupportedNetwork && chainId !== 0;

  const currentNetworkConfig = isMainnet
    ? MST_NETWORKS[MST_MAINNET_CHAIN_ID]
    : MST_NETWORKS[MST_TESTNET_CHAIN_ID];

  const handleCopy = () => {
    if (activeAddress) {
      navigator.clipboard.writeText(activeAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSwitchNetwork = async (targetChainId: number) => {
    try {
      // Do NOT update localStorage or UI until the provider actually confirms the switch
      await switchMstNetwork(
        targetChainId,
        () => switchChainAsync({ chainId: targetChainId })
      );
      // Only reached if switch was APPROVED by the user
      localStorage.setItem('bhishi_active_chain', String(targetChainId));
      setIsOpen(false);
      toasts.add({
        type: 'success',
        title: 'Network Switched',
        message: `Switched to ${MST_NETWORKS[targetChainId].name}`,
      });
    } catch (err: any) {
      // User rejected or switch failed — do not update state
      console.warn('Switch chain rejected or failed:', err);
      const isRejection =
        err?.code === 4001 ||
        err?.message?.toLowerCase().includes('reject') ||
        err?.message?.toLowerCase().includes('denied') ||
        err?.message?.toLowerCase().includes('cancel');
      toasts.add({
        type: 'error',
        title: isRejection ? 'Network Switch Cancelled' : 'Network Switch Failed',
        message: isRejection
          ? 'You rejected the network switch in BridgeKey.'
          : `Switch failed: ${err?.message || 'Unknown error'}`,
      });
    }
  };

  if (!isWalletConnected) {
    return (
      <>
        <button
          onClick={() => setIsNetworkModalOpen(true)}
          disabled={isPending}
          className="btn btn-primary shadow-hard-sm text-xs py-2 px-3.5 flex items-center gap-1.5"
        >
          <span>🔑</span>
          <span>{isPending ? 'Connecting...' : 'Connect BridgeKey'}</span>
        </button>

        {/* Network Selection Modal on Connect */}
        {typeof document !== 'undefined' &&
          createPortal(
            <AnimatePresence>
              {isNetworkModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4 bg-black/80 backdrop-blur-sm">
                  <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 15 }}
                      className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto bg-surface border-2 border-border shadow-hard-lg p-6 relative rounded-lg font-ui"
                  >
                      <button
                        onClick={() => setIsNetworkModalOpen(false)}
                        className="absolute top-4 right-4 text-text-primary hover:opacity-60 text-lg font-bold font-mono"
                      >
                        ✕
                      </button>

                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">🔑</span>
                        <div>
                          <h3 className="font-display text-lg font-bold text-text-primary leading-tight">
                            Connect BridgeKey
                          </h3>
                          <p className="text-xs text-text-secondary">Select your target MST network:</p>
                        </div>
                      </div>

                      <div className="space-y-3 mt-4">
                        {/* Option 1: MST Mainnet */}
                        <button
                          onClick={() => handleSelectNetworkAndConnect(MST_MAINNET_CHAIN_ID)}
                          className="w-full p-3.5 bg-surface-hover hover:bg-turmeric/10 border-2 border-border hover:border-turmeric rounded text-left transition-all group flex items-start justify-between shadow-hard-sm"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base">🌐</span>
                              <span className="font-bold text-sm text-text-primary group-hover:text-turmeric">
                                MST Mainnet
                              </span>
                            </div>
                            <p className="text-xs text-text-muted mt-1">
                              Sovereign Layer-1 Production Network
                            </p>
                            <p className="text-xs text-text-muted">
                              Chain ID: 4646
                            </p>
                            <span className="inline-block text-[11px] font-mono font-bold text-text-secondary mt-1">
                              Currency: MSTC
                            </span>
                          </div>
                          <span className="text-text-muted group-hover:translate-x-0.5 transition-transform">→</span>
                        </button>

                        {/* Option 2: MST Testnet */}
                        <button
                          onClick={() => handleSelectNetworkAndConnect(MST_TESTNET_CHAIN_ID)}
                          className="w-full p-3.5 bg-surface-hover hover:bg-turmeric/10 border-2 border-border hover:border-turmeric rounded text-left transition-all group flex items-start justify-between shadow-hard-sm"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base">🧪</span>
                              <span className="font-bold text-sm text-text-primary group-hover:text-turmeric">
                                MST Testnet
                              </span>
                            </div>
                            <p className="text-xs text-text-muted mt-1">
                              Developer Sandbox &amp; Hackathon Testing
                            </p>
                            <p className="text-xs text-text-muted">
                              Chain ID: 91562037
                            </p>
                            <span className="inline-block text-[11px] font-mono font-bold text-text-secondary mt-1">
                              Currency: tMSTC
                            </span>
                          </div>
                          <span className="text-text-muted group-hover:translate-x-0.5 transition-transform">→</span>
                        </button>
                      </div>

                      <p className="text-[11px] text-text-muted text-center mt-4 font-mono">
                        BridgeKey will automatically switch or register the network.
                      </p>
                  </motion.div>
                  </div>
                )}
            </AnimatePresence>,
            document.body
          )}
      </>
    );
  }

  if (isWrongNetwork) {
    return (
      <div className="flex gap-1.5">
        <button
          onClick={() => handleSwitchNetwork(MST_MAINNET_CHAIN_ID)}
          className="btn btn-danger text-xs py-1.5 px-2.5 flex items-center gap-1 shadow-hard-sm"
        >
          <span>🌐</span>
          <span>Mainnet</span>
        </button>
        <button
          onClick={() => handleSwitchNetwork(MST_TESTNET_CHAIN_ID)}
          className="btn btn-danger text-xs py-1.5 px-2.5 flex items-center gap-1 shadow-hard-sm"
        >
          <span>🧪</span>
          <span>Testnet</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 bg-surface border-2 border-border rounded shadow-hard-sm text-xs font-mono font-bold flex items-center gap-2 hover:bg-surface-hover transition-all text-text-primary"
      >
        <span
          className={`w-2 h-2 rounded-full animate-pulse ${isMainnet ? 'bg-tulsi' : 'bg-turmeric'}`}
        />
        <span className="px-1 py-0.5 text-[10px] bg-turmeric/15 border border-turmeric/30 rounded text-text-primary">
          {isMainnet ? 'Mainnet' : 'Testnet'}
        </span>
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
              className="absolute right-0 mt-2 w-72 bg-surface border-2 border-border shadow-hard-lg rounded-lg p-3.5 z-50 font-mono text-xs space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border/20">
                <span className="text-[11px] font-bold text-text-primary flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${isMainnet ? 'bg-tulsi' : 'bg-turmeric'}`}
                  />
                  {currentNetworkConfig.name}
                </span>
                <span className="text-[10px] text-text-muted">
                  ID: {currentNetworkConfig.id}
                </span>
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
                  href={mstscanAddr(activeAddress || '', currentNetworkConfig.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 bg-surface hover:bg-surface-hover border border-border rounded text-[11px] font-bold text-text-primary text-center"
                >
                  MSTScan ↗
                </a>
              </div>

              {/* Network Switch Toggle */}
              <div className="pt-2 border-t border-border/20">
                <div className="text-[10px] text-text-muted mb-1.5">Switch MST Network:</div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleSwitchNetwork(MST_MAINNET_CHAIN_ID)}
                    disabled={isMainnet}
                    className={`py-1.5 px-2 rounded text-[11px] font-bold border transition-all flex items-center justify-center gap-1 ${
                      isMainnet
                        ? 'bg-tulsi/15 border-tulsi text-tulsi cursor-default'
                        : 'bg-surface hover:bg-surface-hover border-border text-text-primary'
                    }`}
                  >
                    <span>🌐</span>
                    <span>Mainnet</span>
                  </button>
                  <button
                    onClick={() => handleSwitchNetwork(MST_TESTNET_CHAIN_ID)}
                    disabled={isTestnet}
                    className={`py-1.5 px-2 rounded text-[11px] font-bold border transition-all flex items-center justify-center gap-1 ${
                      isTestnet
                        ? 'bg-turmeric/15 border-turmeric text-turmeric cursor-default'
                        : 'bg-surface hover:bg-surface-hover border-border text-text-primary'
                    }`}
                  >
                    <span>🧪</span>
                    <span>Testnet</span>
                  </button>
                </div>
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
