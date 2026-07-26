import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { gatewayKey } = await req.json();

    const expectedKey = process.env.ADMIN_SECURITY_GATEWAY_KEY || 'CYBER_GATEWAY_2026';

    if (!gatewayKey || typeof gatewayKey !== 'string') {
      return NextResponse.json({ error: 'Security Access Key is required.' }, { status: 400 });
    }

    if (gatewayKey.trim() !== expectedKey.trim()) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED: Security Access Key rejected. Incident logged.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'ACCESS GRANTED: Security Gateway Unlocked.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
