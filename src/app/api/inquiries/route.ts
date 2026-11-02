import { NextRequest, NextResponse } from 'next/server';
import { submitInquiry } from '@/lib/supabase';
import { InquiryRecord } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, subject, message, inquiry_type } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required.' }, { status: 400 });
    }

    const inquiry: InquiryRecord = {
      name: name?.trim() || 'Anonymous Citizen',
      email: email?.trim(),
      phone: phone?.trim(),
      subject: subject?.trim() || 'Website Inquiry',
      message: message.trim(),
      inquiry_type: inquiry_type || 'general',
    };

    const result = await submitInquiry(inquiry);
    return NextResponse.json({
      success: true,
      id: result.id,
      message: 'Your inquiry has been safely recorded in our Supabase backend. Our team will review it shortly.',
    });
  } catch (err) {
    console.error('API /api/inquiries error:', err);
    return NextResponse.json(
      { error: 'Failed to submit inquiry to backend.', details: String(err) },
      { status: 500 }
    );
  }
}
