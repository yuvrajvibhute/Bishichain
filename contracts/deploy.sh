#!/usr/bin/env bash
# deploy.sh — Deploys Bhishi.eth to Sepolia, verifies on Etherscan,
#             and writes addresses to ../frontend/.env.local
#
# Usage:
#   1. cp .env.example .env
#   2. Fill in SEPOLIA_RPC_URL, PRIVATE_KEY, ETHERSCAN_API_KEY
#   3. chmod +x deploy.sh && ./deploy.sh

set -euo pipefail

# ── Load env ─────────────────────────────────────────────────────────────────
if [ ! -f .env ]; then
  echo "ERROR: .env file not found. Copy .env.example and fill in your keys."
  exit 1
fi
source .env

# Validate required env vars
: "${SEPOLIA_RPC_URL:?Need to set SEPOLIA_RPC_URL}"
: "${PRIVATE_KEY:?Need to set PRIVATE_KEY}"
: "${ETHERSCAN_API_KEY:?Need to set ETHERSCAN_API_KEY}"

echo "=== Bhishi.eth Deployment ==="
echo "Network: Sepolia"
echo ""

# ── Deploy ────────────────────────────────────────────────────────────────────
echo ">>> Deploying contracts..."
OUTPUT=$(forge script script/Deploy.s.sol \
  --rpc-url "$SEPOLIA_RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --broadcast \
  --verify \
  --etherscan-api-key "$ETHERSCAN_API_KEY" \
  -vvv 2>&1)

echo "$OUTPUT"

# ── Parse addresses from output ───────────────────────────────────────────────
FACTORY_ADDR=$(echo "$OUTPUT" | grep "CircleFactory:" | awk '{print $NF}')
SBT_ADDR=$(echo "$OUTPUT"     | grep "TrustSBT:"     | awk '{print $NF}')

if [ -z "$FACTORY_ADDR" ] || [ -z "$SBT_ADDR" ]; then
  echo "ERROR: Could not parse deployed addresses from forge output."
  exit 1
fi

echo ""
echo "✅ Deployed!"
echo "   CircleFactory: $FACTORY_ADDR"
echo "   TrustSBT:      $SBT_ADDR"
echo ""

# ── Write to frontend .env.local ──────────────────────────────────────────────
FRONTEND_ENV="../frontend/.env.local"
mkdir -p "$(dirname "$FRONTEND_ENV")"

cat > "$FRONTEND_ENV" <<EOF
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_CIRCLE_FACTORY=$FACTORY_ADDR
NEXT_PUBLIC_TRUST_SBT=$SBT_ADDR
NEXT_PUBLIC_ETHERSCAN_BASE=https://sepolia.etherscan.io
EOF

echo ">>> Wrote addresses to $FRONTEND_ENV"

# ── Export ABIs ───────────────────────────────────────────────────────────────
echo ">>> Exporting ABIs..."
ABI_DIR="../frontend/src/contracts"
mkdir -p "$ABI_DIR"

# Extract just the ABI from the build artifacts
node -e "
const fs = require('fs');
const contracts = ['CircleFactory', 'Circle', 'TrustSBT'];
contracts.forEach(name => {
  const artifact = JSON.parse(fs.readFileSync('out/' + name + '.sol/' + name + '.json', 'utf8'));
  fs.writeFileSync('$ABI_DIR/' + name + '.json', JSON.stringify({
    address: name === 'CircleFactory' ? '$FACTORY_ADDR' : name === 'TrustSBT' ? '$SBT_ADDR' : '',
    abi: artifact.abi
  }, null, 2));
  console.log('  Exported ' + name + '.json');
});
"

echo ""
echo "=== Deployment complete! ==="
echo "Sepolia Etherscan:"
echo "  CircleFactory: https://sepolia.etherscan.io/address/$FACTORY_ADDR"
echo "  TrustSBT:      https://sepolia.etherscan.io/address/$SBT_ADDR"
