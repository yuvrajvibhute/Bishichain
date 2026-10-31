'use client';

import { useAccount, useReadContracts } from 'wagmi';
import { DirectBridgeKeyConnect } from '@/components/DirectMstConnect';
import { motion } from 'framer-motion';
import { trustSbtAbi } from '@/contracts';
import { getTrustSbtAddress } from '@/contracts/network';
import { TrustCard } from '@/components/TrustCard';
import { shortAddr, mstscanAddr } from '@/lib/utils';
import Link from 'next/link';
import { getMstTargetChainId } from '@/lib/wallet';

export default function ProfilePage() {
  const { address: userAddress, isConnected, chainId } = useAccount();
  const targetChainId = getMstTargetChainId(chainId);
  const trustSbtAddress = getTrustSbtAddress(targetChainId);

  // Convert address to uint256 tokenId (same as in TrustSBT.sol: uint256(uint160(owner)))
  const tokenId = userAddress ? BigInt(userAddress) : 0n;

  const { data, isLoading } = useReadContracts({
    contracts: [
      {
        address: trustSbtAddress,
        abi: trustSbtAbi,
        functionName: 'score',
        args: [userAddress || '0x0000000000000000000000000000000000000000'],
        chainId: targetChainId,
      },
      {
        address: trustSbtAddress,
        abi: trustSbtAbi,
        functionName: 'getRecord',
        args: [userAddress || '0x0000000000000000000000000000000000000000'],
        chainId: targetChainId,
      },
      {
        address: trustSbtAddress,
        abi: trustSbtAbi,
        functionName: 'tokenURI',
        args: [tokenId],
        chainId: targetChainId,
      },
    ],
  });

  const rawScore = data?.[0]?.result as bigint | undefined;
  const scoreNum = rawScore !== undefined ? Number(rawScore) : 100;

  const record = data?.[1]?.result as [number, number, number] | undefined;
  const completed = record ? Number(record[0]) : 0;
  const onTime = record ? Number(record[1]) : 0;
  const defaults = record ? Number(record[2]) : 0;

  const tokenUri = data?.[2]?.result as string | undefined;

  // Reputation tier calculation
  const getReputationTier = (s: number) => {
    if (s >= 200) return { label: 'Mahajan (Elite Guardian)', color: 'var(--color-tulsi)', emoji: '👑' };
    if (s >= 100) return { label: 'Pramukh (Trusted Saver)', color: 'var(--color-turmeric)', emoji: '🌟' };
    if (s >= 50) return { label: 'Sadasya (Active Member)', color: 'var(--color-marigold)', emoji: '🤝' };
    return { label: 'Defaulter (High Risk)', color: 'var(--color-sindoor)', emoji: '⚠️' };
  };

  const tier = getReputationTier(scoreNum);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      {/* Page Header */}
      <div className="mb-8 pb-6 border-b-2 border-border flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-turmeric text-ink border-2 border-border text-xs font-mono font-bold mb-3 shadow-hard-sm">
            <span>🛡️</span>
            <span>PORTABLE REPUTATION</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-text-primary">
            Aapka Trust Score & SBT Card
          </h1>
          <p className="text-sm text-text-secondary mt-1 font-ui max-w-xl">
            A non-transferable, soulbound ERC-721 token living on MST Blockchain. Your on-time payment track record proves creditworthiness across Web3.
          </p>
        </div>

        {isConnected && userAddress && (
          <a
            href={mstscanAddr(userAddress, targetChainId)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-surface border-2 border-border shadow-hard-sm font-mono text-xs font-bold hover:bg-surface-hover text-text-primary transition-all"
          >
            {shortAddr(userAddress)} on MSTScan ↗
          </a>
        )}
      </div>

      {!isConnected ? (
        <div className="card p-12 bg-surface border-2 border-border shadow-hard-lg text-center max-w-md mx-auto">
          <div className="text-4xl mb-4">🔐</div>
          <h2 className="font-display text-2xl font-bold text-text-primary mb-2">Connect Your Wallet</h2>
          <p className="text-sm text-text-secondary mb-6">
            Connect your MST wallet to view your soulbound Trust Score NFT and chit-fund credit history.
          </p>
          <div className="flex justify-center">
            <DirectBridgeKeyConnect />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: 3D Holographic Tilt Card */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="p-4 bg-surface border-2 border-border shadow-hard-lg rounded-lg w-full flex flex-col items-center">
              <TrustCard
                score={scoreNum}
                completed={completed}
                onTime={onTime}
                defaults={defaults}
                address={userAddress || ''}
                imageDataUri={tokenUri}
              />
              <p className="text-[11px] font-mono text-text-muted mt-4 text-center">
                ✨ Interactive 3D Card: Move your cursor to tilt & reveal the holographic sheen
              </p>
            </div>
          </div>

          {/* Right Column: Score Breakdown & On-chain Statistics */}
          <div className="lg:col-span-7 space-y-6">
            {/* Reputation Tier Box */}
            <div className="card p-6 bg-surface border-2 border-border shadow-hard-md">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted">Status Tier</span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 border border-border bg-surface-hover text-text-primary rounded">
                  Soulbound SBT
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-4xl">{tier.emoji}</div>
                <div>
                  <h3 className="font-display text-2xl font-bold text-text-primary">{tier.label}</h3>
                  <p className="text-xs text-text-secondary mt-0.5 font-ui">
                    Reputation score is computed transparently directly from on-chain circle settlements.
                  </p>
                </div>
              </div>

              {/* Score Metric Big Counter */}
              <div className="mt-6 pt-6 border-t-2 border-border/20 grid grid-cols-3 gap-4 text-center font-mono">
                <div className="p-3 bg-surface-hover border border-border rounded">
                  <div className="text-xs text-text-muted">Trust Score</div>
                  <div className="text-2xl font-black mt-0.5" style={{ color: tier.color }}>
                    {scoreNum}
                  </div>
                </div>
                <div className="p-3 bg-surface-hover border border-border rounded">
                  <div className="text-xs text-text-muted">Circles Done</div>
                  <div className="text-2xl font-black text-text-primary mt-0.5">{completed}</div>
                </div>
                <div className="p-3 bg-surface-hover border border-border rounded">
                  <div className="text-xs text-text-muted">On-Time / Default</div>
                  <div className="text-2xl font-black text-text-primary mt-0.5">
                    {onTime} / <span className="text-sindoor">{defaults}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* How Trust Score Works */}
            <div className="card p-6 bg-surface border-2 border-border shadow-hard-md">
              <h3 className="font-display text-lg font-bold text-text-primary mb-3">Formula & Scoring Rules 📐</h3>
              <div className="space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between p-2.5 bg-surface-hover border border-border rounded">
                  <span className="flex items-center gap-2">
                    <span className="text-tulsi font-bold">+10 pts</span>
                    <span className="text-text-primary">Har On-Time Round Deposit</span>
                  </span>
                  <span className="text-text-muted">Per successful deposit</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-surface-hover border border-border rounded">
                  <span className="flex items-center gap-2">
                    <span className="text-tulsi font-bold">+50 pts</span>
                    <span className="text-text-primary">Pura Circle Complete Karna</span>
                  </span>
                  <span className="text-text-muted">Bonus upon full circle</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-surface-hover border border-border rounded">
                  <span className="flex items-center gap-2">
                    <span className="text-sindoor font-bold">-50 pts</span>
                    <span className="text-text-primary">Round Miss / Collateral Slash</span>
                  </span>
                  <span className="text-text-muted">Penalty for default</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="btn btn-primary flex-1 text-center shadow-hard-md">
                Browse Active Circles
              </Link>
              <a
                href={trustSbtAddress ? mstscanAddr(trustSbtAddress, targetChainId) : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline font-mono text-xs"
              >
                Inspect SBT Contract ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
