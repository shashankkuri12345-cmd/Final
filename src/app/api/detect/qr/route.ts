import { NextRequest, NextResponse } from 'next/server';
import { analyzeQrCode } from '@/lib/scamDetector';
import { checkCommunityBlacklist, recordQrScan } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { qrPayload } = body;
    if (!qrPayload || typeof qrPayload !== 'string') {
      return NextResponse.json({ error: 'Field "qrPayload" is required.' }, { status: 400 });
    }

    const matched = await checkCommunityBlacklist(qrPayload);
    const result = analyzeQrCode(qrPayload, matched.length);

    // Save scan telemetry to Supabase backend
    recordQrScan({
      raw_payload: qrPayload,
      payee_vpa: result.target,
      risk_outcome: result.qrOutcome || result.riskLevel,
      risk_score: result.riskScore,
      stage_a_ms: result.metrics?.stageA_ms,
      stage_b_ms: result.metrics?.stageB_ms,
      stage_c_ms: result.metrics?.stageC_ms,
      total_ms: result.metrics?.total_ms,
    }).catch(() => {});

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to inspect QR code.', details: String(err) }, { status: 500 });
  }
}
