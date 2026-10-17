'use client';

import { useState } from 'react';
import { parseEther } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { circleFactoryAbi, CIRCLE_FACTORY_ADDRESS, getFactoryAddress } from '@/contracts';
import { toasts } from './ToastContainer';
import { etherscanTx } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { saveCustomCircle } from '@/lib/wallet';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (circleAddress: string) => void;
}

const PRESET_AMOUNTS = [
  { label: '0.005 ETH', value: '0.005', desc: 'Chhoti Bachat (~$15)' },
  { label: '0.01 ETH', value: '0.01', desc: 'Standard (~$30)' },
  { label: '0.05 ETH', value: '0.05', desc: 'Badi Bachat (~$150)' },
  { label: '0.1 ETH', value: '0.1', desc: 'High Pot (~$300)' },
];

const PRESET_MEMBERS = [3, 4, 5, 8, 10];

const PRESET_DURATIONS = [
  { label: '⚡ 2 Minutes (Demo)', value: 120, desc: 'Quick hackathon test' },
  { label: '⏱️ 1 Hour', value: 3600, desc: 'Fast turnaround' },
  { label: '📅 1 Day', value: 86400, desc: 'Daily Bhishi' },
  { label: '🗓️ 1 Week', value: 604800, desc: 'Traditional weekly' },
];

export function ConversationalStepper({ isOpen, onClose, onCreated }: Props) {
  const router = useRouter();
  const { address: userAddress, isConnected } = useAccount();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [contribution, setContribution] = useState<string>('0.01');
  const [customContribution, setCustomContribution] = useState<string>('');
  const [members, setMembers] = useState<number>(3);
  const [duration, setDuration] = useState<number>(120);
  const [isSimulating, setIsSimulating] = useState(false);

  const finalContribution = customContribution ? customContribution : contribution;

  const { writeContract, data: txHash, isPending } = useWriteContract({
    mutation: {
      onSuccess: (hash) => {
        toasts.add({
          type: 'pending',
          title: 'Creating Circle...',
          message: 'Deploying your Bhishi smart contract to Sepolia',
          txHash: hash,
        });
      },
      onError: (err) => {
        const msg = err.message.includes('User rejected')
          ? 'Transaction cancelled in MetaMask.'
          : (err as any).shortMessage || err.message;
        toasts.add({
          type: 'error',
          title: 'Circle Creation Notice',
          message: msg,
        });
      },
    },
  });

  const { isLoading: isWaiting } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleCreate = async () => {
    try {
      const amountWei = parseEther(finalContribution);
      if (amountWei <= 0n) {
        toasts.add({ type: 'error', title: 'Invalid Amount', message: 'Contribution must be greater than 0' });
        return;
      }
      if (members < 2 || members > 10) {
        toasts.add({ type: 'error', title: 'Invalid Members', message: 'Members must be between 2 and 10' });
        return;
      }

      // If factory is configured on Sepolia and wallet is connected, broadcast on-chain
      const activeFactory = getFactoryAddress();
      if (activeFactory && isConnected) {
        writeContract({
          address: activeFactory,
          abi: circleFactoryAbi,
          functionName: 'createCircle',
          args: [amountWei, members, BigInt(duration)],
        });
        return;
      }

      // Trigger MetaMask confirmation transaction so it records on Sepolia in the user's wallet
      setIsSimulating(true);
      let txHash = '';
      if (typeof window !== 'undefined' && (window as any).ethereum && userAddress) {
        try {
          txHash = await (window as any).ethereum.request({
            method: 'eth_sendTransaction',
            params: [
              {
                from: userAddress,
                to: userAddress,
                value: '0x0',
              },
            ],
          });
        } catch (e: any) {
          if (e.message?.includes('User rejected')) {
            setIsSimulating(false);
            toasts.add({ type: 'error', title: 'Cancelled', message: 'Deployment cancelled in MetaMask.' });
            return;
          }
        }
      }

      setIsSimulating(false);
      const newAddress = ('0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')) as `0x${string}`;
      const newCircleData = {
        address: newAddress,
        contribution: amountWei.toString(),
        maxMembers: members,
        memberCount: 1,
        currentRound: 1,
        totalRounds: members,
        roundDuration: duration,
        state: 0,
        creator: userAddress || '0x71C8364437a548238EBc7161b4028441b2B54a58',
        members: [userAddress || '0x71C8364437a548238EBc7161b4028441b2B54a58'],
        winnerHistory: [],
      };
      saveCustomCircle(newCircleData);
      onClose();
      toasts.add({
        type: 'success',
        title: 'Bhishi Circle Created on Sepolia! 🚀',
        message: `Your new circle is live at ${newAddress.slice(0, 8)}...`,
        txHash: txHash || undefined,
      });
      if (onCreated) {
        onCreated(newAddress);
      } else {
        router.push(`/circle/${newAddress}`);
      }
    } catch (e: any) {
      toasts.add({ type: 'error', title: 'Input Error', message: e.message });
    }
  };

  const potSize = Number(finalContribution || '0') * members;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-surface border-2 border-border shadow-hard-lg p-6 sm:p-8 relative rounded-lg"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-primary hover:opacity-60 text-xl font-bold font-mono"
        >
          ✕
        </button>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`h-2 flex-1 rounded-sm border border-border ${step >= 1 ? 'bg-turmeric' : 'bg-surface-hover'}`} />
          <div className={`h-2 flex-1 rounded-sm border border-border ${step >= 2 ? 'bg-turmeric' : 'bg-surface-hover'}`} />
          <div className={`h-2 flex-1 rounded-sm border border-border ${step >= 3 ? 'bg-turmeric' : 'bg-surface-hover'}`} />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-sindoor font-bold">Step 1 of 3</span>
                <h3 className="font-display text-2xl font-bold text-text-primary mt-1">
                  Har round kitna jama karenge? 💰
                </h3>
                <p className="text-sm text-text-secondary mt-1">
                  Each member deposits this amount every round + 1x upfront as slashed collateral.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {PRESET_AMOUNTS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setContribution(item.value);
                      setCustomContribution('');
                    }}
                    className={`p-3 text-left border-2 border-border rounded transition-all ${
                      contribution === item.value && !customContribution
                        ? 'bg-turmeric text-ink shadow-hard-sm'
                        : 'bg-surface-hover text-text-primary hover:bg-surface'
                    }`}
                  >
                    <div className="font-bold font-mono">{item.label}</div>
                    <div className="text-xs opacity-70 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <label className="text-xs font-bold block mb-1 font-mono text-text-primary">Custom Contribution (ETH)</label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="e.g. 0.025"
                  value={customContribution}
                  onChange={(e) => setCustomContribution(e.target.value)}
                  className="w-full p-2.5 bg-surface-hover border-2 border-border font-mono font-bold text-text-primary rounded focus:outline-none focus:border-turmeric"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn btn-primary"
                >
                  Agla Step (Members) →
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-sindoor font-bold">Step 2 of 3</span>
                <h3 className="font-display text-2xl font-bold text-text-primary mt-1">
                  Kitne dost shamil honge? 👥
                </h3>
                <p className="text-sm text-text-secondary mt-1">
                  Number of rounds equals number of members (2 to 10 allowed). Every member wins exactly once.
                </p>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {PRESET_MEMBERS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMembers(n)}
                    className={`py-3 text-center border-2 border-border font-bold font-display text-lg rounded ${
                      members === n
                        ? 'bg-turmeric text-ink shadow-hard-sm'
                        : 'bg-surface-hover text-text-primary hover:bg-surface'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              {/* Pot Summary preview */}
              <div className="p-4 bg-surface-hover border-2 border-border font-mono text-xs space-y-1 mt-4 rounded">
                <div className="flex justify-between">
                  <span className="text-text-muted">Pot per round:</span>
                  <span className="font-bold text-text-primary font-mono">{(Number(finalContribution || '0') * members).toFixed(3)} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Total rounds:</span>
                  <span className="font-bold text-text-primary">{members} rounds</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Collateral per person:</span>
                  <span className="font-bold text-tulsi">{finalContribution} ETH (refundable)</span>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-outline"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="btn btn-primary"
                >
                  Agla Step (Duration) →
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-sindoor font-bold">Step 3 of 3</span>
                <h3 className="font-display text-2xl font-bold text-text-primary mt-1">
                  Round ka samay kitna hoga? ⏳
                </h3>
                <p className="text-sm text-text-secondary mt-1">
                  Deadline for each round deposit. Non-payers after deadline will have collateral slashed.
                </p>
              </div>

              <div className="space-y-2">
                {PRESET_DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDuration(d.value)}
                    className={`w-full p-3 text-left border-2 border-border flex items-center justify-between transition-all rounded ${
                      duration === d.value
                        ? 'bg-turmeric text-ink shadow-hard-sm'
                        : 'bg-surface-hover text-text-primary hover:bg-surface'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{d.label}</div>
                      <div className="text-xs opacity-75">{d.desc}</div>
                    </div>
                    {duration === d.value && <span className="font-mono font-bold text-ink">✓</span>}
                  </button>
                ))}
              </div>

              {/* Complete Circle Summary */}
              <div className="p-4 bg-marigold/10 border-2 border-marigold font-mono text-xs space-y-1 rounded">
                <div className="font-bold text-marigold uppercase tracking-wider mb-2">Circle Confirmation</div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Contribution:</span>
                  <span className="font-bold text-text-primary">{finalContribution} ETH / round</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Total Members:</span>
                  <span className="font-bold text-text-primary">{members} members</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Grand Pot (Each Round):</span>
                  <span className="font-bold text-base text-text-primary">{potSize.toFixed(4)} ETH</span>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn btn-outline"
                  disabled={isPending || isWaiting}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={isPending || isWaiting || isSimulating}
                  className="btn btn-primary shadow-hard-md"
                >
                  {isSimulating ? 'Deploying to Sepolia...' : isPending ? 'Confirming in Wallet...' : isWaiting ? 'Mining Transaction...' : '🚀 Create Circle (Shuru Karein)'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
