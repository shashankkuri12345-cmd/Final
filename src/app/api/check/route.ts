import { NextRequest, NextResponse } from 'next/server';
import { universalAnalyze, analyzeQrCode, analyzeRecipientTrust, analyzeMessage, analyzeUrl } from '@/lib/scamDetector';
import { checkCommunityBlacklist } from '@/lib/supabase';
import { ScamCategory } from '@/lib/types';

export async function POST(req: NextRequest) {
  const t0 = performance.now();
  try {
    let body: Record<string, unknown> | null = null;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload received.' },
        { status: 400 }
      );
    }
    const { target, category } = (body || {}) as { target?: string; category?: string };

    if (!target || typeof target !== 'string' || target.trim().length === 0) {
      return NextResponse.json(
        { error: 'A valid target string is required for scam analysis.' },
        { status: 400 }
      );
    }

    if (target.length > 5000) {
      return NextResponse.json(
        { error: 'Input exceeds maximum supported character limit (5000 characters).' },
        { status: 400 }
      );
    }

    const trimmed = target.trim();
    const selectedCategory: ScamCategory | undefined =
      category === 'phone' ||
      category === 'email' ||
      category === 'url' ||
      category === 'message' ||
      category === 'upi'
        ? (category as ScamCategory)
        : undefined;

    // Cross-check community reports from Supabase/local store
    const matchedReports = await checkCommunityBlacklist(trimmed);
    const hasModeratedReport = matchedReports.some((r) => r.status === 'verified_scam');

    let result;
    if (selectedCategory === 'upi' && trimmed.startsWith('upi://')) {
      result = analyzeQrCode(trimmed, matchedReports.length, t0);
    } else if (selectedCategory === 'upi') {
      result = analyzeRecipientTrust(trimmed, matchedReports.length, hasModeratedReport);
    } else if (selectedCategory === 'url') {
      result = analyzeUrl(trimmed, t0);
      if (matchedReports.length > 0) {
        result.communityReportsCount = matchedReports.length;
        result.riskScore = Math.max(result.riskScore, 80);
        result.riskLevel = 'danger';
      }
    } else if (selectedCategory === 'message') {
      result = analyzeMessage(trimmed, t0);
      if (matchedReports.length > 0) {
        result.communityReportsCount = matchedReports.length;
        result.riskScore = Math.max(result.riskScore, 75);
      }
    } else {
      result = universalAnalyze(trimmed, selectedCategory, matchedReports.length);
    }

    // Append matched report snippet if present
    if (matchedReports.length > 0) {
      result.communityReportsCount = Math.max(result.communityReportsCount, matchedReports.length);
      result.verifiedStatus = hasModeratedReport ? 'known_malicious' : 'community_flagged';
      if (result.riskLevel === 'safe' || result.riskLevel === 'unknown') {
        result.riskLevel = 'suspicious';
        result.riskScore = Math.max(result.riskScore, 65);
        result.summary = 'Community Scam Reports Matched';
        result.explanation = `This identifier matches ${matchedReports.length} user-submitted report(s) in the SCAM GUARD community radar.`;
      }
      result.findings.unshift({
        title: `Matched ${matchedReports.length} Active Community Report(s)`,
        description: `Latest report: "${matchedReports[0].scamType}" - ${matchedReports[0].description}`,
        severity: 'high',
        category: 'Community Intelligence'
      });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('API /api/check error:', err);
    return NextResponse.json(
      { error: 'Internal server error while analyzing input. Please retry.' },
      { status: 500 }
    );
  }
}
