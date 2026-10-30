'use client';

import { defineChain } from 'viem';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { injectedWallet } from '@rainbow-me/rainbowkit/wallets';
import { http } from 'viem';

// --- MST Testnet Configuration ---
export const MST_TESTNET_CHAIN_ID = 91562037;
export const MST_TESTNET_RPC = 'https://testnetrpc.mstblockchain.com';

export const mstTestnet = defineChain({
  id: MST_TESTNET_CHAIN_ID,
  name: 'MST Testnet',
  nativeCurrency: {
    name: 'tMSTC',
    symbol: 'tMSTC',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [MST_TESTNET_RPC] },
  },
  blockExplorers: {
    default: { name: 'MSTScan', url: 'https://testnet.mstscan.com' },
  },
  testnet: true,
});

// --- MST Mainnet Configuration ---
export const MST_MAINNET_CHAIN_ID = 4646;
export const MST_MAINNET_RPC = 'https://mariorpc.mstblockchain.com';

export const mstMainnet = defineChain({
  id: MST_MAINNET_CHAIN_ID,
  name: 'MST Mainnet',
  nativeCurrency: {
    name: 'MSTC',
    symbol: 'MSTC',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [MST_MAINNET_RPC, 'https://craftrpc.mstblockchain.com'] },
  },
  blockExplorers: {
    default: { name: 'MSTScan', url: 'https://mstscan.com' },
  },
  testnet: false,
});

// Alias for backwards-compatibility
export const SEPOLIA_CHAIN_ID = MST_TESTNET_CHAIN_ID;
export const SEPOLIA_RPC = MST_TESTNET_RPC;

export const config = getDefaultConfig({
  appName: 'Bhishi - MST',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'b56e18d47c72ab683b10814fe9495694',
  chains: [mstMainnet, mstTestnet],
  wallets: [
    {
      groupName: 'Native MST Wallet',
      wallets: [injectedWallet],
    },
  ],
  transports: {
    [mstMainnet.id]: http(MST_MAINNET_RPC),
    [mstTestnet.id]: http(MST_TESTNET_RPC),
  },
  ssr: true,
});
