'use client';

import {
  MST_TESTNET_CHAIN_ID,
  MST_TESTNET_RPC,
  MST_MAINNET_CHAIN_ID,
  MST_MAINNET_RPC,
} from './wagmi';

export interface MstNetworkConfig {
  id: number;
  name: string;
  shortName: string;
  hexChainId: string;
  rpcUrl: string;
  currencySymbol: string;
  currencyName: string;
  explorerUrl: string;
  isTestnet: boolean;
}

export const MST_NETWORKS: Record<number, MstNetworkConfig> = {
  [MST_MAINNET_CHAIN_ID]: {
    id: MST_MAINNET_CHAIN_ID,
    name: 'MST Mainnet',
    shortName: 'Mainnet',
    hexChainId: '0x' + MST_MAINNET_CHAIN_ID.toString(16),
    rpcUrl: MST_MAINNET_RPC,
    currencySymbol: 'MSTC',
    currencyName: 'MSTC',
    explorerUrl: 'https://mstscan.com',
    isTestnet: false,
  },
  [MST_TESTNET_CHAIN_ID]: {
    id: MST_TESTNET_CHAIN_ID,
    name: 'MST Testnet',
    shortName: 'Testnet',
    hexChainId: '0x' + MST_TESTNET_CHAIN_ID.toString(16),
    rpcUrl: MST_TESTNET_RPC,
    currencySymbol: 'tMSTC',
    currencyName: 'tMSTC',
    explorerUrl: 'https://testnet.mstscan.com',
    isTestnet: true,
  },
};

export async function switchMstNetwork(
  targetChainId: number,
  requestSwitch: () => Promise<unknown>
): Promise<void> {
  const network = MST_NETWORKS[targetChainId];
  if (!network) {
    throw new Error(`Unsupported MST network: ${targetChainId}`);
  }

  const provider = getBridgeKeyProvider();
  if (!provider) {
    throw new Error('BridgeKey wallet is not available.');
  }

  await requestSwitch();

  const actualChainId = parseInt(await provider.request({ method: 'eth_chainId' }), 16);
  if (actualChainId !== targetChainId) {
    throw new Error(`Network switch was not confirmed. Wallet is still on chain ${actualChainId}.`);
  }
}

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
 * Direct 1-Click MST Connection via BridgeKey with Wagmi synchronization.
 * Supports switching/adding either MST Mainnet (4646) or MST Testnet (91562037).
 */
export async function connectDirectMst(
  targetChainId: number = MST_TESTNET_CHAIN_ID,
  connectors?: readonly any[] | any[],
  connectAsync?: any
): Promise<string | null> {
  const provider = getBridgeKeyProvider();
  if (!provider) {
    alert('Please install or unlock BridgeKey Wallet extension. MetaMask has been disabled to ensure all MST transactions route to BridgeKey.');
    return null;
  }

  const network = MST_NETWORKS[targetChainId] || MST_NETWORKS[MST_TESTNET_CHAIN_ID];

  try {
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    if (!accounts || accounts.length === 0) return null;

    // Switch or add target MST network
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: network.hexChainId }],
      });

      // Verify the provider actually switched (guard against silent rejections)
      const actualChainHex = await provider.request({ method: 'eth_chainId' });
      const actualChainId = parseInt(actualChainHex, 16);
      if (actualChainId !== network.id) {
        throw new Error(`Network switch was not completed. Got chain ${actualChainId}, expected ${network.id}.`);
      }
    } catch (switchError: any) {
      if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
        // Chain not registered in wallet — add it
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: network.hexChainId,
              chainName: network.name,
              nativeCurrency: { name: network.currencyName, symbol: network.currencySymbol, decimals: 18 },
              rpcUrls: [network.rpcUrl],
              blockExplorerUrls: [network.explorerUrl],
            },
          ],
        });
      } else {
        // User rejected the switch (code 4001) or some other error — propagate it
        throw switchError;
      }
    }

    // Synchronize Wagmi connector (filtering out MetaMask to prioritize BridgeKey)
    if (connectors && connectAsync) {
      const injected =
        connectors.find(
          (c: any) =>
            c.id === 'bridgekey' ||
            c.name?.toLowerCase().includes('bridgekey') ||
            (c.id === 'injected' && !c.name?.toLowerCase().includes('metamask'))
        ) || connectors.find((c: any) => c.id === 'injected') || connectors[0];
      if (injected) {
        try {
          await connectAsync({ connector: injected, chainId: network.id });
        } catch (wagmiErr) {
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
