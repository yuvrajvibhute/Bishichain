import { formatEther } from 'viem';

/**
 * Format token value for display (e.g. "0.1 tMSTC")
 */
export function formatEth(value: bigint, decimals = 4): string {
  return `${parseFloat(formatEther(value)).toFixed(decimals)} tMSTC`;
}

/**
 * Shorten an Ethereum/MST address for display
 */
export function shortAddr(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/**
 * Returns a deterministic color for an address (for avatar backgrounds)
 */
export function addrColor(addr: string): string {
  const colors = [
    '#F2A900', '#E8752A', '#2D7A4F', '#C1291B',
    '#6B4226', '#8B5E3C', '#4A7C59', '#D4A017',
  ];
  const idx = parseInt(addr.slice(2, 4), 16) % colors.length;
  return colors[idx];
}

/**
 * Returns initials from an address (for avatar display)
 */
export function addrInitials(addr: string): string {
  if (!addr) return '??';
  return addr.slice(2, 4).toUpperCase();
}

/**
 * Format seconds as countdown string: "2h 30m 15s"
 */
export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return 'Expired';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/**
 * Circle state as readable string
 */
export function circleStateName(state: number): 'OPEN' | 'RUNNING' | 'DONE' {
  if (state === 0) return 'OPEN';
  if (state === 1) return 'RUNNING';
  return 'DONE';
}

/**
 * MSTScan tx link
 */
export function etherscanTx(hash: string): string {
  const base = process.env.NEXT_PUBLIC_ETHERSCAN_BASE || 'https://testnet.mstscan.com';
  return `${base.replace(/\/$/, '')}/tx/${hash}`;
}

/**
 * MSTScan address link
 */
export function etherscanAddr(addr: string): string {
  const base = process.env.NEXT_PUBLIC_ETHERSCAN_BASE || 'https://testnet.mstscan.com';
  return `${base.replace(/\/$/, '')}/address/${addr}`;
}

/**
 * Parse a base64 data URI (tokenURI) to extract SVG image
 */
export function parseSbtMetadata(dataUri: string): { image: string; attributes: Record<string, string> } {
  try {
    const base64Json = dataUri.replace('data:application/json;base64,', '');
    const json = JSON.parse(atob(base64Json));
    const attributes: Record<string, string> = {};
    if (Array.isArray(json.attributes)) {
      for (const attr of json.attributes) {
        attributes[attr.trait_type] = String(attr.value);
      }
    }
    return {
      image: json.image || '',
      attributes,
    };
  } catch {
    return { image: '', attributes: {} };
  }
}
