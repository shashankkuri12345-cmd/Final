import { NextRequest, NextResponse } from 'next/server';
import { analyzeRecipientTrust } from '@/lib/scamDetector';
import { checkCommunityBlacklist } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recipient } = body;
    if (!recipient || typeof recipient !== 'string') {
      return NextResponse.json({ error: 'Field "recipient" is required.' }, { status: 400 });
    }

    const matched = await checkCommunityBlacklist(recipient);
    const hasModerated = matched.some((r) => r.status === 'verified_scam');
    const result = analyzeRecipientTrust(recipient, matched.length, hasModerated);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to verify recipient.', details: String(err) }, { status: 500 });
  }
}
