'use client';

import React, { useState } from 'react';
import { ScamCheckResult } from '@/lib/types';
import { ResultCard } from './ResultCard';
import {
  Link2,
  Globe,
  ShieldAlert,
  ArrowRight,
  X
} from 'lucide-react';

interface FraudLinkScreenProps {
  onReportClick: (target: string, category: string) => void;
  onOpenEmergency?: () => void;
}

export const FraudLinkScreen: React.FC<FraudLinkScreenProps> = ({
  onReportClick,
  onOpenEmergency,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ScamCheckResult | null>(null);

  const sampleLinks = [
    { label: 'SBI KYC Phishing (.top TLD)', url: 'https://sbi-pan-kyc.top/verify' },
    { label: 'Paytm KYC Harvest Domain', url: 'https://paytm-kyc-update.xyz/login' },
    { label: 'Blocked Cloud Metadata (SSRF Guard)', url: 'http://169.254.169.254/latest' },
    { label: 'Official Legitimate Bank Portal', url: 'https://onlinesbi.sbi' },
  ];

  const handleCheckUrl = async (e?: React.FormEvent, overrideUrl?: string) => {
    if (e) e.preventDefault();
    const trimmed = (overrideUrl !== undefined ? overrideUrl : urlInput).trim();
    if (!trimmed) {
      setErrorMsg('Please enter a website link to analyze.');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/detect/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to inspect link.');
      }
      setResult(data);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Inspection failed. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full px-4 pt-3 pb-24 space-y-4 max-w-lg mx-auto">
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-[#191C19] tracking-tight flex items-center gap-2">
          <Link2 className="w-5 h-5 text-[#1DB954]" />
          <span>Fraud Link & Phishing Detector</span>
        </h1>
        <p className="text-xs text-[#6B756D] leading-relaxed">
          Inspect suspicious URLs for brand typosquatting, credential harvesting, high-abuse TLDs, and server-side SSRF threats.
        </p>
      </div>

      {/* Safety Notice: Never Auto-Open */}
      <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-900">
        <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-red-700 block">
            Safe Isolation Guard: Zero Automatic Navigation
          </span>
          <span className="text-[11px] text-red-800 leading-relaxed block">
            SCAN GUARD analyzes URLs strictly in a sandboxed lexical and reputation environment. Links are <strong>never automatically opened</strong> in your browser to prevent drive-by malware.
          </span>
        </div>
      </div>

      {/* Input Card */}
      <div className="bg-white rounded-2xl border border-[#E5EAE5] p-4 shadow-xs space-y-3">
        <form onSubmit={(e) => handleCheckUrl(e)} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#191C19] flex justify-between">
              <span>Website URL</span>
              <span className="text-[10px] text-[#8E9990]">HTTP / HTTPS only</span>
            </label>

            <div className="flex items-center gap-2 px-3 py-2.5 bg-[#F7F9F7] rounded-xl border border-[#E5EAE5] focus-within:border-[#1DB954] focus-within:bg-white transition-all">
              <Globe className="w-4 h-4 text-[#8E9990] shrink-0" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="https://sbi-pan-kyc.top/login"
                className="w-full bg-transparent text-xs text-[#191C19] placeholder:text-[#8E9990] focus:outline-none font-mono"
              />
              {urlInput && (
                <button
                  type="button"
                  onClick={() => setUrlInput('')}
                  className="text-[#6B756D] hover:text-[#191C19] p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading || !urlInput.trim()}
                className="px-3 py-1.5 bg-[#1DB954] hover:bg-[#169C46] text-white text-xs font-semibold rounded-lg shrink-0 transition-all disabled:opacity-50"
              >
                {isLoading ? 'Scanning...' : 'Inspect'}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}
        </form>

        {/* Preset Evaluator Buttons */}
        <div className="space-y-1.5 pt-2 border-t border-[#E5EAE5]">
          <span className="text-[11px] font-bold text-[#191C19] block">
            Test Preset URLs (Judges&apos; Benchmarks):
          </span>
          <div className="grid grid-cols-1 gap-1.5">
            {sampleLinks.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setUrlInput(s.url);
                  setErrorMsg(null);
                  handleCheckUrl(undefined, s.url);
                }}
                className="p-2 bg-[#F7F9F7] hover:bg-white border border-[#E5EAE5] rounded-xl text-left flex items-center justify-between text-xs transition-all group"
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="font-mono text-[#191C19] group-hover:text-[#169C46] truncate">
                    {s.url}
                  </span>
                  <span className="text-[10px] text-[#6B756D] mt-0.5">
                    {s.label}
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#8E9990] group-hover:text-[#1DB954] shrink-0" />
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
