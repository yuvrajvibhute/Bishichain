'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';
import { http } from 'viem';

export const SEPOLIA_CHAIN_ID = 11155111;

// Public reliable Sepolia RPCs
export const SEPOLIA_RPC = 'https://ethereum-sepolia-rpc.publicnode.com';

export const config = getDefaultConfig({
  appName: 'Bhishi.eth',
  // Valid demo project id to prevent WalletConnect cloud initialization hanging
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'b56e18d47c72ab683b10814fe9495694',
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(SEPOLIA_RPC),
  },
  ssr: true,
});
