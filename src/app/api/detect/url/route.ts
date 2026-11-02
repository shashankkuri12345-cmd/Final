import { NextRequest, NextResponse } from 'next/server';
import { analyzeUrl } from '@/lib/scamDetector';
import { checkCommunityBlacklist, recordLinkScan } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Field "url" is required.' }, { status: 400 });
    }

    const matched = await checkCommunityBlacklist(url);
    const result = analyzeUrl(url);
    if (matched.length > 0) {
      result.communityReportsCount = matched.length;
      result.riskScore = Math.max(result.riskScore, 85);
      result.riskLevel = 'danger';
      result.verifiedStatus = 'community_flagged';
    }

    // Save scan to Supabase backend
    recordLinkScan({
      url: url.slice(0, 500),
      domain: result.target,
      risk_score: result.riskScore,
      is_brand_spoof: result.findings.some((f) => f.title.toLowerCase().includes('brand') || f.title.toLowerCase().includes('spoof')),
    }).catch(() => {});

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to inspect URL.', details: String(err) }, { status: 500 });
  }
}

