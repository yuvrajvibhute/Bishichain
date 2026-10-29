import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { factoryAddress, trustSbtAddress } = await req.json();

    if (!factoryAddress || !factoryAddress.startsWith('0x')) {
      return NextResponse.json({ error: 'Invalid factory address' }, { status: 400 });
    }

    const envPath = path.join(process.cwd(), '.env.local');
    const content = `NEXT_PUBLIC_CHAIN_ID=91562037
NEXT_PUBLIC_CIRCLE_FACTORY=${factoryAddress}
NEXT_PUBLIC_TRUST_SBT=${trustSbtAddress || ''}
NEXT_PUBLIC_ETHERSCAN_BASE=https://testnet.mstscan.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=b56e18d47c72ab683b10814fe9495694
`;

    fs.writeFileSync(envPath, content, 'utf8');

    return NextResponse.json({
      success: true,
      factoryAddress,
      trustSbtAddress,
      message: 'Contract addresses saved to .env.local',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
