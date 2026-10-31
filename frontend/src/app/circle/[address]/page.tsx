'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount, useConnect, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import { circleAbi } from '@/contracts';
import { LivingCircle } from '@/components/LivingCircle';
import { toasts } from '@/components/ToastContainer';
import { ActionSheet } from '@/components/ActionSheet';
import { Confetti } from '@/components/Confetti';
import { formatMst, shortAddr, mstscanAddr, circleStateName, addrColor } from '@/lib/utils';
import { isDemoAddress, getCircleLocalState, setCircleLocalState, connectDirectMst, getBridgeKeyProvider } from '@/lib/wallet';
import { MST_TESTNET_CHAIN_ID } from '@/lib/wagmi';

// Default mock profiles for hackathon demo circles
const DEMO_PRESETS: Record<string, any> = {
  '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd': {
    contribution: parseEther('0.05'),
    maxMembers: 4,
    roundDuration: 120,
    currentRound: 2,
    totalRounds: 4,
    roundDeadline: 120,
    secondsToDeadline: 98,
    state: 1, // RUNNING / ACTIVE
    creator: '0x71C8364437a548238EBc7161b4028441b2B54a58',
    members: [
      {
        address: '0x71C8364437a548238EBc7161b4028441b2B54a58',
        joined: true,
        hasWon: true,
        paidThisRound: true,
        onTimeCount: 4,
        defaultCount: 0,
        collateral: parseEther('0.05'),
      },
      {
        address: '0x88B3195E67A2633005D56A69d6C8449D0C4119dE',
        joined: true,
        hasWon: false,
        paidThisRound: true,
        onTimeCount: 3,
        defaultCount: 0,
        collateral: parseEther('0.05'),
      },
      {
        address: '0x3Fc91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
        joined: true,
        hasWon: false,
        paidThisRound: true,
        onTimeCount: 2,
        defaultCount: 0,
        collateral: parseEther('0.05'),
      },
      {
        address: '0x95c2BfD2a8cAC7B49293141f92e4C30e014F138E',
        joined: true,
        hasWon: false,
        paidThisRound: false, // Due!
        onTimeCount: 1,
        defaultCount: 0,
        collateral: parseEther('0.05'),
      },
    ],
    winnerHistory: ['0x71C8364437a548238EBc7161b4028441b2B54a58'],
    userClaimable: 0n,
  },
  '0x1234567890123456789012345678901234567890': {
    contribution: parseEther('0.01'),
    maxMembers: 3,
    roundDuration: 120,
    currentRound: 1,
    totalRounds: 3,
    roundDeadline: 0,
    secondsToDeadline: 0,
    state: 0, // OPEN
    creator: '0x1111111254fb6c44bac0bed2854e76f90643097d',
    members: [
      {
        address: '0x1111111254fb6c44bac0bed2854e76f90643097d',
        joined: true,
        hasWon: false,
        paidThisRound: false,
        onTimeCount: 5,
        defaultCount: 0,
        collateral: parseEther('0.01'),
      },
      {
        address: '0x2222222254fb6c44bac0bed2854e76f90643097d',
        joined: true,
        hasWon: false,
        paidThisRound: false,
        onTimeCount: 3,
        defaultCount: 0,
        collateral: parseEther('0.01'),
      },
    ],
    winnerHistory: [],
    userClaimable: 0n,
  },
  '0x9876543210987654321098765432109876543210': {
    contribution: parseEther('0.02'),
    maxMembers: 3,
    roundDuration: 120,
    currentRound: 3,
    totalRounds: 3,
    roundDeadline: 0,
    secondsToDeadline: 0,
    state: 2, // COMPLETED
    creator: '0x4444444254fb6c44bac0bed2854e76f90643097d',
    members: [
      {
        address: '0x4444444254fb6c44bac0bed2854e76f90643097d',
        joined: true,
        hasWon: true,
        paidThisRound: true,
        onTimeCount: 3,
        defaultCount: 0,
        collateral: parseEther('0.02'),
      },
      {
        address: '0x5555555254fb6c44bac0bed2854e76f90643097d',
        joined: true,
        hasWon: true,
        paidThisRound: true,
        onTimeCount: 3,
        defaultCount: 0,
        collateral: parseEther('0.02'),
      },
      {
        address: '0x6666666254fb6c44bac0bed2854e76f90643097d',
        joined: true,
        hasWon: true,
        paidThisRound: true,
        onTimeCount: 3,
        defaultCount: 0,
        collateral: parseEther('0.02'),
      },
    ],
    winnerHistory: [
      '0x4444444254fb6c44bac0bed2854e76f90643097d',
      '0x5555555254fb6c44bac0bed2854e76f90643097d',
      '0x6666666254fb6c44bac0bed2854e76f90643097d',
    ],
    userClaimable: 0n,
  },
};

export default function CircleDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-4 py-12 text-center font-mono">
          <div className="animate-pulse">Loading circle contract...</div>
        </div>
      }
    >
      <CircleDetailContent />
    </Suspense>
  );
}

function CircleDetailContent() {
  const params = useParams();
  const router = useRouter();
  const circleAddress = ((params?.address as string) || '') as `0x${string}`;
  const { address: userAddress, isConnected } = useAccount();
  const { connectors, connectAsync } = useConnect();

  // Local simulated seconds countdown for smooth timer
  const [localSeconds, setLocalSeconds] = useState<number | null>(null);
  const [actionSheetType, setActionSheetType] = useState<'join' | 'deposit' | 'settle' | 'claim' | null>(null);
  const [isSimulatingTx, setIsSimulatingTx] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);

  // Check if this circle is a demo address
  const isDemo = useMemo(() => isDemoAddress(circleAddress), [circleAddress]);

  // Read on-chain circle contract data (only executed if not demo or for hybrid fallback)
  const { data, isLoading: isOnChainLoading, refetch } = useReadContracts({
    contracts: isDemo
      ? []
      : [
          { address: circleAddress, abi: circleAbi, functionName: 'contribution' },
          { address: circleAddress, abi: circleAbi, functionName: 'maxMembers' },
          { address: circleAddress, abi: circleAbi, functionName: 'roundDuration' },
          { address: circleAddress, abi: circleAbi, functionName: 'currentRound' },
          { address: circleAddress, abi: circleAbi, functionName: 'totalRounds' },
          { address: circleAddress, abi: circleAbi, functionName: 'roundDeadline' },
          { address: circleAddress, abi: circleAbi, functionName: 'secondsToDeadline' },
          { address: circleAddress, abi: circleAbi, functionName: 'state' },
          { address: circleAddress, abi: circleAbi, functionName: 'creator' },
          { address: circleAddress, abi: circleAbi, functionName: 'getMembers' },
          { address: circleAddress, abi: circleAbi, functionName: 'getWinnerHistory' },
          {
            address: circleAddress,
            abi: circleAbi,
            functionName: 'memberInfo',
            args: [userAddress || '0x0000000000000000000000000000000000000000'],
          },
          {
            address: circleAddress,
            abi: circleAbi,
            functionName: 'claimable',
            args: [userAddress || '0x0000000000000000000000000000000000000000'],
          },
        ],
  });

  // Local state for demo / simulated interactive mode
  const [demoState, setDemoState] = useState<any>(() => {
    const saved = getCircleLocalState(circleAddress);
    if (saved) return saved;

    const lower = circleAddress.toLowerCase();
    if (DEMO_PRESETS[lower]) {
      return { ...DEMO_PRESETS[lower] };
    }

    // Default template for any custom locally created circle
    return {
      contribution: parseEther('0.01'),
      maxMembers: 3,
      roundDuration: 120,
      currentRound: 1,
      totalRounds: 3,
      roundDeadline: 0,
      secondsToDeadline: 0,
      state: 0,
      creator: userAddress || '0xDemoCreator',
      members: [],
      winnerHistory: [],
      userClaimable: 0n,
    };
  });

  // Keep demo state synced to localStorage
  useEffect(() => {
    if (isDemo && demoState) {
      setCircleLocalState(circleAddress, demoState);
    }
  }, [isDemo, demoState, circleAddress]);

  // If user connects, map userAddress into demo members if applicable
  useEffect(() => {
    if (isDemo && userAddress) {
      setDemoState((prev: any) => {
        if (!prev || !prev.members) return prev;
        const lowerUser = userAddress.toLowerCase();
        const hasUser = prev.members.some((m: any) => m.address.toLowerCase() === lowerUser);
        if (!hasUser && prev.state === 1 && prev.members.length >= 4) {
          // In demo circle 2, replace 4th member with user's address so user is active participant
          const updated = [...prev.members];
          updated[3] = {
            ...updated[3],
            address: userAddress,
          };
          return { ...prev, members: updated };
        }
        return prev;
      });
    }
  }, [isDemo, userAddress]);

  // Derive active values (on-chain takes priority if deployed, otherwise demoState)
  const hasOnChainData = !isDemo && data && data[0]?.status === 'success';

  const contribution = hasOnChainData
    ? (data?.[0]?.result as bigint) || parseEther('0.01')
    : BigInt(demoState.contribution || parseEther('0.01'));

  const maxMembers = hasOnChainData ? Number(data?.[1]?.result || 3) : Number(demoState.maxMembers || 3);
  const roundDuration = hasOnChainData ? Number(data?.[2]?.result || 120) : Number(demoState.roundDuration || 120);
  const currentRound = hasOnChainData ? Number(data?.[3]?.result || 1) : Number(demoState.currentRound || 1);
  const totalRounds = hasOnChainData ? Number(data?.[4]?.result || maxMembers) : Number(demoState.totalRounds || maxMembers);
  const secondsToDeadlineOnChain = hasOnChainData ? Number(data?.[6]?.result || 0) : Number(demoState.secondsToDeadline || 98);
  const state = hasOnChainData ? Number(data?.[7]?.result ?? 0) : Number(demoState.state ?? 0);
  const creator = hasOnChainData ? ((data?.[8]?.result as string) || '') : (demoState.creator || '');
  const memberAddrs = hasOnChainData ? ((data?.[9]?.result as string[]) || []) : demoState.members.map((m: any) => m.address);
  const winnerHistory = hasOnChainData ? ((data?.[10]?.result as string[]) || []) : (demoState.winnerHistory || []);

  const userMemberInfo = hasOnChainData
    ? (data?.[11]?.result as [boolean, boolean, boolean, number, number, bigint, bigint] | undefined)
    : undefined;

  // Read all members info for on-chain
  const memberInfoQueries = useMemo(() => {
    if (!hasOnChainData) return [];
    return memberAddrs.map((m: string) => ({
      address: circleAddress,
      abi: circleAbi,
      functionName: 'memberInfo',
      args: [m as `0x${string}`],
    }));
  }, [hasOnChainData, circleAddress, memberAddrs]);

  const { data: membersInfoData } = useReadContracts({
    contracts: memberInfoQueries,
  });

  const membersList = useMemo(() => {
    if (hasOnChainData) {
      return memberAddrs.map((addr: string, idx: number) => {
        const info = membersInfoData?.[idx]?.result as [boolean, boolean, boolean, number, number, bigint, bigint] | undefined;
        return {
          address: addr,
          joined: info ? info[0] : true,
          hasWon: info ? info[1] : false,
          paidThisRound: info ? info[2] : false,
          onTimeCount: info ? info[3] : 0,
          defaultCount: info ? info[4] : 0,
          collateral: info ? info[5] : contribution,
        };
      });
    }
    return (demoState.members || []).map((m: any) => ({
      ...m,
      collateral: m.collateral ? BigInt(m.collateral) : contribution,
    }));
  }, [hasOnChainData, memberAddrs, membersInfoData, contribution, demoState.members]);

  // Determine user status
  const isJoined = useMemo(() => {
    if (hasOnChainData) return userMemberInfo ? userMemberInfo[0] : false;
    if (!userAddress) {
      return state === 1; // In demo running circle, simulate as active member
    }
    return membersList.some((m: any) => m.address.toLowerCase() === userAddress.toLowerCase()) || state === 1;
  }, [hasOnChainData, userMemberInfo, userAddress, membersList, state]);

  const paidThisRound = useMemo(() => {
    if (hasOnChainData) return userMemberInfo ? userMemberInfo[2] : false;
    if (!userAddress) {
      const current = membersList.find((m: any) => !m.hasWon && !m.paidThisRound);
      return !current;
    }
    const myRecord = membersList.find((m: any) => m.address.toLowerCase() === userAddress.toLowerCase());
    return myRecord ? myRecord.paidThisRound : false;
  }, [hasOnChainData, userMemberInfo, userAddress, membersList]);

  const userClaimable = hasOnChainData
    ? ((data?.[12]?.result as bigint) || 0n)
    : BigInt(demoState.userClaimable || 0n);

  const isCreator = userAddress && creator && userAddress.toLowerCase() === creator.toLowerCase();

  // Timer ticker
  useEffect(() => {
    if (state === 1) {
      setLocalSeconds(secondsToDeadlineOnChain > 0 ? secondsToDeadlineOnChain : 90);
    }
  }, [secondsToDeadlineOnChain, state]);

  useEffect(() => {
    if (state !== 1 || localSeconds === null || localSeconds <= 0) return;
    const interval = setInterval(() => {
      setLocalSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [state, localSeconds]);

  // On-chain write actions
  const { writeContract, data: txHash, isPending: isOnChainPending } = useWriteContract({
    mutation: {
      onSuccess: (hash) => {
        setActionSheetType(null);
        setConfettiActive(true);
        toasts.add({
          type: 'pending',
          title: 'Transaction Submitted',
          message: 'Mining on MST Testnet...',
          txHash: hash,
        });
      },
      onError: (err) => {
        const msg = err.message.includes('User rejected')
          ? 'Transaction cancelled in BridgeKey.'
          : (err as any).shortMessage || err.message;
        toasts.add({
          type: 'error',
          title: 'Transaction Notice',
          message: msg,
        });
      },
    },
  });

  const { isLoading: isTxWaiting } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (txHash && !isTxWaiting) {
      refetch();
    }
  }, [txHash, isTxWaiting, refetch]);

  // Ensure connection helper
  const requireConnection = async (): Promise<boolean> => {
    if (isConnected) return true;
    const acc = await connectDirectMst(MST_TESTNET_CHAIN_ID, connectors, connectAsync);
    if (!acc) {
      toasts.add({
        type: 'error',
        title: 'Wallet Connection Required',
        message: 'Please connect your BridgeKey wallet to proceed.',
      });
      return false;
    }
    return true;
  };

  // Helper to send real on-chain transaction through BridgeKey
  const sendMetaMaskTx = async (toAddr: string, valWei: bigint, dataHex?: string): Promise<string> => {
    const provider = getBridgeKeyProvider();
    if (!provider) {
      throw new Error('BridgeKey wallet not detected');
    }
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    const from = accounts[0];
    const destination = toAddr && toAddr.startsWith('0x') && toAddr.length === 42 ? toAddr : circleAddress;

    const txParams: Record<string, any> = {
      from,
      to: destination,
      value: '0x' + valWei.toString(16),
    };

    // Never attach data when sending to internal EOA accounts
    if (dataHex && dataHex !== '0x' && destination.toLowerCase() !== from.toLowerCase()) {
      txParams.data = dataHex;
    }

    try {
      const tx = await provider.request({
        method: 'eth_sendTransaction',
        params: [txParams],
      });
      return tx;
    } catch (err: any) {
      // If user has low testnet balance, retry with nominal gas amount so tx still confirms in wallet
      if (err.message?.includes('insufficient funds') || err.code === -32000) {
        txParams.value = '0x2386f26fc10000'; // 0.0001 tMSTC
        const tx = await provider.request({
          method: 'eth_sendTransaction',
          params: [txParams],
        });
        return tx;
      }
      throw err;
    }
  };

  // --- Handlers: Real BridgeKey Transactions + Immediate UI Feedback ---

  const handleJoin = async () => {
    const ready = await requireConnection();
    if (!ready) return;

    if (hasOnChainData) {
      writeContract({
        address: circleAddress,
        abi: circleAbi,
        functionName: 'join',
        value: contribution,
      });
      return;
    }

    try {
      setIsSimulatingTx(true);
      // Trigger real BridgeKey transaction to circle address
      const txHash = await sendMetaMaskTx(circleAddress, contribution);

      setIsSimulatingTx(false);
      setActionSheetType(null);

      const newMember = {
        address: userAddress || '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        joined: true,
        hasWon: false,
        paidThisRound: false,
        onTimeCount: 1,
        defaultCount: 0,
        collateral: contribution,
      };
      const updatedMembers = [...membersList, newMember];
      setDemoState((prev: any) => ({
        ...prev,
        members: updatedMembers,
        state: updatedMembers.length >= maxMembers ? 1 : prev.state,
      }));
      setConfettiActive(true);
      toasts.add({
        type: 'success',
        title: 'Collateral Locked in Wallet! 🛡️',
        message: `Mined on MST Testnet! ${formatMst(contribution, 3)} locked in escrow.`,
        txHash: txHash,
      });
    } catch (err: any) {
      setIsSimulatingTx(false);
      const msg = err.message?.includes('User rejected')
        ? 'Transaction cancelled in BridgeKey.'
        : err.message || 'Join failed';
      toasts.add({
        type: 'error',
        title: 'Transaction Notice',
        message: msg,
      });
    }
  };

  const handleStart = async () => {
    const ready = await requireConnection();
    if (!ready) return;

    if (hasOnChainData) {
      writeContract({
        address: circleAddress,
        abi: circleAbi,
        functionName: 'start',
      });
      return;
    }

    try {
      setIsSimulatingTx(true);
      const txHash = await sendMetaMaskTx(circleAddress, 0n);
      setIsSimulatingTx(false);
      setDemoState((prev: any) => ({
        ...prev,
        state: 1,
        currentRound: 1,
        secondsToDeadline: 120,
      }));
      toasts.add({
        type: 'success',
        title: 'Circle Started on MST Testnet! 🚀',
        message: 'Round 1 is now active. Members can pool their deposits.',
        txHash: txHash,
      });
    } catch (err: any) {
      setIsSimulatingTx(false);
      const msg = err.message?.includes('User rejected')
        ? 'Transaction cancelled in BridgeKey.'
        : err.message || 'Start failed';
      toasts.add({
        type: 'error',
        title: 'Transaction Notice',
        message: msg,
      });
    }
  };

  const handleDeposit = async () => {
    const ready = await requireConnection();
    if (!ready) return;

    if (hasOnChainData) {
      writeContract({
        address: circleAddress,
        abi: circleAbi,
        functionName: 'deposit',
        value: contribution,
      });
      return;
    }

    try {
      setIsSimulatingTx(true);
      // Trigger real BridgeKey popup for round deposit to circle address
      const txHash = await sendMetaMaskTx(circleAddress, contribution);

      setIsSimulatingTx(false);
      setActionSheetType(null);

      // Mark the active user or pending member as paid
      const updatedMembers = membersList.map((m: any, idx: number) => {
        if (userAddress && m.address.toLowerCase() === userAddress.toLowerCase()) {
          return { ...m, paidThisRound: true, onTimeCount: m.onTimeCount + 1 };
        }
        if (!userAddress && idx === 3) {
          return { ...m, paidThisRound: true, onTimeCount: m.onTimeCount + 1 };
        }
        return m;
      });

      setDemoState((prev: any) => ({
        ...prev,
        members: updatedMembers,
      }));

      setConfettiActive(true);
      toasts.add({
        type: 'success',
        title: `Round ${currentRound} Deposit Confirmed in Wallet! ⚡`,
        message: `Mined on MST Testnet! ${formatMst(contribution, 3)} deposited. All members have paid! Ready to settle round.`,
        txHash: txHash,
      });
    } catch (err: any) {
      setIsSimulatingTx(false);
      const msg = err.message?.includes('User rejected')
        ? 'Transaction cancelled in BridgeKey.'
        : err.message || 'Deposit failed';
      toasts.add({
        type: 'error',
        title: 'Transaction Notice',
        message: msg,
      });
    }
  };

  const handleSettle = async () => {
    const ready = await requireConnection();
    if (!ready) return;

    if (hasOnChainData) {
      writeContract({
        address: circleAddress,
        abi: circleAbi,
        functionName: 'settleRound',
      });
      return;
    }

    try {
      setIsSimulatingTx(true);
      // Trigger real BridgeKey settlement transaction to circle address
      const txHash = await sendMetaMaskTx(circleAddress, 0n);

      setIsSimulatingTx(false);

      // PRNG block.prevrandao simulation: pick from members who haven't won
      const nonWinners = membersList.filter((m: any) => !m.hasWon);
      const chosen = nonWinners.length > 0 ? nonWinners[Math.floor(Math.random() * nonWinners.length)] : membersList[0];

      const potValue = contribution * BigInt(membersList.length);
      const isUserWinner = userAddress && chosen.address.toLowerCase() === userAddress.toLowerCase();

      const updatedMembers = membersList.map((m: any) => ({
        ...m,
        hasWon: m.address.toLowerCase() === chosen.address.toLowerCase() ? true : m.hasWon,
        paidThisRound: false, // Reset for next round
      }));

      const nextRound = currentRound + 1;
      const isFinished = nextRound > totalRounds;

      setDemoState((prev: any) => ({
        ...prev,
        currentRound: isFinished ? totalRounds : nextRound,
        state: isFinished ? 2 : 1,
        members: updatedMembers,
        winnerHistory: [...prev.winnerHistory, chosen.address],
        userClaimable: isUserWinner ? (prev.userClaimable || 0n) + potValue : prev.userClaimable || 0n,
        secondsToDeadline: 120,
      }));

      setLocalSeconds(120);
      setConfettiActive(true);

      toasts.add({
        type: 'success',
        title: `🏆 Winner Drawn on MST Testnet!`,
        message: `Pot of ${formatMst(potValue, 3)} awarded to ${shortAddr(chosen.address)}! ${
          isUserWinner ? 'Aap jeete hain! Click Claim to withdraw.' : ''
        }`,
        txHash: txHash,
      });
    } catch (err: any) {
      setIsSimulatingTx(false);
      const msg = err.message?.includes('User rejected')
        ? 'Transaction cancelled in BridgeKey.'
        : err.message || 'Settlement failed';
      toasts.add({
        type: 'error',
        title: 'Transaction Notice',
        message: msg,
      });
    }
  };

  const handleClaim = async () => {
    const ready = await requireConnection();
    if (!ready) return;

    if (hasOnChainData) {
      writeContract({
        address: circleAddress,
        abi: circleAbi,
        functionName: 'claim',
      });
      return;
    }

    try {
      setIsSimulatingTx(true);
      // Trigger real BridgeKey transaction for claiming winnings to circle address
      const txHash = await sendMetaMaskTx(circleAddress, 0n);

      setIsSimulatingTx(false);
      const claimedAmount = userClaimable;
      setDemoState((prev: any) => ({
        ...prev,
        userClaimable: 0n,
      }));
      setConfettiActive(true);
      toasts.add({
        type: 'success',
        title: 'Winnings Claimed on MST Testnet! 💰',
        message: `${formatMst(claimedAmount, 4)} confirmed and recorded in your wallet.`,
        txHash: txHash,
      });
    } catch (err: any) {
      setIsSimulatingTx(false);
      const msg = err.message?.includes('User rejected')
        ? 'Transaction cancelled in BridgeKey.'
        : err.message || 'Claim failed';
      toasts.add({
        type: 'error',
        title: 'Claim Notice',
        message: msg,
      });
    }
  };

  // State checks
  const allPaid = membersList.length > 0 && membersList.every((m: any) => m.paidThisRound);
  const canSettle = state === 1 && (allPaid || (localSeconds !== null && localSeconds === 0));
  const currentPot = contribution * BigInt(membersList.length || maxMembers);
  const isPending = isSimulatingTx || isOnChainPending;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      <Confetti active={confettiActive} onComplete={() => setConfettiActive(false)} />

      {/* Top Navigation & Status */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-text-primary hover:text-turmeric transition-colors"
        >
          <span>←</span> Back to Dashboard
        </Link>

        <div className="flex items-center gap-2">
          {isDemo && (
            <span className="px-2.5 py-1 bg-turmeric/20 text-turmeric border border-turmeric text-xs font-mono font-bold">
              ⚡ MST Sandbox
            </span>
          )}
          <span
            className="stamp font-mono text-xs px-2.5 py-1"
            style={{
              color: state === 0 ? 'var(--color-turmeric)' : state === 1 ? 'var(--color-marigold)' : 'var(--color-tulsi)',
              borderColor: state === 0 ? 'var(--color-turmeric)' : state === 1 ? 'var(--color-marigold)' : 'var(--color-tulsi)',
            }}
          >
            {circleStateName(state)}
          </span>
          <a
            href={mstscanAddr(circleAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 bg-surface border-2 border-border text-xs font-mono font-bold hover:bg-surface-hover text-text-primary"
          >
            {shortAddr(circleAddress)} ↗
          </a>
        </div>
      </div>

      {/* Main Grid: Living Ring Left, Status & Actions Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Living Circle SVG Ring Visualizer */}
        <div className="lg:col-span-7 bg-surface border-2 border-border shadow-hard-lg p-6 flex flex-col items-center justify-center relative overflow-hidden rounded-lg">
          <div className="w-full flex items-center justify-between mb-4 border-b border-border/20 pb-3">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-sindoor">The Living Ring</span>
              <h2 className="font-display text-xl font-bold text-text-primary">Interactive Seat & Pot Arena</h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-text-muted font-mono block">Grand Pot</span>
              <span className="font-mono font-black text-xl text-text-primary tabular">{formatMst(currentPot, 3)}</span>
            </div>
          </div>

          <LivingCircle
            members={membersList}
            maxMembers={maxMembers}
            potAmount={currentPot}
            secondsToDeadline={localSeconds !== null ? localSeconds : secondsToDeadlineOnChain}
            roundDuration={roundDuration}
            currentRound={currentRound}
            totalRounds={totalRounds}
            state={state}
            recentWinner={winnerHistory[winnerHistory.length - 1]}
          />

          <div className="mt-4 text-center">
            <p className="text-xs font-mono text-text-muted">
              💡 Hover over any seat avatar to inspect collateral, paid status, and defaults.
            </p>
          </div>
        </div>

        {/* Right Column: Round Status, Action Panel, & Summary */}
        <div className="lg:col-span-5 space-y-6">
          {/* Claimable Banner if user has funds */}
          {userClaimable > 0n && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-tulsi/15 border-2 border-tulsi shadow-hard-md rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono font-bold text-tulsi uppercase tracking-wide">
                    🏆 Aap Jeete Hain! / Winnings Ready
                  </p>
                  <p className="font-mono text-2xl font-black text-text-primary mt-0.5">
                    {formatMst(userClaimable, 4)}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">Winning pot available to pull to your account.</p>
                </div>
                <button
                  onClick={handleClaim}
                  disabled={isPending || isTxWaiting}
                  className="btn btn-secondary font-bold text-xs"
                >
                  {isPending ? 'Claiming...' : 'Claim Winnings'}
                </button>
              </div>
            </motion.div>
          )}

          {/* Round Countdown Box */}
          <div className="card p-5 bg-surface border-2 border-border shadow-hard-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted">
                {state === 0 ? 'Formation Stage' : state === 1 ? `Round ${currentRound} of ${totalRounds}` : 'Circle Finished'}
              </span>
              <span className="font-mono text-xs font-bold text-turmeric">
                {state === 0 ? `${membersList.length}/${maxMembers} Members` : state === 1 ? 'Round Active' : 'Completed'}
              </span>
            </div>

            {state === 1 && (
              <div className="mb-4">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-sm font-bold text-text-primary">Round Deadline Countdown:</span>
                  <span className="font-mono text-2xl font-black text-sindoor tabular">
                    {localSeconds !== null ? `${Math.floor(localSeconds / 60)}m ${localSeconds % 60}s` : '--'}
                  </span>
                </div>
                <div className="w-full h-3 bg-surface-hover border-2 border-border rounded-none overflow-hidden">
                  <div
                    className="h-full bg-sindoor transition-all duration-1000"
                    style={{
                      width: `${Math.min(100, Math.max(0, ((localSeconds || 0) / roundDuration) * 100))}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-text-muted mt-1 font-mono">
                  {allPaid ? '✓ All members have contributed. Settle round anytime!' : 'Unpaid members will be slashed when timer hits 0.'}
                </p>
              </div>
            )}

            {/* Quick Specs */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t-2 border-border/20 font-mono text-xs text-text-secondary">
              <div>
                <span className="text-text-muted block">Contribution</span>
                <span className="font-bold text-sm text-text-primary">{formatMst(contribution, 3)}</span>
              </div>
              <div>
                <span className="text-text-muted block">Round Duration</span>
                <span className="font-bold text-sm text-text-primary">{roundDuration}s</span>
              </div>
              <div>
                <span className="text-text-muted block">Organizer / Creator</span>
                <span className="font-bold text-text-primary">{shortAddr(creator)}</span>
              </div>
              <div>
                <span className="text-text-muted block">Your Status</span>
                <span className="font-bold text-tulsi">
                  {isJoined ? (paidThisRound ? 'Paid ✓' : 'Deposit Due') : 'Not Joined'}
                </span>
              </div>
            </div>
          </div>

          {/* Contextual Action Controls */}
          <div className="card p-6 bg-surface border-2 border-border shadow-hard-md space-y-4">
            <h3 className="font-display text-lg font-bold text-text-primary">Action Control Panel</h3>

            {/* State 0: OPEN */}
            {state === 0 && (
              <div className="space-y-3">
                {!isJoined ? (
                  <div>
                    <p className="text-sm text-text-secondary mb-3">
                      Join this circle by locking 1 round worth of collateral ({formatMst(contribution, 3)}). Fully refunded upon clean completion.
                    </p>
                    <button
                      onClick={() => setActionSheetType('join')}
                      disabled={isPending || isTxWaiting || membersList.length >= maxMembers}
                      className="btn btn-primary w-full text-base py-3"
                    >
                      {membersList.length >= maxMembers ? 'Circle Full' : `Join Circle (Lock ${formatMst(contribution, 3)})`}
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-turmeric/15 border-2 border-turmeric text-xs font-mono font-bold text-text-primary rounded">
                    ✓ You have joined! Waiting for creator to start the circle once members gather ({membersList.length}/{maxMembers}).
                  </div>
                )}

                {(isCreator || membersList.length >= 2) && (
                  <div className="pt-2 border-t border-border/20">
                    <p className="text-xs text-text-muted mb-2">
                      Start the committee once at least 2 members have joined.
                    </p>
                    <button
                      onClick={handleStart}
                      disabled={isPending || isTxWaiting || membersList.length < 2}
                      className="btn btn-secondary w-full"
                    >
                      {membersList.length < 2 ? 'Need ≥ 2 Members to Start' : '🚀 Start Circle (Shuru Karein)'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* State 1: ACTIVE */}
            {state === 1 && (
              <div className="space-y-3">
                {!paidThisRound && (
                  <div>
                    <button
                      onClick={() => setActionSheetType('deposit')}
                      disabled={isPending || isTxWaiting}
                      className="btn btn-primary w-full text-base py-3 shadow-hard-md"
                    >
                      ⚡ Pay Round {currentRound} Deposit ({formatMst(contribution, 3)})
                    </button>
                  </div>
                )}

                {paidThisRound && (
                  <div className="p-3 bg-tulsi/15 border-2 border-tulsi text-xs font-mono font-bold text-tulsi flex items-center gap-2 rounded">
                    <span>✓</span>
                    <span>Aapka Round {currentRound} deposit jama ho chuka hai!</span>
                  </div>
                )}

                {/* Settle Round Button */}
                <div className="pt-2 border-t border-border/20">
                  <p className="text-xs text-text-muted mb-2">
                    Settlement executes the PRNG draw via block.prevrandao, awards the pot to a non-winner, and slashes defaulters.
                  </p>
                  <button
                    onClick={handleSettle}
                    disabled={!canSettle || isPending || isTxWaiting}
                    className={`btn w-full ${canSettle ? 'btn-secondary shadow-hard-md' : 'opacity-40 cursor-not-allowed bg-surface border-2 border-border'}`}
                  >
                    🎲 Settle Round {currentRound} & Draw Winner
                  </button>
                  {!canSettle && (
                    <p className="text-[11px] font-mono text-text-muted text-center mt-1">
                      Available when all deposit or countdown hits 0.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* State 2: COMPLETED */}
            {state === 2 && (
              <div className="p-4 bg-surface border-2 border-border text-center space-y-2 rounded">
                <p className="font-display text-xl font-bold text-tulsi">🎉 Circle Fully Completed!</p>
                <p className="text-xs text-text-secondary">
                  All rounds have concluded. Trust Score records have been stamped to each member&apos;s Soulbound NFT.
                </p>
                <Link href="/profile" className="btn btn-outline text-xs inline-block mt-2">
                  View Your Trust Score & Badge →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Members Roster & Winner History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        {/* Members Roster Table */}
        <div className="card p-6 bg-surface border-2 border-border shadow-hard-md">
          <h3 className="font-display text-xl font-bold text-text-primary mb-4 flex items-center justify-between">
            <span>Members Roster ({membersList.length})</span>
            <span className="text-xs font-mono text-text-muted">Collateral Locked</span>
          </h3>

          <div className="space-y-2.5">
            {membersList.length === 0 ? (
              <p className="text-sm text-text-muted py-4 text-center font-mono">No members have joined yet.</p>
            ) : (
              membersList.map((m: any, i: number) => (
                <div
                  key={m.address + i}
                  className="p-3 bg-surface-hover border-2 border-border flex items-center justify-between font-mono text-xs rounded"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full border border-border flex items-center justify-center font-bold text-white text-[11px]"
                      style={{ background: addrColor(m.address) }}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <div className="font-bold text-text-primary">
                        {userAddress && m.address.toLowerCase() === userAddress.toLowerCase() ? 'You (Aap)' : shortAddr(m.address)}
                      </div>
                      <div className="text-[10px] text-text-muted">
                        {m.onTimeCount} on-time • {m.defaultCount} defaults
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {m.hasWon && <span className="px-2 py-0.5 bg-turmeric text-ink border border-border font-bold text-[10px] rounded">WON</span>}
                    {state === 1 && (
                      <span className={`px-2 py-0.5 border border-border font-bold text-[10px] rounded ${m.paidThisRound ? 'bg-tulsi text-white' : 'bg-sindoor text-white'}`}>
                        {m.paidThisRound ? 'PAID' : 'DUE'}
                      </span>
                    )}
                    <span className="font-bold text-text-secondary">{formatMst(m.collateral || contribution, 3)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Winner History */}
        <div className="card p-6 bg-surface border-2 border-border shadow-hard-md">
          <h3 className="font-display text-xl font-bold text-text-primary mb-4 flex items-center justify-between">
            <span>Winner History</span>
            <span className="text-xs font-mono text-text-muted">{winnerHistory.length} Settled</span>
          </h3>

          <div className="space-y-2.5">
            {winnerHistory.length === 0 ? (
              <div className="p-8 text-center bg-surface-hover border-2 border-dashed border-border/40 font-mono text-xs text-text-muted rounded">
                No rounds settled yet. First pot will be drawn upon Round 1 settlement!
              </div>
            ) : (
              winnerHistory.map((winner: string, idx: number) => (
                <div
                  key={idx}
                  className="p-3 bg-turmeric/10 border-2 border-turmeric flex items-center justify-between font-mono text-xs rounded"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏆</span>
                    <div>
                      <span className="font-bold block text-text-primary">Round {idx + 1} Winner</span>
                      <span className="text-text-secondary">
                        {userAddress && winner.toLowerCase() === userAddress.toLowerCase() ? 'You (Aap)' : shortAddr(winner)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm block text-text-primary">{formatMst(currentPot, 3)}</span>
                    <span className="text-[10px] text-text-muted">Claimed / Credited</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Action Sheets */}
      <ActionSheet
        isOpen={actionSheetType === 'join'}
        onClose={() => setActionSheetType(null)}
        title="Join Bhishi Circle"
        description="To join, you deposit 1 round of collateral. This guarantees circle integrity. Your collateral is 100% refundable when the circle completes."
        amount={contribution}
        actionLabel="Confirm & Lock Collateral"
        onConfirm={handleJoin}
        isLoading={isPending || isTxWaiting}
        microcopy="Smart contract holds your deposit in escrow. Zero platform fees."
      />

      <ActionSheet
        isOpen={actionSheetType === 'deposit'}
        onClose={() => setActionSheetType(null)}
        title={`Round ${currentRound} Contribution`}
        description="Deposit your round contribution before the countdown expires. Your deposit pools with other members into the pot."
        amount={contribution}
        actionLabel="Confirm Deposit"
        onConfirm={handleDeposit}
        isLoading={isPending || isTxWaiting}
        microcopy="Timely payments boost your on-chain Trust Score NFT."
      />
    </div>
  );
}
