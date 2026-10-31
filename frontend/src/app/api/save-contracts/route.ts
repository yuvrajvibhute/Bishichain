import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { factoryAddress, trustSbtAddress, chainId } = await req.json();

    if (!/^0x[a-fA-F0-9]{40}$/.test(factoryAddress || '')) {
      return NextResponse.json({ error: 'Invalid factory address' }, { status: 400 });
    }

    if (trustSbtAddress && !/^0x[a-fA-F0-9]{40}$/.test(trustSbtAddress)) {
      return NextResponse.json({ error: 'Invalid TrustSBT address' }, { status: 400 });
    }

    const network = chainId === 4646 ? 'MST_MAINNET' : chainId === 91562037 ? 'MST_TESTNET' : null;
    if (!network) {
      return NextResponse.json({ error: 'Unsupported chain ID' }, { status: 400 });
    }

    const envPath = path.join(process.cwd(), '.env.local');
    const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    const updates: Record<string, string> = {
      [`NEXT_PUBLIC_${network}_CIRCLE_FACTORY`]: factoryAddress,
      [`NEXT_PUBLIC_${network}_TRUST_SBT`]: trustSbtAddress || '',
    };
    const lines = existing.split(/\r?\n/);
    const updatedKeys = new Set<string>();
    const content = lines.map((line) => {
      const key = line.slice(0, line.indexOf('='));
      if (Object.hasOwn(updates, key)) {
        updatedKeys.add(key);
        return `${key}=${updates[key]}`;
      }
      return line;
    });

    for (const [key, value] of Object.entries(updates)) {
      if (!updatedKeys.has(key)) content.push(`${key}=${value}`);
    }

    fs.writeFileSync(envPath, content.join('\n'), 'utf8');

    return NextResponse.json({
      success: true,
      factoryAddress,
      trustSbtAddress,
      chainId,
      message: 'Network-specific contract addresses saved to .env.local',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save contract addresses';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
