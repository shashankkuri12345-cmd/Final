'use client';

import React, { useState } from 'react';
import { ScamCategory, CommunityReport } from '@/lib/types';
import {
  X,
  Flag,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportAdded: (report: CommunityReport) => void;
  prefillTarget?: string;
  prefillCategory?: ScamCategory;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onReportAdded,
  prefillTarget = '',
  prefillCategory = 'phone',
}) => {
  const [target, setTarget] = useState(prefillTarget);
  const [category, setCategory] = useState<ScamCategory>(prefillCategory);
  const [scamType, setScamType] = useState('Electricity Bill Extortion');
  const [customScamType, setCustomScamType] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceText, setEvidenceText] = useState('');
  const [reporterAlias, setReporterAlias] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successReport, setSuccessReport] = useState<CommunityReport | null>(null);

  // Sync prefill on modal open via key or render check
  const [lastOpened, setLastOpened] = useState(false);
  if (isOpen && !lastOpened) {
    setLastOpened(true);
    if (prefillTarget && !target) setTarget(prefillTarget);
    if (prefillCategory && category !== prefillCategory) setCategory(prefillCategory);
  } else if (!isOpen && lastOpened) {
    setLastOpened(false);
  }

  if (!isOpen) return null;

  const scamTypePresets: Record<ScamCategory, string[]> = {
    phone: [
      'Electricity Bill Cutoff Robocall',
      'FedEx / Customs Narcotics Threat',
      'Digital Arrest / Fake Police Notice',
      'Bank KYC / OTP Impersonation',
      'Lottery / KBC Prize Call',
      'Credit Card Limit Increase Trap',
      'Other Fraudulent Call',
    ],
    url: [
      'Banking Phishing (SBI / HDFC / ICICI)',
      'Government Portal Spoof (PAN / EPFO)',
      'Fake E-Commerce / Deep Discount Portal',
      'APK Download Malware Link',
      'Lottery / Spin the Wheel Trap',
      'Other Malicious Website',
    ],
    upi: [
      'Reverse QR PIN Scan Scam',
      'OLX / Marketplace Advance Payment',
      'Fake Customer Care Refund VPA',
      'Lottery Processing Fee Request',
      'Other UPI / Payment Scam',
    ],
    message: [
      'Electricity Power Cutoff Threat',
      'Part-Time Job / Telegram YouTube Task',
      'Bank Account Blocked / PAN Mandatory',
      'Package Delivery Failed / Pay Fee',
      'Work From Home High Daily Earnings',
      'Other Suspicious SMS / WhatsApp',
    ],
    email: [
      'Fake Job Offer Letter with Registration Fee',
      'Account Suspended / Security Re-verification',
      'Invoice / Payment Receipt with Malware',
      'Lottery / Inheritance Extortion',
      'Other Phishing Email',
    ],
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTarget = target.trim();
    const finalScamType = scamType === 'Other' || scamType.startsWith('Other ') ? (customScamType.trim() || 'Unspecified Scam Type') : scamType;
    const cleanDesc = description.trim();

    // Validation
    if (!cleanTarget) {
      setErrorMsg('Target phone, link, or identifier is required.');
      return;
    }
    if (cleanTarget.length > 255) {
      setErrorMsg('Identifier is too long (maximum 255 characters).');
      return;
    }
    if (cleanDesc.length < 10) {
      setErrorMsg('Please provide at least 10 characters explaining what the scammer attempted.');
      return;
    }
    if (cleanDesc.length > 2000) {
      setErrorMsg('Description cannot exceed 2,000 characters.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: cleanTarget,
          category,
          scamType: finalScamType,
          description: cleanDesc,
          evidenceText: evidenceText.trim() || undefined,
          reporterName: reporterAlias.trim() || 'Citizen Report',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to submit report. Please check input.');
      } else if (data.data) {
        setSuccessReport(data.data);
        onReportAdded(data.data);
      }
    } catch {
      setErrorMsg('Network error. Failed to reach reporting database.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setSuccessReport(null);
    setTarget('');
    setDescription('');
    setCustomScamType('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
              <Flag className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-none">
                Submit Community Scam Report
              </h2>
              <span className="text-[11px] text-slate-500">
                Threat Radar Crowd-Shield
              </span>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {successReport ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Report Confirmed & Recorded!
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Thank you for contributing to the public threat radar. Your report is now actively indexed to protect fellow citizens from this scammer.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-700 max-w-xs mx-auto">
                Target: {successReport.target}
              </div>
              <button
                onClick={handleResetAndClose}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-black text-white font-semibold rounded-xl text-xs transition-all"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Picker */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Scam Channel / Category
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['phone', 'url', 'upi', 'message', 'email'] as ScamCategory[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setCategory(cat);
                        setScamType(scamTypePresets[cat][0]);
                      }}
                      className={`py-2 px-1 rounded-xl text-[11px] font-bold uppercase transition-all flex flex-col items-center justify-center gap-1 border ${
                        category === cat
                          ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Input */}
              <div>
                <label htmlFor="report-target" className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Target Identifier <span className="text-red-500">*</span>
                </label>
                <input
                  id="report-target"
                  type="text"
                  required
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder={
                    category === 'phone'
                      ? 'e.g. +91 98234 11209'
                      : category === 'url'
                      ? 'e.g. sbi-pan-update.top'
                      : category === 'upi'
                      ? 'e.g. refund-desk@okhdfcbank'
                      : 'e.g. Sender number or header'
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 font-mono"
                />
              </div>

              {/* Scam Type Preset Selector */}
              <div>
                <label htmlFor="scam-type-select" className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Scam Modus Operandi
                </label>
                <select
                  id="scam-type-select"
                  value={scamType}
                  onChange={(e) => setScamType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                >
                  {scamTypePresets[category].map((preset, idx) => (
                    <option key={idx} value={preset}>
                      {preset}
                    </option>
                  ))}
                </select>

                {(scamType === 'Other' || scamType.startsWith('Other ')) && (
                  <input
                    type="text"
                    value={customScamType}
                    onChange={(e) => setCustomScamType(e.target.value)}
                    placeholder="Describe scam type (e.g. Fake Hotel Booking)"
                    className="w-full mt-2 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                  />
                )}
              </div>

              {/* Description Textarea */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="report-desc" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Incident Description <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {description.length} / 2000
                  </span>
                </div>
                <textarea
                  id="report-desc"
                  required
                  rows={3}
                  maxLength={2000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain what the scammer claimed, what APK they demanded, or what link was sent..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 resize-none leading-relaxed"
                />
                <span className="text-[10px] text-slate-400">Min 10 characters required</span>
              </div>

              {/* Supporting Evidence Field */}
              <div>
                <label htmlFor="report-evidence" className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Supporting Evidence (SMS / UTR / URLs)
                </label>
                <input
                  id="report-evidence"
                  type="text"
                  maxLength={500}
                  value={evidenceText}
                  onChange={(e) => setEvidenceText(e.target.value)}
                  placeholder="e.g. Received SMS with APK link; UTR: 482910284"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 font-mono"
                />
              </div>

              {/* Optional Alias */}
              <div>
                <label htmlFor="report-alias" className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Reporter Alias (Optional / Anonymous)
                </label>
                <input
                  id="report-alias"
                  type="text"
                  maxLength={50}
                  value={reporterAlias}
                  onChange={(e) => setReporterAlias(e.target.value)}
                  placeholder="e.g. Concerned Citizen, Priya M."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Never enter private contact info or bank passwords.
                </span>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 active:scale-98 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Recording in Threat Radar...</span>
                  </>
                ) : (
                  <>
                    <Flag className="w-4 h-4" />
                    <span>Submit to Threat Radar</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
