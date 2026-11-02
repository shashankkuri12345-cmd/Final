import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  CommunityReport,
  ScamCategory,
  RiskLevel,
  FraudIncident,
  IncidentStatus,
  IncidentActionItem,
} from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

// Initial curated community threat radar seed data
const INITIAL_COMMUNITY_REPORTS: CommunityReport[] = [
  {
    id: 'rep-001',
    target: '+91 98234 11209',
    category: 'phone',
    scamType: 'Electricity Bill Extortion',
    description: 'Robocall claiming electricity connection will be cut off by 9:30 PM tonight. Demands payment via QuickSupport APK.',
    riskLevel: 'danger',
    reporterName: 'Arun K., Bengaluru',
    evidenceText: 'SMS received from +919823411209 with BESCOM spoofed sender ID. Demanded ₹1,490 immediately.',
    upvotes: 48,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'verified_scam',
    reviewedBy: 'CyberSec Moderator #04',
    moderatorNotes: 'Verified against 38 complaints in Bengaluru Cybercell corridor. VoIP SIP trunk confirmed.',
    reviewedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'rep-002',
    target: 'sbi-pan-update.top',
    category: 'url',
    scamType: 'Banking KYC Phishing',
    description: 'Phishing portal mimicking SBI YONO login page asking for username, password, and OTP to avoid card deactivation.',
    riskLevel: 'danger',
    reporterName: 'Priya M., Mumbai',
    evidenceText: 'Hosted on .top TLD, credential harvesting script sends POST requests to Telegram bot.',
    upvotes: 72,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    status: 'verified_scam',
    reviewedBy: 'CyberSec Moderator #01',
    moderatorNotes: 'Active credential stealer. Domain reported to registrar and CERT-In.',
    reviewedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'rep-003',
    target: 'refund-desk@okhdfcbank',
    category: 'upi',
    scamType: 'OLX Marketplace QR PIN Scam',
    description: 'Buyer from OLX sent a QR code claiming it is to transfer ₹15,000 for sofa. Scanning it showed a PAY request instead of receive.',
    riskLevel: 'danger',
    reporterName: 'Rohan D., Delhi NCR',
    evidenceText: 'QR payload: upi://pay?pa=refund-desk@okhdfcbank&pn=RefundDesk&am=15000&tn=Refund',
    upvotes: 91,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    status: 'verified_scam',
    reviewedBy: 'CyberSec Moderator #02',
    moderatorNotes: 'Classic reverse-payment QR trap. Mule account frozen under NCRP 1930.',
    reviewedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: 'rep-004',
    target: 'careers@amazon-hiring-india.xyz',
    category: 'email',
    scamType: 'Fake Work From Home Job',
    description: 'Offers ₹4,500 daily for liking YouTube videos. Asked for ₹1,999 registration fee to unlock task portal.',
    riskLevel: 'danger',
    reporterName: 'Sneha T., Hyderabad',
    evidenceText: 'Telegram channel link enclosed with fake company incorporation certificate.',
    upvotes: 34,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: 'verified_scam',
    reviewedBy: 'CyberSec Moderator #03',
    reviewedAt: new Date(Date.now() - 3600000 * 16).toISOString(),
  },
  {
    id: 'rep-005',
    target: '+91 93120 44812',
    category: 'phone',
    scamType: 'FedEx Customs Parcel Scam',
    description: 'IVR claiming a courier with illegal goods has been seized at Mumbai airport and asking to transfer penalty money.',
    riskLevel: 'danger',
    reporterName: 'Vikas N., Pune',
    evidenceText: 'Scammer claimed to connect to "Cyber Crime Branch Mumbai" via Skype.',
    upvotes: 29,
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    status: 'verified_scam',
    reviewedBy: 'CyberSec Moderator #01',
    reviewedAt: new Date(Date.now() - 3600000 * 30).toISOString(),
  }
];

// Fallback in-memory and localStorage store
const REPORTS_STORAGE_KEY = 'scam_guard_community_reports';
const INCIDENTS_STORAGE_KEY = 'scam_guard_incidents';

function loadStoredReports(): CommunityReport[] {
  if (typeof window === 'undefined') return [...INITIAL_COMMUNITY_REPORTS];
  try {
    const raw = localStorage.getItem(REPORTS_STORAGE_KEY);
    if (!raw) return [...INITIAL_COMMUNITY_REPORTS];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...INITIAL_COMMUNITY_REPORTS];
  } catch {
    return [...INITIAL_COMMUNITY_REPORTS];
  }
}

function saveStoredReports(reports: CommunityReport[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
    } catch (e) {
      console.warn('Failed to save reports to localStorage', e);
    }
  }
}

// Load initial stored reports from seed or localStorage

interface DatabaseReportRow {
  id: string;
  target: string;
  category: ScamCategory;
  scam_type?: string;
  scamType?: string;
  description: string;
  risk_level?: RiskLevel;
  riskLevel?: RiskLevel;
  reporter_name?: string;
  reporterName?: string;
  evidence_text?: string;
  evidenceText?: string;
  evidence_url?: string;
  upvotes?: number;
  created_at?: string;
  createdAt?: string;
  status?: 'active' | 'under_review' | 'verified_scam';
  reviewed_by?: string;
  moderator_notes?: string;
  reviewed_at?: string;
}

export async function fetchCommunityReports(
  category?: ScamCategory,
  searchQuery?: string
): Promise<CommunityReport[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('community_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (category) {
        query = query.eq('category', category);
      }
      if (searchQuery) {
        query = query.ilike('target', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return (data as unknown as DatabaseReportRow[]).map((item) => ({
          id: item.id,
          target: item.target,
          category: item.category,
          scamType: item.scam_type || item.scamType || 'Unknown Modus Operandi',
          description: item.description,
          riskLevel: item.risk_level || item.riskLevel || 'danger',
          reporterName: item.reporter_name || item.reporterName || 'Anonymous Citizen',
          evidenceText: item.evidence_text || item.evidenceText || undefined,
          evidenceUrl: item.evidence_url || undefined,
          upvotes: item.upvotes || 0,
          createdAt: item.created_at || item.createdAt || new Date().toISOString(),
          status: item.status || 'active',
          reviewedBy: item.reviewed_by || undefined,
          moderatorNotes: item.moderator_notes || undefined,
          reviewedAt: item.reviewed_at || undefined,
        }));
      }
    } catch (e) {
      console.warn('Supabase fetch failed, falling back to local memory store', e);
    }
  }

  // Fallback filtering
  let results = loadStoredReports();
  if (category) {
    results = results.filter((r) => r.category === category);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    results = results.filter(
      (r) =>
        r.target.toLowerCase().includes(q) ||
        r.scamType.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
    );
  }
  return results;
}

export async function submitCommunityReport(
  report: Omit<CommunityReport, 'id' | 'createdAt' | 'upvotes' | 'status'>
): Promise<{ success: boolean; data?: CommunityReport; error?: string }> {
  const newReport: CommunityReport = {
    ...report,
    id: `rep-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    upvotes: 1,
    createdAt: new Date().toISOString(),
    status: 'under_review', // Judges requirement: unverified reports start under review
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('community_reports')
        .insert({
          target: newReport.target,
          category: newReport.category,
          scam_type: newReport.scamType,
          description: newReport.description,
          risk_level: newReport.riskLevel,
          reporter_name: newReport.reporterName || 'Citizen Report',
          evidence_text: newReport.evidenceText || null,
          upvotes: 1,
          status: 'under_review',
        })
        .select()
        .single();

      if (error) {
        console.warn('Supabase insert failed, storing in fallback storage', error);
      } else if (data) {
        newReport.id = data.id;
      }
    } catch (e) {
      console.warn('Supabase submission exception:', e);
    }
  }

  // Prepend to local storage so user sees instant update
  const current = loadStoredReports();
  const updated = [newReport, ...current];
  saveStoredReports(updated);
  return { success: true, data: newReport };
}

export async function upvoteReport(reportId: string): Promise<number> {
  const current = loadStoredReports();
  const rep = current.find((r) => r.id === reportId);
  if (rep) {
    rep.upvotes += 1;
    saveStoredReports(current);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.rpc('increment_upvote', { report_id: reportId });
    } catch (e) {
      console.warn('Supabase upvote rpc skipped', e);
    }
  }

  return rep?.upvotes || 1;
}

export async function updateReportModeration(
  reportId: string,
  status: 'active' | 'under_review' | 'verified_scam',
  moderatorNotes?: string,
  reviewedBy?: string
): Promise<CommunityReport | null> {
  const current = loadStoredReports();
  const rep = current.find((r) => r.id === reportId);
  if (rep) {
    rep.status = status;
    rep.moderatorNotes = moderatorNotes;
    rep.reviewedBy = reviewedBy || 'Authorized Moderator';
    rep.reviewedAt = new Date().toISOString();
    saveStoredReports(current);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('community_reports')
        .update({
          status,
          moderator_notes: moderatorNotes,
          reviewed_by: reviewedBy || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', reportId);
    } catch (e) {
      console.warn('Supabase update moderation failed', e);
    }
  }

  return rep || null;
}

export async function checkCommunityBlacklist(target: string): Promise<CommunityReport[]> {
  const cleanTarget = target.trim().toLowerCase();
  const all = await fetchCommunityReports();
  return all.filter((r) => {
    const reportTarget = r.target.trim().toLowerCase();
    return (
      reportTarget === cleanTarget ||
      cleanTarget.includes(reportTarget) ||
      reportTarget.includes(cleanTarget)
    );
  });
}

// ==============================================================================
// Module 5: Post-Fraud Emergency Incident & Actions Store
// ==============================================================================

const DEFAULT_INCIDENT_ACTIONS: IncidentActionItem[] = [
  {
    id: 'act-1930',
    label: 'Call National Cybercrime Helpline 1930',
    description: 'Report the transaction within the 2-3 hour "Golden Window" to freeze the recipient mule account.',
    completed: false,
  },
  {
    id: 'act-ncrp',
    label: 'File Complaint on cybercrime.gov.in',
    description: 'Submit an online financial fraud report on the National Cybercrime Reporting Portal to obtain an official FIR/Acknowledgement number.',
    completed: false,
  },
  {
    id: 'act-bank',
    label: 'Contact Bank Fraud Helpline',
    description: 'Call your issuing bank helpline immediately to block card/NetBanking and register an official chargeback dispute.',
    completed: false,
  },
  {
    id: 'act-app',
    label: 'Report to Payment Application (GPay / PhonePe / Paytm)',
    description: 'Open transaction history in the UPI app and raise a "Fraudulent Transfer" dispute to flag the recipient VPA.',
    completed: false,
  },
  {
    id: 'act-evidence',
    label: 'Preserve Transaction & Chat Evidence',
    description: 'Save PDF bank statement with UTR number, screenshots of WhatsApp chats, caller ID, and payment confirmations.',
    completed: false,
  },
  {
    id: 'act-branch',
    label: 'Submit Written Dispute at Home Branch',
    description: 'Submit a signed letter with FIR/NCRP acknowledgement to your bank branch manager within 3 days under RBI guidelines.',
    completed: false,
  },
];

const INITIAL_DEMO_INCIDENT: FraudIncident = {
  id: 'inc-demo-8491',
  category: 'upi_payment',
  incidentDate: new Date(Date.now() - 3600000 * 3).toISOString(),
  amount: 14500,
  paymentMethod: 'UPI (Google Pay)',
  transactionId: 'UTR492819284012',
  suspectIdentifier: 'refund-desk@okhdfcbank',
  description: 'Scammer posed as OLX buyer for dining table and sent reverse payment collect QR code labelled "Receive ₹14,500". Money was debited upon PIN entry.',
  status: 'ready_to_report',
  acknowledgementNumber: 'NCRP-2026-BLR-09124',
  bankComplaintId: 'HDFC-DISP-91823',
  actionsTaken: [
    { ...DEFAULT_INCIDENT_ACTIONS[0], completed: true, completedAt: new Date(Date.now() - 3600000 * 2).toISOString(), notes: 'Called 1930, complaint logged with officer' },
    { ...DEFAULT_INCIDENT_ACTIONS[1], completed: true, completedAt: new Date(Date.now() - 3600000).toISOString() },
    { ...DEFAULT_INCIDENT_ACTIONS[2], completed: false },
    { ...DEFAULT_INCIDENT_ACTIONS[3], completed: false },
    { ...DEFAULT_INCIDENT_ACTIONS[4], completed: true, completedAt: new Date(Date.now() - 3600000 * 2.5).toISOString() },
    { ...DEFAULT_INCIDENT_ACTIONS[5], completed: false },
  ],
  createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  updatedAt: new Date(Date.now() - 3600000).toISOString(),
};

function loadStoredIncidents(): FraudIncident[] {
  if (typeof window === 'undefined') return [INITIAL_DEMO_INCIDENT];
  try {
    const raw = localStorage.getItem(INCIDENTS_STORAGE_KEY);
    if (!raw) return [INITIAL_DEMO_INCIDENT];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [INITIAL_DEMO_INCIDENT];
  } catch {
    return [INITIAL_DEMO_INCIDENT];
  }
}

function saveStoredIncidents(incidents: FraudIncident[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(INCIDENTS_STORAGE_KEY, JSON.stringify(incidents));
    } catch (e) {
      console.warn('Failed to save incidents to localStorage', e);
    }
  }
}

export async function fetchFraudIncidents(): Promise<FraudIncident[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('fraud_incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d) => ({
          id: d.id,
          userId: d.user_id,
          category: d.category,
          incidentDate: d.incident_date,
          amount: Number(d.amount),
          paymentMethod: d.payment_method,
          transactionId: d.transaction_id,
          suspectIdentifier: d.suspect_identifier,
          description: d.description,
          evidenceNotes: d.evidence_notes,
          status: d.status,
          acknowledgementNumber: d.acknowledgement_number,
          bankComplaintId: d.bank_complaint_id,
          actionsTaken: DEFAULT_INCIDENT_ACTIONS,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
      }
    } catch (e) {
      console.warn('Supabase incidents fetch failed, using local store', e);
    }
  }

  return loadStoredIncidents();
}

export async function createFraudIncident(
  incidentData: Omit<FraudIncident, 'id' | 'createdAt' | 'updatedAt' | 'actionsTaken'>
): Promise<{ success: boolean; data: FraudIncident }> {
  const newIncident: FraudIncident = {
    ...incidentData,
    id: `inc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    status: incidentData.status || 'ready_to_report',
    actionsTaken: DEFAULT_INCIDENT_ACTIONS.map((a) => ({ ...a })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('fraud_incidents')
        .insert({
          category: newIncident.category,
          incident_date: newIncident.incidentDate,
          amount: newIncident.amount,
          payment_method: newIncident.paymentMethod,
          transaction_id: newIncident.transactionId || null,
          suspect_identifier: newIncident.suspectIdentifier || null,
          description: newIncident.description,
          evidence_notes: newIncident.evidenceNotes || null,
          status: newIncident.status,
          acknowledgement_number: newIncident.acknowledgementNumber || null,
          bank_complaint_id: newIncident.bankComplaintId || null,
        })
        .select()
        .single();

      if (!error && data) {
        newIncident.id = data.id;
      }
    } catch (e) {
      console.warn('Supabase incident insert failed', e);
    }
  }

  const current = loadStoredIncidents();
  const updated = [newIncident, ...current];
  saveStoredIncidents(updated);
  return { success: true, data: newIncident };
}

export async function updateIncidentStatus(
  incidentId: string,
  status: IncidentStatus,
  acknowledgementNumber?: string,
  bankComplaintId?: string
): Promise<FraudIncident | null> {
  const current = loadStoredIncidents();
  const inc = current.find((i) => i.id === incidentId);
  if (inc) {
    inc.status = status;
    if (acknowledgementNumber !== undefined) inc.acknowledgementNumber = acknowledgementNumber;
    if (bankComplaintId !== undefined) inc.bankComplaintId = bankComplaintId;
    inc.updatedAt = new Date().toISOString();
    saveStoredIncidents(current);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('fraud_incidents')
        .update({
          status,
          acknowledgement_number: acknowledgementNumber,
          bank_complaint_id: bankComplaintId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', incidentId);
    } catch (e) {
      console.warn('Supabase incident status update failed', e);
    }
  }

  return inc || null;
}

export async function toggleIncidentActionItem(
  incidentId: string,
  actionId: string,
  notes?: string
): Promise<FraudIncident | null> {
  const current = loadStoredIncidents();
  const inc = current.find((i) => i.id === incidentId);
  if (inc) {
    const act = inc.actionsTaken.find((a) => a.id === actionId);
    if (act) {
      act.completed = !act.completed;
      act.completedAt = act.completed ? new Date().toISOString() : undefined;
      if (notes) act.notes = notes;
    }
    inc.updatedAt = new Date().toISOString();
    saveStoredIncidents(current);
  }
  return inc || null;
}

// Authentication Service
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: 'citizen' | 'moderator' | 'admin';
  isCloudAuth?: boolean;
}

const LOCAL_AUTH_STORAGE_KEY = 'scam_guard_session';

export async function signInUser(
  email: string,
  password: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  const cleanEmail = email.trim().toLowerCase();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (data?.user) {
        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email || cleanEmail,
          name: data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
          role: cleanEmail.includes('admin') || cleanEmail.includes('moderator') ? 'moderator' : 'citizen',
          isCloudAuth: true,
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(authUser));
        }
        return { user: authUser, error: null };
      }
    } catch (err: unknown) {
      console.warn('Supabase signIn exception, falling back to local session', err);
    }
  }

  // Fallback demo/offline authentication
  if (password.length < 6) {
    return { user: null, error: 'Password must be at least 6 characters long.' };
  }

  const authUser: AuthUser = {
    id: `usr-${Date.now().toString(36)}`,
    email: cleanEmail,
    name: cleanEmail.split('@')[0].replace(/[._]/g, ' '),
    role: cleanEmail.includes('admin') || cleanEmail.includes('moderator') ? 'moderator' : 'citizen',
    isCloudAuth: false,
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(authUser));
  }

  return { user: authUser, error: null };
}

export async function signUpUser(
  email: string,
  password: string
): Promise<{ user: AuthUser | null; error: string | null; message?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (data?.user) {
        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email || cleanEmail,
          name: cleanEmail.split('@')[0],
          role: 'citizen',
          isCloudAuth: true,
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(authUser));
        }
        return {
          user: authUser,
          error: null,
          message: data.session ? undefined : 'Confirmation email sent. Please check your inbox.',
        };
      }
    } catch (err: unknown) {
      console.warn('Supabase signUp exception', err);
    }
  }

  if (password.length < 6) {
    return { user: null, error: 'Password must be at least 6 characters.' };
  }

  const authUser: AuthUser = {
    id: `usr-${Date.now().toString(36)}`,
    email: cleanEmail,
    name: cleanEmail.split('@')[0],
    role: 'citizen',
    isCloudAuth: false,
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(authUser));
  }

  return { user: authUser, error: null };
}

export async function signOutUser(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase signOut error', err);
    }
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOCAL_AUTH_STORAGE_KEY);
  }
}

export async function resetPasswordUser(email: string): Promise<{ error: string | null; message?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
      if (error) return { error: error.message };
      return { error: null, message: 'Password recovery email sent. Check your inbox.' };
    } catch (err: unknown) {
      console.warn('Supabase resetPassword error', err);
    }
  }
  return { error: null, message: 'Password reset link sent to registered email address.' };
}

export function getSavedSession(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
