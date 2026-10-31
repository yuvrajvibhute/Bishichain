
set -euo pipefail

# ── Load env ─────────────────────────────────────────────────────────────────
if [ ! -f .env ]; then
  echo "ERROR: .env file not found. Set PRIVATE_KEY in .env (MST_TESTNET_RPC_URL is optional)."
  exit 1
fi
source .env

# Validate required env vars
: "${MST_TESTNET_RPC_URL:=https://testnetrpc.mstblockchain.com}"
: "${PRIVATE_KEY:?Need to set PRIVATE_KEY}"

echo "=== Bhishi.mst Deployment ==="
echo "Network: MST Testnet"
echo ""

# ── Deploy ────────────────────────────────────────────────────────────────────
echo ">>> Deploying contracts..."
OUTPUT=$(forge script script/Deploy.s.sol \
  --rpc-url "$MST_TESTNET_RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --broadcast \
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
NEXT_PUBLIC_CHAIN_ID=91562037
NEXT_PUBLIC_CIRCLE_FACTORY=$FACTORY_ADDR
NEXT_PUBLIC_TRUST_SBT=$SBT_ADDR
NEXT_PUBLIC_EXPLORER_BASE=https://testnet.mstscan.com
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
echo "MSTScan:"
echo "  CircleFactory: https://testnet.mstscan.com/address/$FACTORY_ADDR"
echo "  TrustSBT:      https://testnet.mstscan.com/address/$SBT_ADDR"
