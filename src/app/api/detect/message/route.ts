import { NextRequest, NextResponse } from 'next/server';
import { analyzeMessage } from '@/lib/scamDetector';
import { checkCommunityBlacklist } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, imageBase64 } = body;

    let textToAnalyze = (message || '').trim();

    // If an image screenshot was uploaded and Gemini API key exists, we can extract text via Gemini multimodal or fallback
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (imageBase64 && geminiApiKey) {
      try {
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        const aiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: 'You are an OCR and financial fraud analyzer. Extract all text from this screenshot. If it contains an SMS, WhatsApp message, or payment request, output the extracted text verbatim, followed by a newline and summary of scam markers.'
                    },
                    {
                      inlineData: {
                        mimeType: 'image/jpeg',
                        data: cleanBase64
                      }
                    }
                  ]
                }
              ]
            })
          }
        );

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const generatedText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedText) {
            textToAnalyze = generatedText;
          }
        }
      } catch (ocrErr) {
        console.warn('Gemini multimodal OCR attempt failed, proceeding with text:', ocrErr);
      }
    }

    if (!textToAnalyze) {
      return NextResponse.json({ error: 'Please provide message text or a screenshot.' }, { status: 400 });
    }

    const matched = await checkCommunityBlacklist(textToAnalyze);
    const result = analyzeMessage(textToAnalyze);

    if (matched.length > 0) {
      result.communityReportsCount = matched.length;
      result.riskScore = Math.max(result.riskScore, 85);
      result.riskLevel = 'danger';
      result.verifiedStatus = 'community_flagged';
    }

    // Optional Gemini semantic reasoning augmentation
    if (geminiApiKey && textToAnalyze.length > 10) {
      try {
        const aiPrompt = `Analyze this message for digital financial fraud in India (UPI, Bank KYC, Electricity, Job, Courier):
"${textToAnalyze.slice(0, 1000)}"

Return a strictly valid JSON object with keys:
"scamCategory": string,
"isScam": boolean,
"riskScore": number between 0 and 100,
"suspiciousPhrases": array of string phrases,
"explanation": string explaining why it is or is not fraudulent,
"recommendedAction": string giving concrete user instructions.`;

        const aiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: aiPrompt }] }]
            })
          }
        );

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const rawReply = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawReply) {
            const jsonMatch = rawReply.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed.riskScore !== undefined) {
                result.riskScore = Math.max(result.riskScore, parsed.riskScore);
                if (result.riskScore >= 60) result.riskLevel = 'danger';
                else if (result.riskScore >= 35) result.riskLevel = 'suspicious';
              }
              if (parsed.explanation) {
                result.explanation = parsed.explanation;
              }
              if (parsed.recommendedAction) {
                result.recommendedAction = parsed.recommendedAction;
              }
              if (Array.isArray(parsed.suspiciousPhrases) && parsed.suspiciousPhrases.length > 0) {
                result.findings.push({
                  title: 'Gemini AI Semantic Analysis',
                  description: `Suspicious phrases flagged: ${parsed.suspiciousPhrases.join(', ')}`,
                  severity: 'high',
                  category: 'GenAI Intelligence'
                });
              }
            }
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini semantic analysis fallback to rule engine:', geminiErr);
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to inspect message.', details: String(err) }, { status: 500 });
  }
}
