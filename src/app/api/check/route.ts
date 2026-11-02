import { NextRequest, NextResponse } from 'next/server';
import { universalAnalyze, analyzeQrCode, analyzeRecipientTrust, analyzeMessage, analyzeUrl } from '@/lib/scamDetector';
import { checkCommunityBlacklist, queryFraudDataset } from '@/lib/supabase';
import { ScamCategory, RiskLevel } from '@/lib/types';

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
    const { target, category, simulateUnavailable } = (body || {}) as {
      target?: string;
      category?: string;
      simulateUnavailable?: boolean;
    };

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

    // 1. Core Dataset-based Fraud Identification (Task 2 & 3)
    const datasetResult = await queryFraudDataset(trimmed, Boolean(simulateUnavailable));

    // 2. Cross-check community reports from Supabase/local store
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

    // 3. Apply Dataset Verdict Overrides (Task 3 Detection Logic)
    result.datasetVerdict = datasetResult.verdict;
    result.isDemoData = datasetResult.isDemo;
    result.datasetRecord = datasetResult.record;

    if (datasetResult.verdict === 'REPORTED_FRAUD') {
      result.riskLevel = 'danger';
      result.riskScore = 98;
      result.summary = 'REPORTED FRAUD';
      result.verifiedStatus = 'known_malicious';
      result.explanation = datasetResult.isDemo
        ? `[DEMO DATA - SIMULATED TEST RECORD] Synthetic benchmark identifier from SCAN GUARD demo dataset (${datasetResult.record?.fraud_category}: ${datasetResult.record?.description}). For evaluation only; not a real-world individual.`
        : `Confirmed match in approved fraud intelligence database (${datasetResult.record?.fraud_category}: ${datasetResult.record?.description}).`;

      result.findings.unshift({
        title: datasetResult.isDemo ? 'DEMO DATA: Simulated Fraud Record' : 'REPORTED FRAUD: Database Match',
        description: datasetResult.record?.description || 'Exact match in approved fraud database.',
        severity: 'high',
        category: 'Fraud Database'
      });
      result.recommendedAction = 'DO NOT PROCEED with any transaction, OTP sharing, or callback to this identifier.';
    } else if (datasetResult.verdict === 'UNDER_REVIEW') {
      result.riskLevel = 'suspicious';
      result.riskScore = Math.max(result.riskScore, 75);
      result.summary = 'UNDER REVIEW';
      result.verifiedStatus = 'community_flagged';
      result.explanation = 'Identifier has active fraud reports currently under review by cybercrime analysts.';
      result.findings.unshift({
        title: 'UNDER REVIEW: Pending Community / Fraud Report',
        description: datasetResult.record?.description || 'Active report under moderator investigation.',
        severity: 'medium',
        category: 'Threat Review'
      });
      result.recommendedAction = 'Halt payment until verification is complete. Check with beneficiary through offline channels.';
    } else if (datasetResult.verdict === 'CHECK_UNAVAILABLE') {
      result.riskLevel = 'unknown';
      result.riskScore = 50;
      result.summary = 'CHECK UNAVAILABLE';
      result.explanation = 'Threat database is currently unreachable. Unable to verify identifier against fraud records.';
      result.findings.unshift({
        title: 'Database Check Unavailable',
        description: 'Unable to connect to Supabase fraud intelligence database at this time.',
        severity: 'medium',
        category: 'System State'
      });
      result.recommendedAction = 'Wait for database connectivity to resume before sending funds.';
    } else {
      // UNVERIFIED: No match in approved dataset or pending reports
      // Requirement: "Do not classify an unmatched identifier as safe."
      result.datasetVerdict = 'UNVERIFIED';
      if (result.riskLevel === 'safe') {
        result.riskLevel = 'unknown';
        result.summary = 'UNVERIFIED';
        result.explanation = 'No record found in the fraud dataset. Note: Lack of prior reports DOES NOT mean this recipient is safe. Always verify independently.';
      }
    }

    // Append matched community report snippet if present
    if (matchedReports.length > 0) {
      result.communityReportsCount = Math.max(result.communityReportsCount, matchedReports.length);
      if (result.datasetVerdict !== 'REPORTED_FRAUD') {
        result.verifiedStatus = hasModeratedReport ? 'known_malicious' : 'community_flagged';
        if (result.riskLevel === 'unknown' || (result.riskLevel as RiskLevel) === 'safe') {
          result.riskLevel = 'suspicious';
          result.riskScore = Math.max(result.riskScore, 65);
          result.summary = 'Community Scam Reports Matched';
          result.explanation = `This identifier matches ${matchedReports.length} user-submitted report(s) in the SCAM GUARD community radar.`;
        }
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
