import fs from 'fs';

async function main() {
  const tokenFile = 'C:\\Users\\shash\\.gemini\\antigravity-ide\\mcp_oauth_tokens.json';
  const tokens = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
  const token = tokens['https://mcp.supabase.com/mcp'].token.access_token;
  const projectRef = 'jktsielighyukscnagst';

  const baseSchema = fs.readFileSync('d:\\HAACKY\\supabase-schema.sql', 'utf8');

  const extraSchema = `
-- Fraud Dataset table for demo records & verified threat dataset
CREATE TABLE IF NOT EXISTS fraud_dataset (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL UNIQUE,
  identifier_type TEXT NOT NULL,
  fraud_category TEXT NOT NULL,
  description TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'SCAN GUARD Demo',
  status TEXT NOT NULL DEFAULT 'approved',
  is_demo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_dataset_identifier ON fraud_dataset (identifier);
CREATE INDEX IF NOT EXISTS idx_fraud_dataset_type ON fraud_dataset (identifier_type);

ALTER TABLE fraud_dataset ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read for fraud dataset" ON fraud_dataset;
CREATE POLICY "Public read for fraud dataset" ON fraud_dataset FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert for fraud dataset" ON fraud_dataset;
CREATE POLICY "Public insert for fraud dataset" ON fraud_dataset FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update for fraud dataset" ON fraud_dataset;
CREATE POLICY "Public update for fraud dataset" ON fraud_dataset FOR UPDATE USING (true);

-- Website Inquiries & Contact Forms
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  inquiry_type TEXT DEFAULT 'general',
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert inquiries" ON inquiries;
CREATE POLICY "Public insert inquiries" ON inquiries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public read inquiries" ON inquiries;
CREATE POLICY "Public read inquiries" ON inquiries FOR SELECT USING (true);

-- Ensure public submission on scans and forms
DROP POLICY IF EXISTS "Public insert qr_scans" ON qr_scans;
CREATE POLICY "Public insert qr_scans" ON qr_scans FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public read qr_scans" ON qr_scans;
CREATE POLICY "Public read qr_scans" ON qr_scans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert message_scans" ON message_scans;
CREATE POLICY "Public insert message_scans" ON message_scans FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public read message_scans" ON message_scans;
CREATE POLICY "Public read message_scans" ON message_scans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert link_scans" ON link_scans;
CREATE POLICY "Public insert link_scans" ON link_scans FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public read link_scans" ON link_scans;
CREATE POLICY "Public read link_scans" ON link_scans FOR SELECT USING (true);

ALTER TABLE upi_recipients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read upi_recipients" ON upi_recipients;
CREATE POLICY "Public read upi_recipients" ON upi_recipients FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert upi_recipients" ON upi_recipients;
CREATE POLICY "Public insert upi_recipients" ON upi_recipients FOR INSERT WITH CHECK (true);
`;

  const fullSql = baseSchema + '\n' + extraSchema;

  console.log(`Applying schema to Supabase project ${projectRef}...`);
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: fullSql })
  });

  const body = await res.json();
  console.log(`Status: ${res.status}`);
  if (res.status >= 200 && res.status < 300) {
    console.log('Schema successfully applied to Supabase!');
  } else {
    console.error('Error applying schema:', body);
  }
}

main().catch(console.error);
