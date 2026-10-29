# deploy.ps1 — Windows PowerShell script to deploy Bhishi to MST Testnet

param(
    [string]$RpcUrl = $env:MST_TESTNET_RPC_URL,
    [string]$PrivateKey = $env:PRIVATE_KEY,
    [string]$EtherscanApiKey = $env:ETHERSCAN_API_KEY
)

if (-not $RpcUrl) {
    $RpcUrl = "https://testnetrpc.mstblockchain.com"
}

$forgePath = "$HOME\.foundry\bin\forge.exe"
if (-not (Test-Path $forgePath)) {
    $forgePath = "forge"
}

# Check .env if params empty
if ((-not $PrivateKey) -and (Test-Path ".env")) {
    Get-Content .env | ForEach-Object {
        if ($_ -match "^\s*([^#=]+)=(.*)$") {
            $key = $matches[1].Trim()
            $val = $matches[2].Trim()
            if ($key -eq "MST_TESTNET_RPC_URL" -and -not $RpcUrl) { $RpcUrl = $val }
            if ($key -eq "SEPOLIA_RPC_URL" -and -not $RpcUrl) { $RpcUrl = $val }
            if ($key -eq "PRIVATE_KEY" -and -not $PrivateKey) { $PrivateKey = $val }
            if ($key -eq "ETHERSCAN_API_KEY" -and -not $EtherscanApiKey) { $EtherscanApiKey = $val }
        }
    }
}

if (-not $PrivateKey) {
    Write-Host "Usage: .\deploy.ps1 -PrivateKey <PRIVATE_KEY> [-RpcUrl <MST_TESTNET_RPC_URL>]" -ForegroundColor Yellow
    Write-Host "Or create a contracts\.env file with PRIVATE_KEY." -ForegroundColor Yellow
    exit 1
}

Write-Host "=== Deploying Bhishi to MST Testnet ($RpcUrl) ===" -ForegroundColor Cyan

$verifyArgs = @()
if ($EtherscanApiKey) {
    $verifyArgs = @("--verify", "--etherscan-api-key", $EtherscanApiKey)
}

$deployOutput = & $forgePath script script/Deploy.s.sol `
    --rpc-url $RpcUrl `
    --private-key $PrivateKey `
    --broadcast `
    @verifyArgs `
    -vvv

$deployOutput | Out-Host

# Extract addresses
$factoryAddr = ""
$sbtAddr = ""

foreach ($line in ($deployOutput -split "`n")) {
    if ($line -match "CircleFactory:\s+(0x[a-fA-F0-9]{40})") {
        $factoryAddr = $matches[1]
    }
    if ($line -match "TrustSBT:\s+(0x[a-fA-F0-9]{40})") {
        $sbtAddr = $matches[1]
    }
}

if ($factoryAddr -and $sbtAddr) {
    Write-Host "`n Deployment Successful!" -ForegroundColor Green
    Write-Host "CircleFactory: $factoryAddr" -ForegroundColor Yellow
    Write-Host "TrustSBT:      $sbtAddr" -ForegroundColor Yellow

    # Write to frontend .env.local
    $frontendEnv = "../frontend/.env.local"
    $envContent = @"
NEXT_PUBLIC_CHAIN_ID=91562037
NEXT_PUBLIC_CIRCLE_FACTORY=$factoryAddr
NEXT_PUBLIC_TRUST_SBT=$sbtAddr
NEXT_PUBLIC_ETHERSCAN_BASE=https://testnet.mstscan.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=b56e18d47c72ab683b10814fe9495694
"@
    Set-Content -Path $frontendEnv -Value $envContent
    Write-Host "Saved addresses to $frontendEnv" -ForegroundColor Green
} else {
    Write-Host "Could not auto-parse deployed addresses. Please check log above." -ForegroundColor Red
}
