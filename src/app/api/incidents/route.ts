import { NextRequest, NextResponse } from 'next/server';
import {
  fetchFraudIncidents,
  createFraudIncident,
  updateIncidentStatus,
  toggleIncidentActionItem,
} from '@/lib/supabase';
import { IncidentCategory, IncidentStatus } from '@/lib/types';

export async function GET() {
  try {
    const incidents = await fetchFraudIncidents();
    return NextResponse.json({ incidents, count: incidents.length });
  } catch (err) {
    console.error('API /api/incidents GET error:', err);
    return NextResponse.json({ error: 'Failed to retrieve fraud incidents.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      category,
      incidentDate,
      amount,
      paymentMethod,
      transactionId,
      suspectIdentifier,
      description,
      evidenceNotes,
    } = body;

    if (!category || !incidentDate || !paymentMethod || !description) {
      return NextResponse.json(
        { error: 'Missing required incident fields: category, incidentDate, paymentMethod, description.' },
        { status: 400 }
      );
    }

    const numAmount = Number(amount) || 0;
    if (numAmount < 0) {
      return NextResponse.json({ error: 'Amount cannot be negative.' }, { status: 400 });
    }

    const res = await createFraudIncident({
      category: category as IncidentCategory,
      incidentDate: String(incidentDate),
      amount: numAmount,
      paymentMethod: String(paymentMethod),
      transactionId: transactionId ? String(transactionId).trim() : undefined,
      suspectIdentifier: suspectIdentifier ? String(suspectIdentifier).trim() : undefined,
      description: String(description).trim(),
      evidenceNotes: evidenceNotes ? String(evidenceNotes).trim() : undefined,
      status: 'ready_to_report',
    });

    return NextResponse.json(res, { status: 201 });
  } catch (err) {
    console.error('API /api/incidents POST error:', err);
    return NextResponse.json({ error: 'Failed to record fraud incident.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { incidentId, actionType, status, acknowledgementNumber, bankComplaintId, actionId, notes } = body;

    if (!incidentId || typeof incidentId !== 'string') {
      return NextResponse.json({ error: 'Valid incidentId is required.' }, { status: 400 });
    }

    if (actionType === 'toggle_action') {
      if (!actionId) {
        return NextResponse.json({ error: 'actionId is required to toggle action.' }, { status: 400 });
      }
      const updated = await toggleIncidentActionItem(incidentId, actionId, notes);
      return NextResponse.json({ success: true, incident: updated });
    }

    if (status) {
      const updated = await updateIncidentStatus(
        incidentId,
        status as IncidentStatus,
        acknowledgementNumber,
        bankComplaintId
      );
      return NextResponse.json({ success: true, incident: updated });
    }

    return NextResponse.json({ error: 'No valid update operation provided.' }, { status: 400 });
  } catch (err) {
    console.error('API /api/incidents PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update fraud incident.' }, { status: 500 });
  }
}
