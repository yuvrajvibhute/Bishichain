import { MST_MAINNET_CHAIN_ID, MST_TESTNET_CHAIN_ID } from '@/lib/wagmi';

function getStoredContractAddress(key: string): `0x${string}` | undefined {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(key);
    if (saved && /^0x[a-fA-F0-9]{40}$/.test(saved)) return saved as `0x${string}`;
  }
  return undefined;
}

function getConfiguredContractAddress(chainId: number, kind: 'CIRCLE_FACTORY' | 'TRUST_SBT'): `0x${string}` {
  if (chainId === MST_MAINNET_CHAIN_ID) {
    const address = kind === 'CIRCLE_FACTORY'
      ? process.env.NEXT_PUBLIC_MST_MAINNET_CIRCLE_FACTORY
      : process.env.NEXT_PUBLIC_MST_MAINNET_TRUST_SBT;
    if (address) return address as `0x${string}`;

    if (Number(process.env.NEXT_PUBLIC_CHAIN_ID) === chainId) {
      const legacyAddress = kind === 'CIRCLE_FACTORY'
        ? process.env.NEXT_PUBLIC_CIRCLE_FACTORY
        : process.env.NEXT_PUBLIC_TRUST_SBT;
      if (legacyAddress) return legacyAddress as `0x${string}`;
    }
  }

  if (chainId === MST_TESTNET_CHAIN_ID) {
    const address = kind === 'CIRCLE_FACTORY'
      ? process.env.NEXT_PUBLIC_MST_TESTNET_CIRCLE_FACTORY
      : process.env.NEXT_PUBLIC_MST_TESTNET_TRUST_SBT;
    if (address) return address as `0x${string}`;

    if (Number(process.env.NEXT_PUBLIC_CHAIN_ID || MST_TESTNET_CHAIN_ID) === chainId) {
      const legacyAddress = kind === 'CIRCLE_FACTORY'
        ? process.env.NEXT_PUBLIC_CIRCLE_FACTORY
        : process.env.NEXT_PUBLIC_TRUST_SBT;
      if (legacyAddress) return legacyAddress as `0x${string}`;
    }
  }

  return '' as `0x${string}`;
}

export function getFactoryAddress(chainId: number = MST_TESTNET_CHAIN_ID): `0x${string}` {
  const saved = getStoredContractAddress(`bhishi_deployed_factory_${chainId}`);
  if (saved) return saved;

  if (chainId === MST_TESTNET_CHAIN_ID) {
    const legacySaved = getStoredContractAddress('bhishi_deployed_factory');
    if (legacySaved) return legacySaved;
  }

  return getConfiguredContractAddress(chainId, 'CIRCLE_FACTORY');
}

export function getTrustSbtAddress(chainId: number = MST_TESTNET_CHAIN_ID): `0x${string}` {
  const saved = getStoredContractAddress(`bhishi_deployed_trust_sbt_${chainId}`);
  if (saved) return saved;

  if (chainId === MST_TESTNET_CHAIN_ID) {
    const legacySaved = getStoredContractAddress('bhishi_deployed_trust_sbt');
    if (legacySaved) return legacySaved;
  }

  return getConfiguredContractAddress(chainId, 'TRUST_SBT');
}
