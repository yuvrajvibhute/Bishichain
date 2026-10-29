# Bhishi.eth — Hackathon Demo Guide 🎙️

Welcome judges and evaluators! This guide walks you through every feature and user journey of **Bhishi** on MST Blockchain Testnet.

### 📜 Live On-Chain Deployments (MST Testnet)
* **Deployment Tx:** [`0x2d45bc2108cf9bd318e282da8d89ece4f4d869e24d015b9a61a15bcf79679e58`](https://testnet.mstscan.com/tx/0x2d45bc2108cf9bd318e282da8d89ece4f4d869e24d015b9a61a15bcf79679e58)
* **CircleFactory Contract:** [`0xf8a27c259a8912f17468b0bb15de371a25d9caab`](https://testnet.mstscan.com/address/0xf8a27c259a8912f17468b0bb15de371a25d9caab)
* **TrustSBT Contract:** [`0x62756310a85a87ea9e8b3abfc10fc4dbccc5c35a`](https://testnet.mstscan.com/address/0x62756310a85a87ea9e8b3abfc10fc4dbccc5c35a)

---

## 🧭 1. Landing Page (`/`) — The 4-Beat Scroll Story

1. Open `http://localhost:3000/`.
2. **Beat 1: WhatsApp Chaos**: Experience the relatable nightmare of traditional chit funds — missed messages, lost paper registers, disputed payments.
3. **Beat 2: Runaway Organizer**: Why centralized committee organizers fail ($millions lost annually to chit fund fraud).
4. **Beat 3: The Contract Assembles**: Dynamic visual representation of autonomous smart contracts replacing the organizer.
5. **Beat 4: Soulbound Trust Score**: How prompt savers earn a portable on-chain credit score.
6. Click **"Shuru Karein" (Start Now)** or navigate to the Dashboard.

---

## 🏛️ 2. Passbook Dashboard (`/dashboard`)

1. Connect your wallet using the **BridgeKey** button in the top right. Make sure your network is set to **MST Testnet**.
2. **Filter Tabs**: Browse `All`, `Open (Joining)`, `Active (Running)`, or `Demo Simulation`.
3. Click **"➕ Nayi Bhishi Banayein"** to trigger the **Conversational Stepper**:
   - **Step 1**: Choose contribution amount (e.g. `0.005 ETH`, `0.01 ETH`, or custom).
   - **Step 2**: Select number of members (2 to 10). Notice the live pot preview updating automatically!
   - **Step 3**: Select round duration (`2 Minutes Demo` for fast testing, 1 Hour, 1 Day, or 1 Week).
   - Click **"🚀 Create Circle (Shuru Karein)"** and confirm the transaction in your wallet.

---

## 🎯 3. The Living Ring Arena (`/circle/[address]`)

Click into any circle (or a demo circle) to experience the centerpiece of Bhishi.eth:

### Features to Inspect:
- **Interactive SVG Living Circle**:
  - Hover over member avatars to view their real-time collateral, payment status, on-time streak, and default counts.
  - Watch the **Brass Pot (Matka)** in the center display the accumulated prize pool.
  - Watch the **Circular Timer Arc** smoothly drain as the round deadline approaches.
- **Round Action Control Panel**:
  - **Join Circle**: Locks 1 round contribution as collateral. 
  - **Start Circle**: (Creator only) Triggers when ≥ 2 members join.
  - **Pay Round Deposit**: Pays the current round contribution.
  - **Settle Round**: Callable by anyone once the countdown hits 0 (or all members have deposited). Slashes defaulters and runs the on-chain draw.
  - **Claim Winnings**: Displays an alert banner when you have won a pot or have collateral/holdback ready to pull.

---

## 🛡️ 4. Profile & Soulbound Trust NFT (`/profile`)

1. Navigate to `/profile`.
2. **3D Tilt Holographic Card**: Move your mouse across the card to inspect the custom 3D sheen and physics-based tilt.
3. **On-Chain Record Breakdown**:
   - Total Circles Completed
   - On-Time Payments (+10 pts each)
   - Defaults (-50 pts each)
   - Reputation Tier: *Sadasya* ➔ *Pramukh* ➔ *Mahajan*
4. Inspect the on-chain SVG dynamically rendered from `tokenURI`.

---

## 🧪 5. Testing the Smart Contracts Directly

In `bhishi/contracts`:
```powershell
& "$HOME\.foundry\bin\forge.exe" test -vv
```
All 28 tests will execute in milliseconds verifying happy path, default slashing, holdback escrow, and soulbound restrictions.

---

## 📜 Live MST Testnet Deployment

- **Deployment Tx Hash:** [`0x2d45bc2108cf9bd318e282da8d89ece4f4d869e24d015b9a61a15bcf79679e58`](https://testnet.mstscan.com/tx/0x2d45bc2108cf9bd318e282da8d89ece4f4d869e24d015b9a61a15bcf79679e58)
- **CircleFactory Contract:** [`0xf8a27c259a8912f17468b0bb15de371a25d9caab`](https://testnet.mstscan.com/address/0xf8a27c259a8912f17468b0bb15de371a25d9caab)
- **TrustSBT Contract:** [`0x62756310a85a87ea9e8b3abfc10fc4dbccc5c35a`](https://testnet.mstscan.com/address/0x62756310a85a87ea9e8b3abfc10fc4dbccc5c35a)

