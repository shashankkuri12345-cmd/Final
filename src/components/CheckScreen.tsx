'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ScamCategory, ScamCheckResult } from '@/lib/types';
import { ResultCard } from './ResultCard';
import {
  ShieldCheck,
  Search,
  Phone,
  Link2,
  Mail,
  MessageSquare,
  QrCode,
  X,
  Clipboard,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

interface CheckScreenProps {
  initialCategory?: ScamCategory;
  initialTarget?: string;
  onOpenReportModal: (target?: string, category?: ScamCategory) => void;
}

export const CheckScreen: React.FC<CheckScreenProps> = ({
  initialCategory,
  initialTarget,
  onOpenReportModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ScamCategory | 'auto'>(initialCategory || 'auto');
  const [targetInput, setTargetInput] = useState(initialTarget || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScamCheckResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const performCheck = useCallback(async (textToScan?: string, categoryToUse?: ScamCategory | 'auto') => {
    const val = (textToScan ?? targetInput).trim();
    if (!val) {
      setErrorMsg('Please enter an identifier, number, link, or message to check.');
      return;
    }

    const cat = categoryToUse || selectedCategory;

    // Client-side pre-validations
    if (cat === 'url') {
      if (!/^https?:\/\//i.test(val) && !val.includes('.')) {
        setErrorMsg('Please enter a valid website address with domain (e.g. https://example.com).');
        return;
      }
    } else if (cat === 'phone') {
      const isSyntheticTest = /^TEST-PHONE-\d+$/i.test(val);
      const digits = val.replace(/\D/g, '');
      if (!isSyntheticTest && digits.length < 8) {
        setErrorMsg('Phone numbers must contain at least 8 digits.');
        return;
      }
    } else if (cat === 'email') {
      if (!val.includes('@') || !val.includes('.')) {
        setErrorMsg('Please enter a valid email format (e.g. name@domain.com).');
        return;
      }
    }

    setErrorMsg('');
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: val,
          category: cat === 'auto' ? undefined : cat,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to inspect target. Please verify format.');
      } else {
        setResult(data);
      }
    } catch {
      setErrorMsg('Network error. Check your connection and retry.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, targetInput]);

  useEffect(() => {
    if (initialTarget) {
      const timer = setTimeout(() => {
        performCheck(initialTarget, initialCategory);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [initialTarget, initialCategory, performCheck]);

  const categories: { id: ScamCategory | 'auto'; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'auto', label: 'Auto-Detect', icon: Search },
    { id: 'phone', label: 'Phone', icon: Phone },
    { id: 'url', label: 'Link / URL', icon: Link2 },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'message', label: 'Message', icon: MessageSquare },
    { id: 'upi', label: 'UPI / QR', icon: QrCode },
  ];

  const categorySamples: Record<string, { label: string; value: string }> = {
    phone: { label: 'Extortion Robocall (+91 98234 11209)', value: '+91 98234 11209' },
    url: { label: 'Banking Phishing (sbi-pan-update.top)', value: 'https://sbi-pan-update.top' },
    email: { label: 'Fake Amazon HR (careers@amazon-hiring-india.xyz)', value: 'careers@amazon-hiring-india.xyz' },
    message: { label: 'Electricity Cutoff Notice (Urgent)', value: 'Electricity bill unpaid. Power cutoff at 9:30 PM. Download QuickSupport APK or call 9823411209.' },
    upi: { label: 'Reverse QR PIN Fraud (refund-desk@okhdfcbank)', value: 'refund-desk@okhdfcbank' },
  };

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setTargetInput(text);
          setErrorMsg('');
        }
      }
    } catch {
      // clipboard access denied or not supported in browser environment
    }
  };

  const getPlaceholder = () => {
    switch (selectedCategory) {
      case 'phone':
        return 'e.g. +91 98234 11209 or 09876543210';
      case 'url':
        return 'e.g. https://sbi-update.top or secure-login.xyz';
      case 'email':
        return 'e.g. support@netflix-billing.icu or alert@bank.com';
      case 'message':
        return 'Paste suspicious SMS, WhatsApp message, or text...';
      case 'upi':
        return 'e.g. refund-desk@okhdfcbank or upi://pay?pa=...';
      default:
        return 'Enter phone, email, website link, or UPI handle...';
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 pt-4 pb-24 space-y-4 animate-in fade-in duration-150">
      {/* Title & Guidance */}
      <div>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">
          Universal Scam Inspector
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Deterministic threat rule matching & crowdsourced fraud blacklist cross-check.
        </p>
      </div>

      {/* Category Selection Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((c) => {
          const isSelected = selectedCategory === c.id;
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCategory(c.id);
                setErrorMsg('');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* Checker Input Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="target-input-field" className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {selectedCategory === 'auto' ? 'Target Identifier' : `${selectedCategory.toUpperCase()} Input`}
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePaste}
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 active:scale-95 transition-all"
            >
              <Clipboard className="w-3 h-3" />
              <span>Paste</span>
            </button>
            {targetInput && (
              <button
                onClick={() => {
                  setTargetInput('');
                  setResult(null);
                  setErrorMsg('');
                }}
                className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-0.5 active:scale-95 transition-all"
              >
                <X className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {selectedCategory === 'message' ? (
          <div className="relative">
            <textarea
              id="target-input-field"
              rows={4}
              maxLength={3000}
              value={targetInput}
              onChange={(e) => {
                setTargetInput(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder={getPlaceholder()}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all resize-none"
            />
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
              <span>Supports up to 3,000 characters</span>
              <span>{targetInput.length} / 3000</span>
            </div>
          </div>
        ) : (
          <div className="relative">
            <input
              id="target-input-field"
              type="text"
              maxLength={1000}
              value={targetInput}
              onChange={(e) => {
                setTargetInput(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') performCheck();
              }}
              placeholder={getPlaceholder()}
              className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
            />
          </div>
        )}

        {/* Quick Sample Button if available for this category */}
        {selectedCategory !== 'auto' && categorySamples[selectedCategory] && (
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400">Sample:</span>
            <button
              onClick={() => {
                const sample = categorySamples[selectedCategory];
                setTargetInput(sample.value);
                performCheck(sample.value, selectedCategory);
              }}
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200 truncate max-w-xs active:scale-95 transition-all"
            >
              {categorySamples[selectedCategory].label}
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="font-medium leading-snug">{errorMsg}</span>
          </div>
        )}

        {/* Submit Scan Button */}
        <button
          onClick={() => performCheck()}
          disabled={loading || !targetInput.trim()}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing Threat Patterns...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4.5 h-4.5" />
              <span>Run Deep Scam Check</span>
            </>
          )}
        </button>
      </div>

      {/* Analysis Result Display */}
      {result && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <ResultCard
            result={result}
            onReport={(target, cat) => onOpenReportModal(target, cat as ScamCategory)}
            onClear={() => setResult(null)}
          />
        </div>
      )}

      {/* Safety Note & Rules Transparency */}
      <div className="p-3.5 rounded-xl bg-slate-100/70 border border-slate-200/80 text-xs text-slate-600 space-y-1">
        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
          Honest Analysis Transparency
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          SCAM GUARD applies strict heuristic pattern detection, RFC compliance checks, and cross-references active community radar reports. Clean results indicate no known warning signs, but always remain vigilant.
        </p>
      </div>
    </div>
  );
};
