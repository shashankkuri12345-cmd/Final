import { NextRequest, NextResponse } from 'next/server';
import { analyzeRecipientTrust } from '@/lib/scamDetector';
import { checkCommunityBlacklist, queryFraudDataset } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recipient, simulateUnavailable } = body;
    if (!recipient || typeof recipient !== 'string') {
      return NextResponse.json({ error: 'Field "recipient" is required.' }, { status: 400 });
    }

    const trimmed = recipient.trim();
    const datasetResult = await queryFraudDataset(trimmed, Boolean(simulateUnavailable));
    const matched = await checkCommunityBlacklist(trimmed);
    const hasModerated = matched.some((r) => r.status === 'verified_scam');
    const result = analyzeRecipientTrust(trimmed, matched.length, hasModerated);

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
        : `Confirmed match in approved fraud database (${datasetResult.record?.fraud_category}: ${datasetResult.record?.description}).`;
      result.findings.unshift({
        title: datasetResult.isDemo ? 'DEMO DATA: Simulated Fraud Record' : 'REPORTED FRAUD: Database Match',
        description: datasetResult.record?.description || 'Exact match in approved fraud database.',
        severity: 'high',
        category: 'Fraud Database'
      });
    } else if (datasetResult.verdict === 'UNDER_REVIEW') {
      result.riskLevel = 'suspicious';
      result.riskScore = Math.max(result.riskScore, 75);
      result.summary = 'UNDER REVIEW';
      result.verifiedStatus = 'community_flagged';
      result.findings.unshift({
        title: 'UNDER REVIEW: Pending Community / Fraud Report',
        description: datasetResult.record?.description || 'Active report under moderator investigation.',
        severity: 'medium',
        category: 'Threat Review'
      });
    } else if (datasetResult.verdict === 'CHECK_UNAVAILABLE') {
      result.riskLevel = 'unknown';
      result.riskScore = 50;
      result.summary = 'CHECK UNAVAILABLE';
      result.explanation = 'Threat database is currently unreachable. Unable to verify identifier against fraud records.';
    } else {
      result.datasetVerdict = 'UNVERIFIED';
      if (result.riskLevel === 'safe') {
        result.riskLevel = 'unknown';
        result.summary = 'UNVERIFIED';
        result.explanation = 'No record found in the fraud dataset. Note: Lack of prior reports DOES NOT mean this recipient is safe. Always verify independently.';
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to verify recipient.', details: String(err) }, { status: 500 });
  }
}

