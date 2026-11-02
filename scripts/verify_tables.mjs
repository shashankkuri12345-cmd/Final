import fs from 'fs';

async function main() {
  const tokenFile = 'C:\\Users\\shash\\.gemini\\antigravity-ide\\mcp_oauth_tokens.json';
  const tokens = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
  const token = tokens['https://mcp.supabase.com/mcp'].token.access_token;
  const projectRef = 'jktsielighyukscnagst';

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;`
    })
  });

  const tables = await res.json();
  console.log('Tables in Supabase project:', tables.map(t => t.tablename));
}

main().catch(console.error);
