# Bhishi (बीशी) — Trustless Chit-Fund Committees on MST Blockchain

> **"Panchayat on chain. Bachat bina organizer."**  
> Replace WhatsApp chaos and runaway organizers with trustless smart contracts on MST Blockchain Testnet. Build verifiable on-chain financial reputation through soulbound Trust Score NFTs.

---

## 🌟 What is Bhishi?

**Bhishi** (also known as Chit Fund, ROSCA, Committee, or Tanda across South Asia and Latin America) is a community savings vehicle where $N$ members pool a fixed sum each round. One member wins the entire pot each round, until every member has won once.

Traditional chit funds suffer from two fatal vulnerabilities:
1. **The Runaway Organizer**: The committee leader collects the pot and vanishes.
2. **The "Win & Ghost" Defaulter**: An early winner receives a massive pot, stops contributing to future rounds, and disappears.

**Bhishi solves both completely on-chain:**
- 🛡️ **Zero Trusted Organizer**: Smart contracts autonomously enforce deadlines, collect funds, conduct pseudo-random draws via `prevrandao`, and distribute winnings.
- 🔒 **Collateral Escrow & Slashing**: Members lock 1x round contribution upfront as collateral. If a member misses a deadline, their collateral is slashed to fill the pot, and a default is permanently recorded.
- ⏳ **30% Early-Winner Holdback**: When early winners claim, 30% of their winnings is held in trust until the entire circle finishes, disincentivizing ghosting.
- 💎 **Soulbound Trust Score NFT (`TrustSBT`)**: Non-transferable ERC-721 token that computes your portable reputation directly on-chain (+10 pts per on-time payment, +50 pts per completed circle, -50 pts per default).

---

## 📜 Deployment Details (MST Testnet)

* **Network Name:** MST Testnet
* **Chain ID:** `91562037` (`0x5752035`)
* **RPC URL:** `https://testnetrpc.mstblockchain.com`
* **Native Token:** `tMSTC`
* **Block Explorer:** [https://testnet.mstscan.com](https://testnet.mstscan.com)
* **Deployment Transaction Hash:** [`0x2d45bc2108cf9bd318e282da8d89ece4f4d869e24d015b9a61a15bcf79679e58`](https://testnet.mstscan.com/tx/0x2d45bc2108cf9bd318e282da8d89ece4f4d869e24d015b9a61a15bcf79679e58)
* **CircleFactory Contract:** [`0xf8a27c259a8912f17468b0bb15de371a25d9caab`](https://testnet.mstscan.com/address/0xf8a27c259a8912f17468b0bb15de371a25d9caab)
* **TrustSBT Contract:** [`0x62756310a85a87ea9e8b3abfc10fc4dbccc5c35a`](https://testnet.mstscan.com/address/0x62756310a85a87ea9e8b3abfc10fc4dbccc5c35a)
* **Supported Wallet:** **BridgeKey Wallet** (Native MST Blockchain Web3 Wallet)

---

## 🏗️ Architecture

```mermaid
graph TB
    subgraph "Smart Contracts (Foundry / Solidity ^0.8.24)"
        TS[TrustSBT.sol\nERC-721 Soulbound NFT]
        CF[CircleFactory.sol\nRegistry & Deployer]
        C[Circle.sol\nEscrow, Slashing, Pull Payments]
        
        CF -->|authorized deployer| TS
        CF -->|deploys| C
        C -->|records credit stats| TS
    end

    subgraph "Frontend (Next.js 16 + Wagmi v2 + Viem + RainbowKit + BridgeKey)"
        LP["Landing Page (/)\n4-Beat Interactive Scroll Story"]
        DB["Dashboard (/dashboard)\nPassbook Cards & Multi-step Stepper"]
        CR["Circle Page (/circle/[address])\nLiving Ring SVG & Arena Controls"]
        PR["Profile (/profile)\n3D Tilt Holographic SBT Card"]
    end

    C <-->|reads & writes| CR
    CF <-->|factory events| DB
    TS <-->|on-chain SVG| PR
```

---

## 🚀 Quickstart

### 1. Smart Contracts (Foundry)

```bash
cd contracts

# Run comprehensive test suite (28 passing tests)
forge test -vv

# Deploy to MST Testnet (PowerShell)
.\deploy.ps1 -PrivateKey $env:PRIVATE_KEY

# Or using Forge directly
forge script script/Deploy.s.sol --rpc-url https://testnetrpc.mstblockchain.com --private-key $env:PRIVATE_KEY --broadcast -vvv
```

### 2. Frontend (Next.js 16 App Router)

```bash
cd frontend

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) with your **BridgeKey Wallet** extension enabled!

---

## 🎨 Design Philosophy: Neo-Desi Aesthetic

- **Color Palette**: 
  - `Paper (#F6F0E4)` — Aged bond paper texture
  - `Turmeric / Haldi (#F2A900)` — Prosperity & auspicious savings
  - `Marigold / Genda (#E8752A)` — Energy & celebratory pot wins
  - `Sindoor (#C1291B)` — Urgent alerts & slashed collateral
  - `Tulsi (#2D7A4F)` — Safe on-time deposits & positive reputation
  - `Charcoal Ink (#15120E)` — Sharp contrast and brutalist borders
- **Typography**: 
  - Display: **Fraunces** (antique editorial serif)
  - UI: **Inter Tight** (clean financial legibility)
  - Data / Addresses: **JetBrains Mono**
- **NeoPop Physics**: Hard shadows (`4px 4px 0 #15120E`), tactile stamps (`OPEN`, `RUNNING`, `DONE`), and smooth interactive SVG animations.

---

## 🧪 Security & Invariant Tests

All 28 unit and fuzz tests pass:
- ✅ **Happy Path**: 2, 3, and 5-member complete circles
- ✅ **Collateral Slashing**: Defaulters get collateral slashed to fill pot
- ✅ **All-Defaulter Recovery**: Safe termination and refund mechanics
- ✅ **Early Settlement**: Instant trigger when all members deposit before deadline
- ✅ **Reentrancy Protection**: ReentrancyGuard on `claim()` pull-payment
- ✅ **Soulbound Enforced**: `TrustSBT._update` blocks all transfers and approvals
- ✅ **Holdback Release**: 30% withheld from early winners is securely released at circle completion

---

## 📜 Verified Contracts (MST Testnet)

| Contract | Address | Description |
|---|---|---|
| `CircleFactory.sol` | [`0xf8a27c259a8912f17468b0bb15de371a25d9caab`](https://testnet.mstscan.com/address/0xf8a27c259a8912f17468b0bb15de371a25d9caab) | Circle deployer & master registry |
| `TrustSBT.sol` | [`0x62756310a85a87ea9e8b3abfc10fc4dbccc5c35a`](https://testnet.mstscan.com/address/0x62756310a85a87ea9e8b3abfc10fc4dbccc5c35a) | Soulbound NFT with on-chain SVG generation |
| `Circle.sol` | *Spawned dynamically by factory* | Core escrow, round timer, prevrandao PRNG draw |

---

Developed for **MST Blockchain Buildathon**.
