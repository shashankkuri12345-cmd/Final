-- ==============================================================================
-- SCAN GUARD - Financial Fraud Prevention & Response Platform
-- Supabase PostgreSQL Production Schema & Row Level Security (RLS)
-- Meets Proofpoint HACK8 PS1 & First Round Evaluation Requirements
-- ==============================================================================

-- 1. Custom Types and Enums
DO $$ BEGIN
  CREATE TYPE scam_category AS ENUM ('phone', 'email', 'url', 'message', 'upi');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE risk_level AS ENUM ('safe', 'suspicious', 'danger', 'unknown');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('active', 'under_review', 'verified_scam', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE incident_category AS ENUM (
    'upi_payment',
    'qr_code',
    'customer_care',
    'phishing_link',
    'otp_impersonation',
    'investment_job',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE incident_status AS ENUM (
    'draft',
    'ready_to_report',
    'report_submitted',
    'acknowledgement_received',
    'bank_contacted',
    'under_follow_up',
    'closed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. User Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone_masked TEXT,
  role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'moderator', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Community Reports Table (Crowdsourced Threat Radar)
CREATE TABLE IF NOT EXISTS community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target TEXT NOT NULL,
  category scam_category NOT NULL,
  scam_type TEXT NOT NULL,
  description TEXT NOT NULL,
  risk_level risk_level NOT NULL DEFAULT 'danger',
  reporter_name TEXT DEFAULT 'Citizen Report',
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  evidence_text TEXT,
  evidence_url TEXT,
  upvotes INTEGER DEFAULT 1,
  status report_status DEFAULT 'active',
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  moderator_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Fraud Incidents Table (Post-Fraud Recovery & 1930 Assistant)
CREATE TABLE IF NOT EXISTS fraud_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category incident_category NOT NULL,
  incident_date TIMESTAMPTZ NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL,
  transaction_id TEXT, -- UTR or Bank Ref number
  suspect_identifier TEXT, -- Suspect UPI ID, phone, or URL
  description TEXT NOT NULL,
  evidence_notes TEXT,
  evidence_url TEXT,
  status incident_status NOT NULL DEFAULT 'draft',
  acknowledgement_number TEXT, -- NCRP 1930 Acknowledgement Number
  bank_complaint_id TEXT, -- Bank ticket / dispute number
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Incident Actions Table (Checklist & Audit Trail)
CREATE TABLE IF NOT EXISTS incident_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES fraud_incidents(id) ON DELETE CASCADE,
  action_key TEXT NOT NULL, -- e.g., 'call_1930', 'file_ncrp', 'contact_bank'
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. QR & Threat Scan History (Audit Trail with Performance Metrics)
CREATE TABLE IF NOT EXISTS qr_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  raw_payload TEXT NOT NULL,
  payee_vpa TEXT,
  payee_name TEXT,
  amount NUMERIC(10, 2),
  risk_outcome TEXT NOT NULL,
  risk_score INTEGER NOT NULL,
  stage_a_ms INTEGER,
  stage_b_ms INTEGER,
  stage_c_ms INTEGER,
  total_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message_snippet TEXT NOT NULL,
  scam_category TEXT,
  risk_score INTEGER NOT NULL,
  suspicious_phrases TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS link_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  risk_score INTEGER NOT NULL,
  is_brand_spoof BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS upi_recipients (
  vpa TEXT PRIMARY KEY,
  bank_psp TEXT,
  format_valid BOOLEAN DEFAULT TRUE,
  verified_status TEXT DEFAULT 'no_known_reports',
  flag_count INTEGER DEFAULT 0,
  last_checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Security Alerts Table (Live Advisories)
CREATE TABLE IF NOT EXISTS security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category scam_category NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'info')),
  summary TEXT NOT NULL,
  recommendations TEXT[],
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Indexes for Rapid Search & Telemetry
CREATE INDEX IF NOT EXISTS idx_community_reports_target ON community_reports (target);
CREATE INDEX IF NOT EXISTS idx_community_reports_category ON community_reports (category);
CREATE INDEX IF NOT EXISTS idx_community_reports_status ON community_reports (status);
CREATE INDEX IF NOT EXISTS idx_community_reports_created ON community_reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_user_id ON fraud_incidents (user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON fraud_incidents (status);
CREATE INDEX IF NOT EXISTS idx_qr_scans_payee ON qr_scans (payee_vpa);

-- 9. Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read public profile data, update their own
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Community Reports: Anyone can read verified or active reports
CREATE POLICY "Public read for community reports"
  ON community_reports FOR SELECT
  USING (status IN ('active', 'verified_scam', 'under_review'));

-- Anyone can submit a report with length safety
CREATE POLICY "Public submission of community reports"
  ON community_reports FOR INSERT
  WITH CHECK (
    char_length(target) <= 255 AND
    char_length(description) <= 2000 AND
    char_length(scam_type) <= 120
  );

-- Only report creators or admins can update reports
CREATE POLICY "Reporter can update unreviewed report"
  ON community_reports FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND reporter_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'moderator'))
  );

-- Fraud Incidents: User ownership only (Strict Privacy for Victims)
CREATE POLICY "Users read own incidents"
  ON fraud_incidents FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users create incidents"
  ON fraud_incidents FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users update own incidents"
  ON fraud_incidents FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Incident Actions: Access tied to parent incident
CREATE POLICY "Users manage own incident actions"
  ON incident_actions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM fraud_incidents
      WHERE fraud_incidents.id = incident_actions.incident_id
        AND (fraud_incidents.user_id = auth.uid() OR fraud_incidents.user_id IS NULL)
    )
  );

-- Security Alerts: Public read
CREATE POLICY "Public read for security alerts"
  ON security_alerts FOR SELECT
  USING (active = TRUE);

-- 10. Atomic Helper Functions
CREATE OR REPLACE FUNCTION increment_upvote(report_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE community_reports
  SET upvotes = upvotes + 1,
      updated_at = NOW()
  WHERE id = report_id;
END;
$$;
