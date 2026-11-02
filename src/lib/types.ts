export type ScamCategory = 'phone' | 'email' | 'url' | 'message' | 'upi';

export type AppModule =
  | 'dashboard'
  | 'qr-scanner'
  | 'emergency-assistance'
  | 'fake-message'
  | 'fraud-link'
  | 'upi-verify'
  | 'reports'
  | 'fraud-network'
  | 'safety-assistant'
  | 'login';

export type NavTab = AppModule | 'home' | 'check' | 'qr-and-pay' | 'messages' | 'reports';

export type RiskLevel = 'safe' | 'suspicious' | 'danger' | 'unknown';

export type QrThreatOutcome =
  | 'NO_KNOWN_THREATS_FOUND'
  | 'SUSPICIOUS'
  | 'HIGH_RISK'
  | 'UNVERIFIED';

export type RecipientTrustStatus =
  | 'format_valid'
  | 'no_known_reports'
  | 'suspicious'
  | 'verified_scam_report';

export interface PerformanceMetrics {
  stageA_ms: number; // Input validation & payload decoding
  stageB_ms: number; // Community threat database / threat-intel check
  stageC_ms: number; // Evidence scoring & explainable reasoning
  total_ms: number;
  timestamp: string;
}

export interface TransparencyAudit {
  whatChecked: string[];
  whatFound: string[];
  availableEvidence: string;
  whatCouldNotBeVerified: string;
  whyCategoryAssigned: string;
  confidenceAndLimitations: string;
}

export interface AnalysisFinding {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'info';
  category: string;
}

export interface ScamCheckResult {
  target: string;
  category: ScamCategory;
  riskLevel: RiskLevel;
  riskScore: number; // 0 - 100
  qrOutcome?: QrThreatOutcome;
  recipientStatus?: RecipientTrustStatus;
  summary: string;
  explanation: string;
  findings: AnalysisFinding[];
  recommendedAction: string;
  communityReportsCount: number;
  verifiedStatus: 'unverified' | 'community_flagged' | 'known_malicious' | 'clean';
  timestamp: string;
  metrics?: PerformanceMetrics;
  transparency?: TransparencyAudit;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface CommunityReport {
  id: string;
  target: string;
  category: ScamCategory;
  scamType: string;
  description: string;
  riskLevel: RiskLevel;
  reporterName?: string;
  evidenceText?: string;
  evidenceUrl?: string;
  upvotes: number;
  status: 'active' | 'under_review' | 'verified_scam';
  reviewedBy?: string;
  moderatorNotes?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export type IncidentCategory =
  | 'upi_payment'
  | 'qr_code'
  | 'customer_care'
  | 'phishing_link'
  | 'otp_impersonation'
  | 'investment_job'
  | 'other';

export type IncidentStatus =
  | 'draft'
  | 'ready_to_report'
  | 'report_submitted'
  | 'acknowledgement_received'
  | 'bank_contacted'
  | 'under_follow_up'
  | 'closed';

export interface IncidentActionItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  completedAt?: string;
  notes?: string;
}

export interface FraudIncident {
  id: string;
  userId?: string;
  category: IncidentCategory;
  incidentDate: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string; // UTR or Ref
  suspectIdentifier?: string; // UPI ID or Phone
  description: string;
  evidenceNotes?: string;
  evidenceUrl?: string;
  status: IncidentStatus;
  acknowledgementNumber?: string;
  bankComplaintId?: string;
  actionsTaken: IncidentActionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SafetyTip {
  id: string;
  title: string;
  category: ScamCategory | 'general';
  summary: string;
  dos: string[];
  donts: string[];
  helpline?: string;
}
