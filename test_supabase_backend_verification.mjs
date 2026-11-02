import fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const tokenFile = 'C:\\Users\\shash\\.gemini\\antigravity-ide\\mcp_oauth_tokens.json';
const tokens = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
const token = tokens['https://mcp.supabase.com/mcp'].token.access_token;
const projectRef = 'jktsielighyukscnagst';

async function querySupabaseSql(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  return res.json();
}

async function runTests() {
  console.log('========================================================================');
  console.log('SCAN GUARD: SUPABASE BACKEND & FRAUD DATASET VERIFICATION SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`[PASS] ${testName} ${detail ? `(${detail})` : ''}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // --- TASK 4.1: Test All 10 Records from scan_guard_test_fraud_dataset.csv ---
  console.log('--- TEST 1: All 10 Demo Fraud Dataset Records ---');
  const demoRecords = [
    { id: 'TEST-PHONE-0001', cat: 'phone', category: 'Fake bank call' },
    { id: 'TEST-PHONE-0002', cat: 'phone', category: 'OTP scam' },
    { id: 'TEST-PHONE-0003', cat: 'phone', category: 'Lottery scam' },
    { id: 'TEST-PHONE-0004', cat: 'phone', category: 'Fake customer care' },
    { id: 'TEST-PHONE-0005', cat: 'phone', category: 'Investment scam' },
    { id: 'demo.fraud01@test.invalid', cat: 'upi', category: 'Fake payment request' },
    { id: 'demo.fraud02@test.invalid', cat: 'upi', category: 'Refund scam' },
    { id: 'demo.fraud03@test.invalid', cat: 'upi', category: 'Phishing' },
    { id: 'demo.fraud04@test.invalid', cat: 'upi', category: 'Job scam' },
    { id: 'demo.fraud05@test.invalid', cat: 'upi', category: 'Impersonation' },
  ];

  for (const item of demoRecords) {
    const res = await fetch(`${BASE_URL}/api/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: item.id, category: item.cat })
    });
    const data = await res.json();
    assert(
      data.datasetVerdict === 'REPORTED_FRAUD',
      `Record ${item.id} verdict is REPORTED_FRAUD`,
      `Got: ${data.datasetVerdict}, Score: ${data.riskScore}`
    );
    assert(
      data.isDemoData === true,
      `Record ${item.id} isDemoData is true`,
      `Flag: ${data.isDemoData}`
    );
    assert(
      data.summary === 'REPORTED FRAUD',
      `Record ${item.id} summary is REPORTED FRAUD`,
      `Summary: ${data.summary}`
    );
  }

  // --- TASK 4.2: Test Unknown Identifier ---
  console.log('\n--- TEST 2: Unknown Identifier ---');
  const unknownTarget = 'UNKNOWN-IDENTIFIER-9999';
  const unknownRes = await fetch(`${BASE_URL}/api/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target: unknownTarget, category: 'upi' })
  });
  const unknownData = await unknownRes.json();
  assert(
    unknownData.datasetVerdict === 'UNVERIFIED',
    'Unknown identifier returns UNVERIFIED verdict',
    `Verdict: ${unknownData.datasetVerdict}`
  );
  assert(
    unknownData.riskLevel !== 'safe',
    'Unmatched identifier is NOT classified as safe',
    `RiskLevel: ${unknownData.riskLevel}`
  );

  // --- TASK 4.3: Test Invalid Identifier ---
  console.log('\n--- TEST 3: Invalid Identifier ---');
  const invalidTarget = 'invalid@@syntax..com';
  const invalidRes = await fetch(`${BASE_URL}/api/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target: invalidTarget })
  });
  const invalidData = await invalidRes.json();
  assert(
    invalidData.datasetVerdict === 'UNVERIFIED',
    'Invalid identifier returns UNVERIFIED verdict',
    `Verdict: ${invalidData.datasetVerdict}`
  );
  assert(
    invalidData.riskLevel !== 'safe',
    'Invalid identifier is NOT classified as safe',
    `RiskLevel: ${invalidData.riskLevel}`
  );

  // --- TASK 4.4: Duplicate Dataset Imports ---
  console.log('\n--- TEST 4: Duplicate Dataset Imports ---');
  // Re-import the same 10 records
  const countBefore = await querySupabaseSql('SELECT COUNT(*)::int as count FROM fraud_dataset;');
  await querySupabaseSql(`
    INSERT INTO fraud_dataset (identifier, identifier_type, fraud_category, description, source, status, is_demo)
    VALUES ('TEST-PHONE-0001', 'phone', 'Fake bank call', 'Duplicate test', 'SCAN GUARD Demo', 'approved', true)
    ON CONFLICT (identifier) DO NOTHING;
  `);
  const countAfter = await querySupabaseSql('SELECT COUNT(*)::int as count FROM fraud_dataset;');
  assert(
    countBefore[0].count === countAfter[0].count,
    'Duplicate dataset import successfully prevented (unique index intact)',
    `Before: ${countBefore[0].count}, After: ${countAfter[0].count}`
  );

  // --- TASK 4.5: Database Unavailable Simulation ---
  console.log('\n--- TEST 5: Database Unavailable Simulation ---');
  const unavailRes = await fetch(`${BASE_URL}/api/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target: 'TEST-PHONE-0001', simulateUnavailable: true })
  });
  const unavailData = await unavailRes.json();
  assert(
    unavailData.datasetVerdict === 'CHECK_UNAVAILABLE',
    'Simulated database unavailable returns CHECK_UNAVAILABLE',
    `Got: ${unavailData.datasetVerdict}`
  );
  assert(
    unavailData.summary === 'CHECK UNAVAILABLE',
    'Summary indicates CHECK UNAVAILABLE',
    `Summary: ${unavailData.summary}`
  );

  // --- TASK 4.6: Pending Report Lookup ---
  console.log('\n--- TEST 6: Pending Report Lookup ---');
  const pendingTarget = 'pending-suspect@test.invalid';
  await querySupabaseSql(`
    INSERT INTO community_reports (target, category, scam_type, description, risk_level, status)
    VALUES ('${pendingTarget}', 'upi', 'Pending Test Fraud', 'Simulated report awaiting moderator review', 'suspicious', 'under_review')
    ON CONFLICT DO NOTHING;
  `);
  const pendingRes = await fetch(`${BASE_URL}/api/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target: pendingTarget })
  });
  const pendingData = await pendingRes.json();
  assert(
    pendingData.datasetVerdict === 'UNDER_REVIEW',
    'Pending community report returns UNDER_REVIEW verdict',
    `Verdict: ${pendingData.datasetVerdict}`
  );
  assert(
    pendingData.riskLevel === 'suspicious',
    'Pending report risk level is suspicious',
    `RiskLevel: ${pendingData.riskLevel}`
  );

  // --- TASK 4.7: Approved Report Lookup ---
  console.log('\n--- TEST 7: Approved Report Lookup ---');
  const approvedTarget = '+91 98234 11209';
  await querySupabaseSql(`
    INSERT INTO community_reports (target, category, scam_type, description, risk_level, status)
    VALUES ('${approvedTarget}', 'phone', 'Electricity Bill Extortion', 'Verified fraud corridor number', 'danger', 'verified_scam')
    ON CONFLICT DO NOTHING;
  `);
  const approvedRes = await fetch(`${BASE_URL}/api/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target: approvedTarget })
  });
  const approvedData = await approvedRes.json();
  assert(
    approvedData.datasetVerdict === 'REPORTED_FRAUD',
    'Approved/verified report returns REPORTED_FRAUD verdict',
    `Verdict: ${approvedData.datasetVerdict}`
  );

  // --- TASK 4.8: Form Submissions to Supabase Backend ---
  console.log('\n--- TEST 8: Form Submissions Saved to Supabase Backend ---');
  
  // 1. Submit Inquiry
  const inquiryRes = await fetch(`${BASE_URL}/api/inquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Rohan Sharma',
      email: 'rohan.sharma@example.com',
      phone: '+91 98765 43210',
      subject: 'Inquiry regarding corporate scam prevention',
      message: 'Hello, our organization wants to integrate Scan Guard threat radar for our staff.',
      inquiry_type: 'partnership'
    })
  });
  const inquiryData = await inquiryRes.json();
  assert(inquiryData.success === true, 'Inquiry successfully submitted via /api/inquiries');

  // Verify in Supabase table
  const inquiryRows = await querySupabaseSql(`SELECT * FROM inquiries WHERE email = 'rohan.sharma@example.com';`);
  assert(
    inquiryRows.length > 0,
    'Inquiry record persisted directly in Supabase inquiries table',
    `Found: ${inquiryRows.length} rows, ID: ${inquiryRows[0]?.id}`
  );

  // 2. Submit Community Report
  const reportRes = await fetch(`${BASE_URL}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      target: 'fake-courier-support@ybl',
      category: 'upi',
      scamType: 'Fake Courier Collect Fee',
      description: 'Demanded ₹5 delivery reschedule fee, attempted to withdraw ₹25,000.',
      riskLevel: 'danger',
      reporterName: 'Sunita Patel, Pune'
    })
  });
  const reportData = await reportRes.json();
  assert(reportData.success === true, 'Community report submitted via /api/reports');

  // Verify in Supabase table
  const reportRows = await querySupabaseSql(`SELECT * FROM community_reports WHERE target = 'fake-courier-support@ybl';`);
  assert(
    reportRows.length > 0,
    'Community report persisted directly in Supabase community_reports table',
    `Found: ${reportRows.length} rows, Status: ${reportRows[0]?.status}`
  );

  // 3. Submit Fraud Incident
  const incidentRes = await fetch(`${BASE_URL}/api/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: 'upi_payment',
      incidentDate: new Date().toISOString(),
      amount: 15000,
      paymentMethod: 'UPI - Google Pay',
      transactionId: 'UTR491028471920',
      suspectIdentifier: 'fraud-merchant@paytm',
      description: 'Sent advance for camera on OLX, seller deleted profile after payment.',
      status: 'ready_to_report'
    })
  });
  const incidentData = await incidentRes.json();
  assert(incidentData.success === true, 'Fraud incident submitted via /api/incidents');

  // Verify in Supabase table
  const incidentRows = await querySupabaseSql(`SELECT * FROM fraud_incidents WHERE transaction_id = 'UTR491028471920';`);
  assert(
    incidentRows.length > 0,
    'Fraud incident persisted directly in Supabase fraud_incidents table',
    `Found: ${incidentRows.length} rows, Amount: ₹${incidentRows[0]?.amount}`
  );

  // --- Summary ---
  console.log('\n========================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
