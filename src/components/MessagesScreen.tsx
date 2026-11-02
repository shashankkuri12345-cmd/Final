'use client';

import React, { useState, useRef } from 'react';
import { ScamCheckResult } from '@/lib/types';
import { ResultCard } from './ResultCard';
import {
  MessageSquare,
  Upload,
  AlertTriangle,
  FileText,
  Sparkles,
  ArrowRight,
  Image as ImageIcon
} from 'lucide-react';

interface MessagesScreenProps {
  onReportClick: (target: string, category: string) => void;
  onOpenEmergency?: () => void;
}

export const MessagesScreen: React.FC<MessagesScreenProps> = ({
  onReportClick,
  onOpenEmergency,
}) => {
  const [inputMode, setInputMode] = useState<'text' | 'screenshot'>('text');
  const [messageText, setMessageText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ScamCheckResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const MAX_CHARS = 3000;

  const sampleMessages = [
    {
      title: '⚡ Electricity Bill Disconnection Extortion',
      text: 'Dear consumer, your electricity power will be disconnected tonight at 9:30 PM from the power station because your previous month bill was not updated. Please immediately contact our electricity officer at 9823411209. Thank you.',
      category: 'Public Utility',
    },
    {
      title: '🏦 SBI KYC & PAN Expiration Block',
      text: 'Dear SBI User, your NetBanking account will be blocked today due to expired KYC and missing PAN card linking. Please click here immediately to update your PAN and prevent suspension: http://sbi-pan-kyc.top/verify',
      category: 'Banking',
    },
    {
      title: '💼 Part-Time YouTube Reviewer Job',
      text: 'Hello! Amazon / YouTube global hiring team is recruiting part-time remote reviewers. Earn ₹3,000 to ₹8,000 daily by simply subscribing and liking 5 YouTube videos. No experience needed. Join Telegram: t.me/amazon_task_india',
      category: 'Job Scam',
    },
    {
      title: '🎓 Government Scholarship Sanctioned',
      text: 'National Merit Scholarship 2026: You have been selected for ₹75,000 education grant. To disburse funds directly to your bank account, deposit mandatory document registration fee of ₹1,499 to upi://pay?pa=scholarship-fund@okaxis.',
      category: 'Scholarship',
    },
    {
      title: '📦 FedEx Customs Parcel Extortion',
      text: 'FedEx Alert: Parcel #FDX-99214 consigned to you has been held by Mumbai Customs due to unpaid clearance duty of ₹1,499. Pay immediately via UPI or legal action will be initiated. Call Customs agent at 022-491288.',
      category: 'Impersonation',
    },
    {
      title: '💰 OLX Buyer Refund QR Scam',
      text: 'Sir, I have scanned the sofa on OLX. I am sending you a refund request of ₹12,000 to your Google Pay. Please open app and enter your 6-digit UPI PIN to claim the money instantly.',
      category: 'Refund Fraud',
    },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSelectedImage(base64);
      // Pre-fill text box with note indicating OCR image is attached
      if (!messageText) {
        setMessageText('[Screenshot attached for AI OCR & Fraud Analysis]');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRunAnalysis = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const textToScan = (overrideText !== undefined ? overrideText : messageText).trim();

    if (!textToScan && !selectedImage) {
      setErrorMsg('Please paste message text or upload a screenshot to analyze.');
      return;
    }

    if (textToScan.length > MAX_CHARS) {
      setErrorMsg(`Message exceeds character limit of ${MAX_CHARS} characters.`);
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/detect/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToScan,
          imageBase64: selectedImage || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze message.');
      }
      setResult(data);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Analysis error. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full px-4 pt-3 pb-24 space-y-4 max-w-lg mx-auto">
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-[#191C19] tracking-tight flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#1DB954]" />
          <span>Fake Message Detector</span>
        </h1>
        <p className="text-xs text-[#6B756D] leading-relaxed">
          Inspect SMS, WhatsApp, and Telegram messages using Gemini AI semantic reasoning and psychological extortion filters.
        </p>
      </div>

      {/* Input Mode Selector */}
      <div className="flex bg-[#F0F4F0] p-1 rounded-xl border border-[#E5EAE5]">
        <button
          onClick={() => setInputMode('text')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            inputMode === 'text'
              ? 'bg-white text-[#191C19] shadow-xs'
              : 'text-[#6B756D] hover:text-[#191C19]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Paste Text</span>
        </button>
        <button
          onClick={() => setInputMode('screenshot')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            inputMode === 'screenshot'
              ? 'bg-white text-[#191C19] shadow-xs'
              : 'text-[#6B756D] hover:text-[#191C19]'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Screenshot OCR</span>
        </button>
      </div>

      {/* Input Form Card */}
      <div className="bg-white rounded-2xl border border-[#E5EAE5] p-4 shadow-xs space-y-3">
        <form onSubmit={(e) => handleRunAnalysis(e)} className="space-y-3">
          {inputMode === 'screenshot' && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#1DB954]/40 hover:border-[#1DB954] bg-[#F7F9F7] rounded-xl p-4 text-center cursor-pointer transition-all space-y-2"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {selectedImage ? (
                <div className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedImage}
                    alt="Uploaded screenshot"
                    className="max-h-40 mx-auto rounded-lg object-contain border border-[#E5EAE5]"
                  />
                  <span className="text-[11px] text-[#169C46] font-bold block">
                    Screenshot ready for OCR extraction. Click to change.
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="w-10 h-10 rounded-full bg-[#EAF8EF] text-[#1DB954] flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-[#191C19] block">
                    Upload SMS or WhatsApp Screenshot
                  </span>
                  <span className="text-[10px] text-[#6B756D] block">
                    Gemini AI will extract text and scan for deception
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#191C19]">
              <span>Message Text</span>
              <span className="text-[10px] text-[#8E9990]">
                {messageText.length}/{MAX_CHARS}
              </span>
            </div>

            <textarea
              rows={4}
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Paste suspicious SMS, WhatsApp message, Telegram job offer, or electricity bill notice here..."
              className="w-full p-3 bg-[#F7F9F7] rounded-xl border border-[#E5EAE5] focus-within:border-[#1DB954] focus-within:bg-white text-xs text-[#191C19] placeholder:text-[#8E9990] focus:outline-none transition-all leading-relaxed resize-none"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || (!messageText.trim() && !selectedImage)}
            className="w-full py-2.5 bg-[#1DB954] hover:bg-[#169C46] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isLoading ? 'Analyzing with Gemini & Rules...' : 'Run Fraud Analysis'}</span>
          </button>
        </form>

        {/* Test Preset Scenarios */}
        <div className="space-y-1.5 pt-2 border-t border-[#E5EAE5]">
          <span className="text-[11px] font-bold text-[#191C19] block">
            Test Preset Fraud Scripts (Judges&apos; Benchmarks):
          </span>
          <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
            {sampleMessages.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setMessageText(s.text);
                  setSelectedImage(null);
                  setErrorMsg(null);
                  handleRunAnalysis(undefined, s.text);
                }}
                className="p-2 bg-[#F7F9F7] hover:bg-white border border-[#E5EAE5] rounded-xl text-left flex items-start justify-between text-xs transition-all group"
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#191C19] group-hover:text-[#169C46] truncate">
                      {s.title}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-700">
                      {s.category}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#6B756D] line-clamp-1 mt-0.5">
                    {s.text}
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#8E9990] group-hover:text-[#1DB954] shrink-0 self-center" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Result Card */}
      {result && (
        <ResultCard
          result={result}
          onClose={() => setResult(null)}
          onReportClick={(target, category) => onReportClick(target, category)}
          onOpenEmergency={onOpenEmergency}
        />
      )}
    </div>
  );
};
