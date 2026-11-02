'use client';

import React, { useState } from 'react';
import { ScamCheckResult, RiskLevel } from '@/lib/types';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Check,
  Copy,
  Flag,
  X,
  Clock,
  Info,
  ChevronDown,
  ChevronUp,
  PhoneCall
} from 'lucide-react';

export interface ResultCardProps {
  result: ScamCheckResult;
  onClose?: () => void;
  onClear?: () => void;
  onReport?: (target: string, category: string) => void;
  onReportClick?: (target: string, category: string) => void;
  onOpenEmergency?: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  result,
  onClose,
  onClear,
  onReport,
  onReportClick,
  onOpenEmergency,
}) => {
  const [copied, setCopied] = useState(false);
  const [showTransparency, setShowTransparency] = useState(false);

  const handleDismiss = onClose || onClear;
  const handleReport = onReportClick || onReport;

  const getRiskConfig = (level: RiskLevel) => {
    switch (level) {
      case 'danger':
        return {
          icon: ShieldAlert,
          title: 'High Risk Threat Alert',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-900',
          badgeBg: 'bg-red-100 text-[#D64545] border-red-200',
          scoreBar: 'bg-[#D64545]',
          scoreText: 'text-[#D64545]',
          accent: '#D64545',
        };
      case 'suspicious':
        return {
          icon: AlertTriangle,
          title: 'Suspicious Indicators Found',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-900',
          badgeBg: 'bg-amber-100 text-[#B7791F] border-amber-200',
          scoreBar: 'bg-[#B7791F]',
          scoreText: 'text-[#B7791F]',
          accent: '#B7791F',
        };
      case 'safe':
        return {
          icon: ShieldCheck,
          title: 'No Known Threats Found',
          bgColor: 'bg-[#EAF8EF]',
          borderColor: 'border-[#1DB954]/25',
          textColor: 'text-[#191C19]',
          badgeBg: 'bg-[#EAF8EF] text-[#169C46] border-[#1DB954]/30',
          scoreBar: 'bg-[#1DB954]',
          scoreText: 'text-[#169C46]',
          accent: '#1DB954',
        };
      case 'unknown':
      default:
        return {
          icon: HelpCircle,
          title: 'Unverified / Inconclusive',
          bgColor: 'bg-zinc-50',
          borderColor: 'border-zinc-200',
          textColor: 'text-zinc-900',
          badgeBg: 'bg-zinc-100 text-[#6B756D] border-zinc-200',
          scoreBar: 'bg-zinc-400',
          scoreText: 'text-zinc-600',
          accent: '#6B756D',
        };
    }
  };

  const config = getRiskConfig(result.riskLevel);
  const StatusIcon = config.icon;

  const handleCopy = () => {
    const text = `[SCAM GUARD Threat Assessment]
Target: ${result.target}
Category: ${result.category.toUpperCase()}
Risk Level: ${result.riskLevel.toUpperCase()} (Score: ${result.riskScore}/100)
${result.qrOutcome ? `QR Assessment Outcome: ${result.qrOutcome}\n` : ''}${result.recipientStatus ? `Recipient Status: ${result.recipientStatus}\n` : ''}Findings: ${result.summary}
Guidance: ${result.recommendedAction}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`rounded-2xl border ${config.borderColor} ${config.bgColor} p-4 shadow-sm space-y-3 transition-all animate-in fade-in duration-200`}
    >
      {/* 1. Top Bar: Badge, Risk Score & Dismiss */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${config.badgeBg}`}
          >
            <StatusIcon className="w-3.5 h-3.5 stroke-[2.4]" />
            <span>
              {result.qrOutcome
                ? result.qrOutcome.replace(/_/g, ' ')
                : result.recipientStatus
                ? result.recipientStatus.replace(/_/g, ' ').toUpperCase()
                : config.title}
            </span>
          </div>

          <span className="text-[10px] font-bold text-[#6B756D] bg-white/80 px-2 py-0.5 rounded-full border border-black/5 uppercase">
            {result.category}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-[#6B756D] hover:text-[#191C19] border border-black/5 transition-all"
            title="Copy check result"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#1DB954]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          {handleDismiss && (
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-[#6B756D] hover:text-[#191C19] border border-black/5 transition-all"
              title="Close card"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Target & Risk Bar */}
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-bold text-[#191C19] truncate max-w-[260px] font-mono">
            {result.target}
          </span>
          <span className={`text-xs font-bold ${config.scoreText}`}>
            Threat Index: {result.riskScore}%
          </span>
        </div>

        <div className="w-full h-1.5 bg-black/10 rounded-full mt-1.5 overflow-hidden">
          <div
            className={`h-full ${config.scoreBar} transition-all duration-500`}
            style={{ width: `${Math.max(5, result.riskScore)}%` }}
          />
        </div>
      </div>

      {/* 3. Executive Summary & Explanation */}
      <div className="space-y-1">
        <h4 className="text-xs font-bold text-[#191C19]">{result.summary}</h4>
        <p className="text-[11px] text-[#6B756D] leading-relaxed">
          {result.explanation}
        </p>
      </div>

      {/* 4. Itemized Findings */}
      {result.findings && result.findings.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold text-[#191C19] uppercase tracking-wide block">
            Evidence Findings ({result.findings.length})
          </span>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {result.findings.map((f, idx) => (
              <div
                key={idx}
                className="p-2 bg-white/90 rounded-xl border border-black/5 text-xs space-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#191C19] text-[11px]">{f.title}</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                      f.severity === 'high'
                        ? 'bg-red-100 text-red-700'
                        : f.severity === 'medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-[#EAF8EF] text-[#169C46]'
                    }`}
                  >
                    {f.severity}
                  </span>
                </div>
                <p className="text-[10px] text-[#6B756D] leading-normal">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Recommended Next Action */}
      <div className="p-2.5 rounded-xl bg-white/90 border border-black/5 space-y-0.5">
        <span className="text-[10px] font-bold text-[#191C19] uppercase tracking-wide block">
          Recommended Action:
        </span>
        <p className="text-xs font-medium text-[#191C19] leading-relaxed">
          {result.recommendedAction}
        </p>
      </div>

      {/* 6. Measurable Response Telemetry */}
      {result.metrics && (
        <div className="p-2 bg-white/60 rounded-xl border border-black/5 flex items-center justify-between text-[10px] text-[#6B756D] font-mono">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#1DB954]" />
            <span>
              A: {result.metrics.stageA_ms}ms • B: {result.metrics.stageB_ms}ms • C: {result.metrics.stageC_ms}ms
            </span>
          </div>
          <span className="font-bold text-[#191C19]">
            Total: {result.metrics.total_ms}ms
          </span>
        </div>
      )}

      {/* 7. Collapsible Transparency & Limitations Audit */}
      {result.transparency && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowTransparency(!showTransparency)}
            className="flex items-center justify-between w-full py-1 text-[11px] font-bold text-[#6B756D] hover:text-[#191C19]"
          >
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              <span>Inspection Transparency & Limitations</span>
            </span>
            {showTransparency ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showTransparency && (
            <div className="mt-2 p-3 bg-white/95 rounded-xl border border-black/5 space-y-2 text-[10px] text-[#6B756D] leading-relaxed">
              <div>
                <strong className="text-[#191C19] block">What Was Checked:</strong>
                <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                  {result.transparency.whatChecked.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>

              <div>
                <strong className="text-[#191C19] block">What Could NOT Be Verified:</strong>
                <p className="mt-0.5 text-amber-800">{result.transparency.whatCouldNotBeVerified}</p>
              </div>

              <div>
                <strong className="text-[#191C19] block">Reason for Risk Category:</strong>
                <p className="mt-0.5">{result.transparency.whyCategoryAssigned}</p>
              </div>

              <div>
                <strong className="text-[#191C19] block">Confidence & Limitations:</strong>
                <p className="mt-0.5 text-zinc-700">{result.transparency.confidenceAndLimitations}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 8. Action Buttons (Emergency Assist & Report) */}
      <div className="flex items-center gap-2 pt-1">
        {result.riskLevel === 'danger' && onOpenEmergency && (
          <button
            onClick={onOpenEmergency}
            className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Emergency 1930 / Assist</span>
          </button>
        )}

        {handleReport && (
          <button
            onClick={() => handleReport(result.target, result.category)}
            className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-zinc-50 text-[#191C19] border border-[#E5EAE5] text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
          >
            <Flag className="w-3.5 h-3.5 text-red-600" />
            <span>Report to Community</span>
          </button>
        )}
      </div>
    </div>
  );
};
