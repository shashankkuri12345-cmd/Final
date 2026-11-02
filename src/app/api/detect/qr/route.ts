import { NextRequest, NextResponse } from 'next/server';
import { analyzeQrCode } from '@/lib/scamDetector';
import { checkCommunityBlacklist } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { qrPayload } = body;
    if (!qrPayload || typeof qrPayload !== 'string') {
      return NextResponse.json({ error: 'Field "qrPayload" is required.' }, { status: 400 });
    }

    const matched = await checkCommunityBlacklist(qrPayload);
    const result = analyzeQrCode(qrPayload, matched.length);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to inspect QR code.', details: String(err) }, { status: 500 });
  }
}
