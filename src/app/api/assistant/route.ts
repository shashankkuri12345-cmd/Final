import { NextRequest, NextResponse } from 'next/server';

interface AssistantContext {
  query: string;
  hasLostMoney?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AssistantContext;
    const { query } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query string is required.' }, { status: 400 });
    }

    const q = query.toLowerCase();
    const hasLostMoney =
      q.includes('lost money') ||
      q.includes('scammed') ||
      q.includes('debited') ||
      q.includes('fraud occurred') ||
      q.includes('money gone') ||
      q.includes('transfer happened') ||
      q.includes('1930') ||
      q.includes('deducted');

    const geminiApiKey = process.env.GEMINI_API_KEY;

    // High priority instant safety actions
    let reply = '';
    let actionGuide: string[] = [];
    let isUrgentPostFraud = false;

    if (hasLostMoney) {
      isUrgentPostFraud = true;
      reply = `EMERGENCY POST-FRAUD ADVISORY: If money was unauthorizedly debited from your account, act immediately within the "Golden Window" (first 2 to 3 hours). SCAM GUARD cannot directly reverse bank transactions or freeze accounts, but follow these mandatory legal steps right now:

1. DIAL 1930 IMMEDIATELY: Call the National Cybercrime Reporting Portal helpline (1930) from your phone. Provide your transaction UTR number, bank name, and the suspect's UPI ID/phone.
2. FILE ONLINE AT CYBERCRIME.GOV.IN: Register an official complaint on the National Cybercrime Portal and note down the Acknowledgement Number.
3. CALL YOUR ISSUING BANK FRAUD HELPLINE: Request an immediate freeze on the recipient mule account and log a formal chargeback dispute.
4. PRESERVE ALL EVIDENCE: Export your bank statement showing the UTR, screenshot the chat/SMS history, and do not delete any messages.`;

      actionGuide = [
        'Call 1930 immediately (National Cybercrime Reporting Helpline)',
        'Visit https://cybercrime.gov.in to submit a formal financial fraud complaint',
        'Call your bank fraud department to log a chargeback reference ID',
        'Open SCAN GUARD "Emergency Fraud Assistance" to generate an official complaint summary',
      ];
    } else if (geminiApiKey) {
      try {
        const systemPrompt = `You are the SCAM GUARD Fraud Safety Assistant, an expert AI cybersecurity advisor specializing in digital financial fraud prevention in India (UPI, RBI guidelines, NetBanking, Phishing).
Rules:
- Never provide false guarantees about payment recovery.
- Always emphasize: Entering UPI PIN SENDS money, you never enter PIN to receive money or cashbacks.
- If the user lost money, tell them to call 1930 and file on cybercrime.gov.in.
- Keep responses concise, actionable, and structured with bullet points.`;

        const aiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: systemPrompt },
                    { text: `User query: "${query}"` },
                  ],
                },
              ],
            }),
          }
        );

        if (aiRes.ok) {
          const data = await aiRes.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            reply = text;
            actionGuide = [
              'Never share OTPs, CVVs, or NetBanking passwords with anyone',
              'Verify caller credentials through official verified corporate websites',
              'Check suspicious numbers, URLs, and UPI IDs inside SCAM GUARD detectors',
            ];
          }
        }
      } catch (e) {
        console.warn('Gemini Assistant call failed, using deterministic knowledge engine', e);
      }
    }

    // Fallback expert knowledge engine if Gemini not configured or replied empty
    if (!reply) {
      if (q.includes('pin') || q.includes('olx') || q.includes('receive money') || q.includes('cashback')) {
        reply = 'CRITICAL WARNING: This is a classic Reverse UPI Collect Scam. You NEVER need to enter your UPI PIN to receive money, prizes, or cashbacks. Entering your PIN authorizes a DEBIT from your bank account.';
        actionGuide = [
          'Decline or cancel the request immediately inside your UPI app',
          'Block the buyer/seller on OLX and WhatsApp',
          'Do not scan any QR code sent to "receive funds"',
        ];
      } else if (q.includes('missed call') || q.includes('answer') || q.includes('hack my phone')) {
        reply = 'Answering a standard voice call or receiving a missed call CANNOT hack your phone or drain your bank balance. However, scammers use cold calls to socially engineer you into sharing OTPs, installing remote-access trojans (AnyDesk, QuickSupport), or calling expensive international premium numbers (+92, +234).';
        actionGuide = [
          'Never call back unknown international numbers with strange country codes',
          'Never install APK files or remote assistance apps requested by callers',
          'Never dictate an SMS verification code (OTP) over the phone',
        ];
      } else if (q.includes('complaint') || q.includes('summary') || q.includes('police')) {
        reply = 'To file an effective cybercrime complaint, prepare a structured complaint summary containing: (1) Exact incident date and timestamp, (2) Debit transaction UTR/RRN number, (3) Fraudster UPI ID or telephone number, (4) Loss amount in Rupees, and (5) Step-by-step narrative of deception. You can generate this automatically in SCAM GUARD Emergency Assistance!';
        actionGuide = [
          'Open "Emergency Fraud Assistance" in the top navigation bar',
          'Fill in the 2-minute incident details form',
          'Click "Copy Complaint Summary" for instant paste into cybercrime.gov.in',
        ];
      } else {
        reply = `SCAM GUARD Security Analysis for: "${query}". For complete online payment safety, verify all recipients before paying. Official banks and government utilities never demand immediate payment via personal UPI handles or third-party APK installations.`;
        actionGuide = [
          'Never enter your UPI PIN unless you intend to SEND money',
          'Verify phone numbers and links in SCAM GUARD modules before interacting',
          'In case of unauthorized debit, dial 1930 immediately',
        ];
      }
    }

    return NextResponse.json({
      reply,
      actionGuide,
      isUrgentPostFraud,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('API /api/assistant error:', err);
    return NextResponse.json({ error: 'Failed to process assistant query.' }, { status: 500 });
  }
}
