'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useConnect } from 'wagmi';
import { CIRCLE_FACTORY_BYTECODE } from '@/contracts/bytecode';
import { SEPOLIA_CHAIN_ID, SEPOLIA_RPC } from '@/lib/wagmi';
import { toasts } from './ToastContainer';
import { Confetti } from './Confetti';
import { shortAddr, etherscanAddr, etherscanTx } from '@/lib/utils';
import { connectDirectSepolia } from '@/lib/wallet';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (factoryAddress: string, trustSbtAddress: string) => void;
}

export function ContractDeployerModal({ isOpen, onClose, onSuccess }: Props) {
  const { address: userAddress, isConnected } = useAccount();
  const { connectors, connectAsync } = useConnect();

  const [status, setStatus] = useState<'idle' | 'prompting' | 'mining' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [deployedFactory, setDeployedFactory] = useState<string | null>(null);
  const [deployedSbt, setDeployedSbt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confettiActive, setConfettiActive] = useState(false);

  if (!isOpen) return null;

  const handleDeploy = async () => {
    try {
      setErrorMessage(null);

      // Ensure wallet is connected on Sepolia
      let activeAddr = userAddress;
      if (!isConnected || !activeAddr) {
        setStatus('prompting');
        const connected = await connectDirectSepolia(connectors, connectAsync);
        if (!connected) {
          setStatus('idle');
          return;
        }
        activeAddr = connected as `0x${string}`;
      }

      setStatus('prompting');

      // Submit contract deployment transaction (bytecode with no 'to' field)
      const hash = await (window as any).ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: activeAddr,
            data: CIRCLE_FACTORY_BYTECODE,
          },
        ],
      });

      setTxHash(hash);
      setStatus('mining');
      toasts.add({
        type: 'pending',
        title: 'Deployment Submitted! 🚀',
        message: 'Mining CircleFactory on Ethereum Sepolia...',
        txHash: hash,
      });

      // Poll for transaction receipt to retrieve deployed contractAddress
      let attempts = 0;
      let contractAddress: string | null = null;

      while (attempts < 60 && !contractAddress) {
        await new Promise((r) => setTimeout(r, 2500));
        attempts++;

        try {
          const receipt = await (window as any).ethereum.request({
            method: 'eth_getTransactionReceipt',
            params: [hash],
          });

          if (receipt && receipt.contractAddress) {
            contractAddress = receipt.contractAddress;
          }
        } catch {
          // Keep polling
        }
      }

      if (!contractAddress) {
        throw new Error('Deployment transaction timed out while waiting for Sepolia receipt. Check Etherscan.');
      }

      setDeployedFactory(contractAddress);

      // Read trustSBT address from factory via eth_call (trustSBT() selector: 0x752da1bf)
      let sbtAddress = '';
      try {
        const sbtRaw = await (window as any).ethereum.request({
          method: 'eth_call',
          params: [
            {
              to: contractAddress,
              data: '0x752da1bf',
            },
            'latest',
          ],
        });
        if (sbtRaw && sbtRaw.length >= 66) {
          sbtAddress = '0x' + sbtRaw.slice(26);
        }
      } catch (err) {
        console.warn('Could not read trustSBT address directly:', err);
      }

      setDeployedSbt(sbtAddress);

      // Save locally to localStorage so app instantly uses it
      localStorage.setItem('bhishi_deployed_factory', contractAddress);
      if (sbtAddress) {
        localStorage.setItem('bhishi_deployed_trust_sbt', sbtAddress);
      }

      // Persist to .env.local via Next.js backend API
      try {
        await fetch('/api/save-contracts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            factoryAddress: contractAddress,
            trustSbtAddress: sbtAddress,
          }),
        });
      } catch (saveErr) {
        console.warn('Failed to write .env.local via API:', saveErr);
      }

      setStatus('success');
      setConfettiActive(true);

      toasts.add({
        type: 'success',
        title: 'Contracts Deployed to Sepolia! 🎉',
        message: `CircleFactory is live at ${shortAddr(contractAddress)}`,
        txHash: hash,
      });

      if (onSuccess) {
        onSuccess(contractAddress, sbtAddress);
      }
    } catch (err: any) {
      console.error('Deployment error:', err);
      setStatus('error');
      const msg = err.message?.includes('User rejected')
        ? 'Deployment cancelled in MetaMask.'
        : err.message || 'Deployment failed. Check your Sepolia ETH balance.';
      setErrorMessage(msg);
      toasts.add({
        type: 'error',
        title: 'Deployment Failed',
        message: msg,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <Confetti active={confettiActive} onComplete={() => setConfettiActive(false)} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-surface border-2 border-border shadow-hard-lg p-6 sm:p-8 relative rounded-lg"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-primary hover:opacity-60 text-xl font-bold font-mono"
        >
          ✕
        </button>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">🚀</span>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-sindoor">
            1-Click On-Chain Deployment
          </span>
        </div>

        <h2 className="font-display text-2xl font-bold text-text-primary mb-2">
          Deploy Bhishi Contracts to Sepolia
        </h2>
        <p className="text-xs text-text-secondary mb-6 font-ui">
          Deploys the smart contract core (<strong>CircleFactory</strong> + <strong>TrustSBT Soulbound NFT</strong>) directly to Ethereum Sepolia with your connected MetaMask wallet. No private keys required.
        </p>

        {/* Specs Table */}
        <div className="p-4 bg-surface-hover border-2 border-border space-y-2 font-mono text-xs mb-6 rounded">
          <div className="flex justify-between">
            <span className="text-text-muted">Target Network:</span>
            <span className="font-bold text-text-primary">Ethereum Sepolia (11155111)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Deployer Account:</span>
            <span className="font-bold text-turmeric">{userAddress ? shortAddr(userAddress) : 'Connect Wallet'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Contracts Deployed:</span>
            <span className="font-bold text-text-primary">CircleFactory.sol + TrustSBT.sol</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Estimated Gas:</span>
            <span className="font-bold text-tulsi">~0.015 - 0.025 Sepolia ETH</span>
          </div>
        </div>

        {/* Live Status Stages */}
        {status === 'prompting' && (
          <div className="p-4 bg-turmeric/15 border-2 border-turmeric text-center font-mono text-xs rounded mb-4 animate-pulse">
            🦊 MetaMask prompt open... Please confirm the deployment in your MetaMask extension.
          </div>
        )}

        {status === 'mining' && (
          <div className="p-4 bg-marigold/15 border-2 border-marigold text-center font-mono text-xs rounded mb-4 space-y-2">
            <div className="flex items-center justify-center gap-2 font-bold text-marigold">
              <span className="animate-spin">⏳</span>
              <span>Mining contract on Sepolia testnet...</span>
            </div>
            {txHash && (
              <a
                href={etherscanTx(txHash)}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-xs text-text-primary underline hover:text-turmeric"
              >
                View Pending Tx on Etherscan ↗
              </a>
            )}
          </div>
        )}

        {status === 'success' && deployedFactory && (
          <div className="p-4 bg-tulsi/15 border-2 border-tulsi font-mono text-xs rounded mb-4 space-y-2">
            <div className="font-bold text-tulsi text-sm flex items-center gap-1.5">
              <span>✓</span>
              <span>Contracts Successfully Deployed!</span>
            </div>
            <div className="pt-2 border-t border-border/20 space-y-1">
              <div>
                <span className="text-text-muted block text-[11px]">CircleFactory:</span>
                <a
                  href={etherscanAddr(deployedFactory)}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-text-primary underline hover:text-turmeric"
                >
                  {deployedFactory} ↗
                </a>
              </div>
              {deployedSbt && (
                <div>
                  <span className="text-text-muted block text-[11px]">TrustSBT:</span>
                  <a
                    href={etherscanAddr(deployedSbt)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-text-primary underline hover:text-turmeric"
                  >
                    {deployedSbt} ↗
                  </a>
                </div>
              )}
            </div>
            <p className="text-[11px] text-tulsi pt-1">
              Saved to your configuration! All future circles will deploy on-chain.
            </p>
          </div>
        )}

        {status === 'error' && errorMessage && (
          <div className="p-4 bg-sindoor/15 border-2 border-sindoor text-xs font-mono text-sindoor rounded mb-4">
            ✕ {errorMessage}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/20">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline text-xs"
            disabled={status === 'prompting' || status === 'mining'}
          >
            {status === 'success' ? 'Close' : 'Cancel'}
          </button>

          {status !== 'success' ? (
            <button
              type="button"
              onClick={handleDeploy}
              disabled={status === 'prompting' || status === 'mining'}
              className="btn btn-primary text-xs shadow-hard-md flex items-center gap-2"
            >
              <span>🚀</span>
              <span>
                {status === 'prompting'
                  ? 'Confirming in Wallet...'
                  : status === 'mining'
                  ? 'Deploying on Sepolia...'
                  : 'Confirm & Deploy with MetaMask'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                window.location.reload();
              }}
              className="btn btn-secondary text-xs shadow-hard-md"
            >
              Refresh Dashboard & Arena ↻
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
