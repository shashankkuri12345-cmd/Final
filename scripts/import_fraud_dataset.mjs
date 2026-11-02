import fs from 'fs';

async function main() {
  const tokenFile = 'C:\\Users\\shash\\.gemini\\antigravity-ide\\mcp_oauth_tokens.json';
  const tokens = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
  const token = tokens['https://mcp.supabase.com/mcp'].token.access_token;
  const projectRef = 'jktsielighyukscnagst';

  const csvContent = fs.readFileSync('d:\\HAACKY\\scan_guard_test_fraud_dataset.csv', 'utf8').trim();
  const lines = csvContent.split('\n').map(l => l.trim()).filter(Boolean);
  console.log(`Reading CSV with ${lines.length - 1} records...`);

  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    records.push({
      identifier: cols[0],
      identifier_type: cols[1],
      fraud_category: cols[2],
      description: cols[3],
      source: cols[4],
      status: cols[5],
      is_demo: cols[6].toLowerCase() === 'true'
    });
  }

  // Construct parameterized bulk UPSERT SQL
  let valuesSql = records.map(r => 
    `('${r.identifier}', '${r.identifier_type}', '${r.fraud_category}', '${r.description.replace(/'/g, "''")}', '${r.source}', '${r.status}', ${r.is_demo})`
  ).join(',\n');

  const upsertQuery = `
    INSERT INTO fraud_dataset (identifier, identifier_type, fraud_category, description, source, status, is_demo)
    VALUES
    ${valuesSql}
    ON CONFLICT (identifier) 
    DO UPDATE SET 
      identifier_type = EXCLUDED.identifier_type,
      fraud_category = EXCLUDED.fraud_category,
      description = EXCLUDED.description,
      source = EXCLUDED.source,
      status = EXCLUDED.status,
      is_demo = EXCLUDED.is_demo,
      updated_at = NOW();
  `;

  console.log('Inserting records into Supabase fraud_dataset table...');
  const insertRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: upsertQuery })
  });

  console.log('Insert HTTP Status:', insertRes.status);

  // Query back to verify insertion
  const verifyRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: `SELECT identifier, identifier_type, fraud_category, status, is_demo, source FROM fraud_dataset ORDER BY identifier;`
    })
  });

  const imported = await verifyRes.json();
  console.log(`Successfully verified ${imported.length} records in Supabase:`);
  console.table(imported);

  // Seed sample security alerts as well
  const seedAlertsSql = `
    INSERT INTO security_alerts (title, category, severity, summary, recommendations, active)
    VALUES 
    (
      'Surge in Fake Bank KYC / APK Scams',
      'phone',
      'critical',
      'Fraudulent SMS and WhatsApp calls claiming bank account suspension requiring APK download or OTP verification.',
      ARRAY['Never download APK files sent over WhatsApp or SMS', 'Banks never ask for OTP or PIN to complete KYC', 'Report immediately to 1930'],
      true
    ),
    (
      'QR Code Reversal / Money Receive Traps',
      'upi',
      'high',
      'Scammers sending UPI collect requests disguised as refund or payment receipt QR codes on OLX/Marketplace.',
      ARRAY['Entering UPI PIN ALWAYS debits money, never receives money', 'Decline collect requests from unknown VPA handles', 'Check merchant verification badge before scanning'],
      true
    )
    ON CONFLICT DO NOTHING;
  `;

  await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: seedAlertsSql })
  });
  console.log('Seeded security alerts.');
}

main().catch(console.error);
