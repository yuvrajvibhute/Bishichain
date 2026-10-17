'use client';

import { useReadContracts, useAccount } from 'wagmi';
import { circleAbi } from '@/contracts';
import { PassbookCard } from './PassbookCard';

interface Props {
  address: `0x${string}`;
}

export function CircleCardWrapper({ address }: Props) {
  const { address: userAddress } = useAccount();

  const { data, isLoading } = useReadContracts({
    contracts: [
      { address, abi: circleAbi, functionName: 'contribution' },
      { address, abi: circleAbi, functionName: 'maxMembers' },
      { address, abi: circleAbi, functionName: 'getMembers' },
      { address, abi: circleAbi, functionName: 'state' },
      { address, abi: circleAbi, functionName: 'currentRound' },
      { address, abi: circleAbi, functionName: 'totalRounds' },
      {
        address,
        abi: circleAbi,
        functionName: 'memberInfo',
        args: [userAddress || '0x0000000000000000000000000000000000000000'],
      },
    ],
  });

  if (isLoading || !data) {
    return (
      <div className="card h-64 flex flex-col justify-between animate-pulse bg-paper-light border-2 border-ink shadow-hard-md p-6">
        <div className="space-y-3">
          <div className="h-4 bg-ink/10 rounded w-24" />
          <div className="h-8 bg-ink/10 rounded w-40" />
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-ink/10 rounded w-full" />
          <div className="h-10 bg-ink/10 rounded w-full" />
        </div>
      </div>
    );
  }

  const contribution = (data[0]?.result as bigint) || 0n;
  const maxMembers = Number(data[1]?.result || 0);
  const members = (data[2]?.result as `0x${string}`[]) || [];
  const state = Number(data[3]?.result || 0);
  const currentRound = Number(data[4]?.result || 0);
  const totalRounds = Number(data[5]?.result || maxMembers);

  const memberInfo = data[6]?.result as [boolean, boolean, boolean, number, number, bigint, bigint] | undefined;
  const isMember = memberInfo ? memberInfo[0] : false;
  const paidThisRound = memberInfo ? memberInfo[2] : false;

  const isMyTurn = state === 1 && isMember && !paidThisRound;

  return (
    <PassbookCard
      address={address}
      contribution={contribution}
      maxMembers={maxMembers || 3}
      memberCount={members.length}
      currentRound={currentRound}
      totalRounds={totalRounds || maxMembers || 3}
      state={state}
      isMyTurn={isMyTurn}
    />
  );
}
