'use client';

import { MST_TESTNET_CHAIN_ID, MST_TESTNET_RPC } from './wagmi';

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
 * Detects the injected BridgeKey provider exclusively (MetaMask is blocked so funds/rewards go to BridgeKey).
 */
export function getBridgeKeyProvider(): any {
  if (typeof window === 'undefined') return null;
  const w = window as any;

  // 1. Primary namespace for BridgeKey
  if (w.bridgekey) return w.bridgekey;

  // 2. If multiple providers are injected in window.ethereum.providers, choose BridgeKey or non-MetaMask
  if (w.ethereum?.providers?.length) {
    const bk = w.ethereum.providers.find((p: any) => p.isBridgeKey || p.isBridgekey || !p.isMetaMask);
    if (bk) return bk;
  }

  // 3. If window.ethereum is flagged as BridgeKey
  if (w.ethereum?.isBridgeKey || w.ethereum?.isBridgekey) {
    return w.ethereum;
  }

  // 4. If window.ethereum is present and NOT MetaMask
  if (w.ethereum && !w.ethereum.isMetaMask) {
    return w.ethereum;
  }

  // If BridgeKey is the only extension or window.bridgekey exists
  return w.bridgekey || (w.ethereum && !w.ethereum.isMetaMask ? w.ethereum : null);
}

/**
 * Direct 1-Click MST Testnet Connection via BridgeKey with Wagmi synchronization.
 */
export async function connectDirectMst(connectors?: readonly any[] | any[], connectAsync?: any): Promise<string | null> {
  const provider = getBridgeKeyProvider();
  if (!provider) {
    alert('Please install or unlock BridgeKey Wallet extension. MetaMask has been disabled to ensure all MST transactions route to BridgeKey.');
    return null;
  }

  try {
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    if (!accounts || accounts.length === 0) return null;

    const hexChainId = '0x' + MST_TESTNET_CHAIN_ID.toString(16);

    // Switch or add MST Testnet
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

    // Synchronize Wagmi connector (filtering out MetaMask to prioritize BridgeKey)
    if (connectors && connectAsync) {
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

// Backwards-compatible alias
export const connectDirectSepolia = connectDirectMst;
