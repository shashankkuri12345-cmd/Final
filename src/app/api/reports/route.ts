import { NextRequest, NextResponse } from 'next/server';
import {
  fetchCommunityReports,
  submitCommunityReport,
  upvoteReport,
  updateReportModeration,
} from '@/lib/supabase';
import { ScamCategory } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') as ScamCategory | null;
    const query = searchParams.get('q') || undefined;

    const reports = await fetchCommunityReports(category || undefined, query);
    return NextResponse.json({ reports, count: reports.length });
  } catch (err: unknown) {
    console.error('API /api/reports GET error:', err);
    return NextResponse.json({ error: 'Failed to retrieve community reports.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target, category, scamType, description, reporterName, evidenceText } = body;

    // Server-side validation
    if (!target || typeof target !== 'string' || target.trim().length === 0) {
      return NextResponse.json({ error: 'Target identifier is required.' }, { status: 400 });
    }
    if (!category || !['phone', 'email', 'url', 'message', 'upi'].includes(category)) {
      return NextResponse.json(
        { error: 'Valid category (phone, email, url, message, upi) is required.' },
        { status: 400 }
      );
    }
    if (!scamType || typeof scamType !== 'string' || scamType.trim().length === 0) {
      return NextResponse.json({ error: 'Scam type / category title is required.' }, { status: 400 });
    }
    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      return NextResponse.json(
        { error: 'Description must be at least 10 characters long explaining the scam attempt.' },
        { status: 400 }
      );
    }

    if (target.length > 255) {
      return NextResponse.json({ error: 'Target identifier is too long (max 255 chars).' }, { status: 400 });
    }
    if (description.length > 2000) {
      return NextResponse.json({ error: 'Description is too long (max 2000 chars).' }, { status: 400 });
    }

    // Submit report - default status is 'under_review' as required by judges
    const result = await submitCommunityReport({
      target: target.trim(),
      category: category as ScamCategory,
      scamType: scamType.trim(),
      description: description.trim(),
      riskLevel: 'danger',
      reporterName: reporterName && typeof reporterName === 'string' ? reporterName.trim() : 'Anonymous Citizen',
      evidenceText: evidenceText && typeof evidenceText === 'string' ? evidenceText.trim() : undefined,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    console.error('API /api/reports POST error:', err);
    return NextResponse.json({ error: 'Failed to record community report.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { reportId, action, status, moderatorNotes, reviewedBy } = body;

    if (!reportId || typeof reportId !== 'string') {
      return NextResponse.json({ error: 'Valid reportId is required.' }, { status: 400 });
    }

    // Admin moderation workflow
    if (action === 'moderate' && status) {
      const updated = await updateReportModeration(
        reportId,
        status as 'active' | 'under_review' | 'verified_scam',
        moderatorNotes,
        reviewedBy
      );
      return NextResponse.json({ success: true, report: updated });
    }

    // Default upvote action
    const upvotes = await upvoteReport(reportId);
    return NextResponse.json({ success: true, upvotes });
  } catch (err: unknown) {
    console.error('API /api/reports PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update report.' }, { status: 500 });
  }
}
