'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useReadContract } from 'wagmi';
import { circleFactoryAbi, CIRCLE_FACTORY_ADDRESS, trustSbtAbi, TRUST_SBT_ADDRESS, getFactoryAddress, getTrustSbtAddress } from '@/contracts';
import { CircleCardWrapper } from '@/components/CircleCardWrapper';
import { ConversationalStepper } from '@/components/ConversationalStepper';
import { ContractDeployerModal } from '@/components/ContractDeployerModal';
import { PassbookCard } from '@/components/PassbookCard';
import { parseEther } from 'viem';
import { getCustomCircles, CustomCircleData } from '@/lib/wallet';

// Sample demo circles for preview if factory not deployed or no circles exist yet
const DEMO_CIRCLES = [
  {
    address: '0x1234567890123456789012345678901234567890',
    contribution: parseEther('0.01'),
    maxMembers: 3,
    memberCount: 2,
    currentRound: 1,
    totalRounds: 3,
    state: 0, // OPEN
    isMyTurn: false,
  },
  {
    address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    contribution: parseEther('0.05'),
    maxMembers: 4,
    memberCount: 4,
    currentRound: 2,
    totalRounds: 4,
    state: 1, // RUNNING
    isMyTurn: true,
  },
  {
    address: '0x9876543210987654321098765432109876543210',
    contribution: parseEther('0.02'),
    maxMembers: 3,
    memberCount: 3,
    currentRound: 3,
    totalRounds: 3,
    state: 2, // DONE
    isMyTurn: false,
  },
];

export default function DashboardPage() {
  const { address: userAddress, isConnected } = useAccount();
  const [filter, setFilter] = useState<'all' | 'open' | 'active' | 'demo'>('all');
  const [isStepperOpen, setIsStepperOpen] = useState(false);
  const [isDeployerOpen, setIsDeployerOpen] = useState(false);
  const [customCircles, setCustomCircles] = useState<CustomCircleData[]>([]);

  const [factoryAddr, setFactoryAddr] = useState<`0x${string}`>(CIRCLE_FACTORY_ADDRESS);
  const [sbtAddr, setSbtAddr] = useState<`0x${string}`>(TRUST_SBT_ADDRESS);

  useEffect(() => {
    setCustomCircles(getCustomCircles());
    setFactoryAddr(getFactoryAddress());
    setSbtAddr(getTrustSbtAddress());
  }, [isStepperOpen, isDeployerOpen]);

  // Read all circles from factory
  const { data: allCircles, isLoading, refetch } = useReadContract({
    address: factoryAddr,
    abi: circleFactoryAbi,
    functionName: 'getAllCircles',
  });

  // Read user trust score
  const { data: userScore } = useReadContract({
    address: sbtAddr,
    abi: trustSbtAbi,
    functionName: 'score',
    args: [userAddress || '0x0000000000000000000000000000000000000000'],
  });

  const circleList = (allCircles as `0x${string}`[]) || [];
  const hasOnChainCircles = circleList.length > 0;

  const displayDemoCircles = [
    ...customCircles.map((c) => ({
      address: c.address,
      contribution: BigInt(c.contribution),
      maxMembers: c.maxMembers,
      memberCount: c.memberCount,
      currentRound: c.currentRound,
      totalRounds: c.totalRounds,
      state: c.state,
      isMyTurn: c.isMyTurn || false,
    })),
    ...DEMO_CIRCLES,
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-6 border-b-2 border-border">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-turmeric text-ink border-2 border-border text-xs font-mono font-bold mb-3 shadow-hard-sm">
            <span>🏛️</span>
            <span>PASSBOOK / DASHBOARD</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-text-primary">
            Aapki Bhishi Committees
          </h1>
          <p className="text-sm text-text-secondary mt-1 font-ui max-w-xl">
            Track your ongoing savings pools, check turn countdowns, claim winning pots, and join new verified circles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isConnected && (
            <Link
              href="/profile"
              className="px-4 py-2 bg-surface border-2 border-border shadow-hard-sm font-mono text-xs font-bold hover:bg-surface-hover transition-all flex items-center gap-2 text-text-primary"
            >
              <span>⭐ Trust Score:</span>
              <span className="text-sm text-turmeric font-extrabold">
                {userScore !== undefined ? userScore.toString() : '0'}
              </span>
            </Link>
          )}

          <button
            onClick={() => setIsDeployerOpen(true)}
            className="btn btn-secondary flex items-center gap-2 shadow-hard-md"
            title="Deploy Bhishi Contracts directly to Sepolia with your MetaMask wallet"
          >
            <span>🚀</span>
            <span>Deploy to Sepolia</span>
          </button>

          <button
            onClick={() => setIsStepperOpen(true)}
            className="btn btn-primary flex items-center gap-2 shadow-hard-md"
          >
            <span>➕</span>
            <span>Nayi Bhishi Banayein</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          {(['all', 'open', 'active', 'demo'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border-2 border-border transition-all rounded ${
                filter === tab
                  ? 'bg-turmeric text-ink shadow-hard-sm'
                  : 'bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              {tab === 'all' && `All (${circleList.length || DEMO_CIRCLES.length})`}
              {tab === 'open' && 'Open (Joining)'}
              {tab === 'active' && 'Active (Running)'}
              {tab === 'demo' && 'Demo Simulation'}
            </button>
          ))}
        </div>

        <button
          onClick={() => refetch()}
          className="text-xs font-mono text-text-muted hover:text-text-primary flex items-center gap-1 transition-colors"
        >
          <span>↻</span> Refresh on-chain
        </button>
      </div>

      {/* Circle Grid */}
      {filter === 'demo' || (!hasOnChainCircles && !isLoading) ? (
        <div>
          {!hasOnChainCircles && filter !== 'demo' && (
            <div className="mb-6 p-4 bg-turmeric/10 border-2 border-turmeric rounded shadow-hard-sm flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-bold text-sm text-text-primary">💡 Showing Demo Simulation Circles</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  Deploy Bhishi smart contracts directly to Ethereum Sepolia using your MetaMask wallet with 1-click!
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDeployerOpen(true)}
                  className="btn btn-secondary text-xs flex items-center gap-1.5 shadow-hard-sm"
                >
                  <span>🚀</span>
                  <span>Deploy Contracts</span>
                </button>
                <button
                  onClick={() => setIsStepperOpen(true)}
                  className="btn btn-primary text-xs"
                >
                  Create Circle
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayDemoCircles.map((c) => (
              <PassbookCard
                key={c.address}
                address={c.address}
                contribution={c.contribution}
                maxMembers={c.maxMembers}
                memberCount={c.memberCount}
                currentRound={c.currentRound}
                totalRounds={c.totalRounds}
                state={c.state}
                isMyTurn={c.isMyTurn}
              />
            ))}
          </div>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="card h-64 animate-pulse bg-surface border-2 border-border shadow-hard-md p-6"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {circleList.map((addr) => (
            <CircleCardWrapper key={addr} address={addr} />
          ))}
        </div>
      )}

      {/* Stepper Modal */}
      <ConversationalStepper
        isOpen={isStepperOpen}
        onClose={() => {
          setIsStepperOpen(false);
          refetch();
        }}
      />

      {/* 1-Click Contract Deployer Modal */}
      <ContractDeployerModal
        isOpen={isDeployerOpen}
        onClose={() => setIsDeployerOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
