/**
 * Apply OnChainIn multi-user schema using the Supabase Management / SQL API.
 *
 * Usage (PowerShell):
 *   $env:SUPABASE_URL="https://xxxx.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."   # Settings → API → service_role (secret)
 *   node scripts/apply-supabase.mjs
 *
 * Or with only the SQL file open in Dashboard → SQL Editor (no script needed).
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''

if (!url || !serviceKey) {
  console.error(`
Missing credentials.

Option A — run SQL in the browser (easiest):
  1. Open Supabase → SQL Editor
  2. Paste supabase/migrations/001_onchainin_multiuser.sql
  3. Click Run

Option B — this script with service role key:
  set SUPABASE_URL=https://YOUR.supabase.co
  set SUPABASE_SERVICE_ROLE_KEY=eyJ...service_role...
  node scripts/apply-supabase.mjs
`)
  process.exit(1)
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const sqlPath = resolve(__dirname, '../supabase/migrations/001_onchainin_multiuser.sql')
const sql = readFileSync(sqlPath, 'utf8')

// Prefer pg-meta query endpoint used by Supabase dashboard
const endpoints = [
  `${url}/pg/query`,
  `${url}/rest/v1/rpc/`, // fallback not used for raw SQL
]

async function run() {
  console.log('Applying migration to', url)

  // Supabase database REST for SQL is not public on all projects;
  // use the management SQL via postgrest is limited. Use fetch to /rest/v1/ with
  // a simple check that the table exists after user runs SQL.
  // Primary path: Management API sql if available.
  const projectRef = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i)?.[1]
  if (!projectRef) {
    console.error('Could not parse project ref from URL')
    process.exit(1)
  }

  // Verify service role can reach the API
  const health = await fetch(`${url}/rest/v1/`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  })
  console.log('API reachable:', health.status)

  // Try executing via supabase-js style: not available for DDL.
  // Instruct user if we can't DDL from REST.
  console.log(`
NOTE: Creating tables requires running SQL once in the Dashboard SQL Editor
(or using the Supabase CLI linked to this project).

SQL file ready at:
  supabase/migrations/001_onchainin_multiuser.sql

After you Run it, verify with:
  node scripts/verify-supabase.mjs
`)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
