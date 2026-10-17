'use client';

import { SEPOLIA_CHAIN_ID } from './wagmi';

export interface CustomCircleData {
  address: `0x${string}`;
  contribution: string; // in wei
  maxMembers: number;
  memberCount: number;
  currentRound: number;
  totalRounds: number;
  roundDuration: number;
  state: number; // 0: OPEN, 1: ACTIVE, 2: COMPLETED
  creator: string;
  members: string[];
  winnerHistory: string[];
  isMyTurn?: boolean;
}

export function isDemoAddress(address?: string): boolean {
  if (!address) return true;
  const a = address.toLowerCase();
  return (
    a.startsWith('0x1234') ||
    a.startsWith('0xabcd') ||
    a.startsWith('0x9876') ||
    a.startsWith('0x0000') ||
    a.startsWith('0xdemo')
  );
}

export function getCustomCircles(): CustomCircleData[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('bhishi_custom_circles');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function safeStringify(data: any): string {
  return JSON.stringify(data, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
}

export function saveCustomCircle(circle: CustomCircleData) {
  if (typeof window === 'undefined') return;
  try {
    const current = getCustomCircles();
    localStorage.setItem('bhishi_custom_circles', safeStringify([circle, ...current]));
  } catch (e) {
    console.error('Failed to save circle to localStorage', e);
  }
}

export function getCircleLocalState(address: string) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`bhishi_state_${address.toLowerCase()}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCircleLocalState(address: string, state: any) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`bhishi_state_${address.toLowerCase()}`, safeStringify(state));
  } catch (e) {
    console.error('Failed to save circle state to localStorage', e);
  }
}

/**
 * Direct 1-Click Sepolia Connection via MetaMask with Wagmi synchronization.
 */
export async function connectDirectSepolia(connectors?: readonly any[] | any[], connectAsync?: any): Promise<string | null> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    alert('Please install MetaMask first.');
    return null;
  }

  try {
    const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts || accounts.length === 0) return null;

    // Switch or add Sepolia (0xaa36a7 = 11155111)
    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await (window as any).ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0xaa36a7',
              chainName: 'Ethereum Sepolia',
              nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'],
              blockExplorerUrls: ['https://sepolia.etherscan.io'],
            },
          ],
        });
      }
    }

    // Synchronize Wagmi connector if hooks provided
    if (connectors && connectAsync) {
      const injected =
        connectors.find(
          (c) =>
            c.id === 'injected' ||
            c.id === 'metaMask' ||
            c.id === 'io.metamask' ||
            c.name.toLowerCase().includes('metamask')
        ) || connectors[0];
      if (injected) {
        try {
          await connectAsync({ connector: injected, chainId: SEPOLIA_CHAIN_ID });
        } catch (wagmiErr) {
          // Wagmi may complain if already connected or pending; accounts[0] is still valid
          console.warn('Wagmi connector sync notice:', wagmiErr);
        }
      }
    }

    return accounts[0];
  } catch (e: any) {
    console.error('Connection cancelled or error:', e);
    return null;
  }
}
