// ─────────────────────────────────────────────────────────────────────────────
// Bhishi.mst — CircleFactory ABI
// Auto-generated. Do not edit manually — run contracts/deploy.sh to update.
// ─────────────────────────────────────────────────────────────────────────────

export function getFactoryAddress(): `0x${string}` {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('bhishi_deployed_factory');
    if (saved && saved.startsWith('0x') && saved.length === 42) return saved as `0x${string}`;
  }
  return (process.env.NEXT_PUBLIC_CIRCLE_FACTORY || '') as `0x${string}`;
}

export function getTrustSbtAddress(): `0x${string}` {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('bhishi_deployed_trust_sbt');
    if (saved && saved.startsWith('0x') && saved.length === 42) return saved as `0x${string}`;
  }
  return (process.env.NEXT_PUBLIC_TRUST_SBT || '') as `0x${string}`;
}

export const CIRCLE_FACTORY_ADDRESS = (process.env.NEXT_PUBLIC_CIRCLE_FACTORY || '') as `0x${string}`;
export const TRUST_SBT_ADDRESS      = (process.env.NEXT_PUBLIC_TRUST_SBT || '')      as `0x${string}`;

export const circleFactoryAbi = [
  {
    "type": "constructor",
    "inputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createCircle",
    "inputs": [
      { "name": "contribution",  "type": "uint256", "internalType": "uint256" },
      { "name": "maxMembers",    "type": "uint8",   "internalType": "uint8"   },
      { "name": "roundDuration", "type": "uint64",  "internalType": "uint64"  }
    ],
    "outputs": [{ "name": "circle", "type": "address", "internalType": "address" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "totalCircles",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getAllCircles",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address[]", "internalType": "address[]" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getCirclesByCreator",
    "inputs": [{ "name": "creator", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "address[]", "internalType": "address[]" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "allCircles",
    "inputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "trustSBT",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "CircleCreated",
    "inputs": [
      { "name": "circle",       "type": "address", "indexed": true  },
      { "name": "creator",      "type": "address", "indexed": true  },
      { "name": "contribution", "type": "uint256", "indexed": false },
      { "name": "maxMembers",   "type": "uint8",   "indexed": false },
      { "name": "roundDuration","type": "uint64",  "indexed": false }
    ],
    "anonymous": false
  }
] as const;

export const circleAbi = [
  {
    "type": "function",
    "name": "join",
    "inputs": [],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "start",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "deposit",
    "inputs": [],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "settleRound",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "claim",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "state",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint8", "internalType": "enum Circle.State" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "currentRound",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint8", "internalType": "uint8" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "roundDeadline",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint64", "internalType": "uint64" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "contribution",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "maxMembers",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint8", "internalType": "uint8" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "creator",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "roundDuration",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint64", "internalType": "uint64" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getMembers",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address[]", "internalType": "address[]" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getMembersLength",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getWinnerHistory",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address[]", "internalType": "address[]" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "memberInfo",
    "inputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "outputs": [
      { "name": "joined",        "type": "bool",    "internalType": "bool"    },
      { "name": "hasWon",        "type": "bool",    "internalType": "bool"    },
      { "name": "paidThisRound", "type": "bool",    "internalType": "bool"    },
      { "name": "onTimeCount",   "type": "uint32",  "internalType": "uint32"  },
      { "name": "defaultCount",  "type": "uint32",  "internalType": "uint32"  },
      { "name": "collateral",    "type": "uint256", "internalType": "uint256" },
      { "name": "holdback",      "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "claimable",
    "inputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "secondsToDeadline",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalRounds",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint8", "internalType": "uint8" }],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "Joined",
    "inputs": [
      { "name": "member",     "type": "address", "indexed": true  },
      { "name": "collateral", "type": "uint256", "indexed": false }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Started",
    "inputs": [
      { "name": "totalRounds",   "type": "uint8",  "indexed": false },
      { "name": "firstDeadline", "type": "uint64", "indexed": false }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Deposited",
    "inputs": [
      { "name": "member", "type": "address", "indexed": true  },
      { "name": "round",  "type": "uint8",   "indexed": false }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Slashed",
    "inputs": [
      { "name": "member", "type": "address", "indexed": true  },
      { "name": "amount", "type": "uint256", "indexed": false },
      { "name": "round",  "type": "uint8",   "indexed": false }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RoundSettled",
    "inputs": [
      { "name": "round",  "type": "uint8",   "indexed": true  },
      { "name": "winner", "type": "address", "indexed": true  },
      { "name": "pot",    "type": "uint256", "indexed": false }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Claimed",
    "inputs": [
      { "name": "member", "type": "address", "indexed": true  },
      { "name": "amount", "type": "uint256", "indexed": false }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "CircleCompleted",
    "inputs": [
      { "name": "totalRounds", "type": "uint8", "indexed": false }
    ],
    "anonymous": false
  }
] as const;

export const trustSbtAbi = [
  {
    "type": "function",
    "name": "score",
    "inputs": [{ "name": "member", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "int256", "internalType": "int256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getRecord",
    "inputs": [{ "name": "member", "type": "address", "internalType": "address" }],
    "outputs": [
      { "name": "completed", "type": "uint32", "internalType": "uint32" },
      { "name": "onTime",    "type": "uint32", "internalType": "uint32" },
      { "name": "defaults",  "type": "uint32", "internalType": "uint32" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "tokenURI",
    "inputs": [{ "name": "tokenId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [{ "name": "", "type": "string", "internalType": "string" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "ownerOf",
    "inputs": [{ "name": "tokenId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [{ "name": "owner", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "records",
    "inputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "outputs": [
      { "name": "completed", "type": "uint32", "internalType": "uint32" },
      { "name": "onTime",    "type": "uint32", "internalType": "uint32" },
      { "name": "defaults",  "type": "uint32", "internalType": "uint32" }
    ],
    "stateMutability": "view"
  }
] as const;
