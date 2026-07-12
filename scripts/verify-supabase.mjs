/**
 * Verify oci_store exists and anon can read/write.
 *
 *   node scripts/verify-supabase.mjs
 * Uses VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY from .env
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnv() {
  const p = resolve(process.cwd(), '.env')
  if (!existsSync(p)) return {}
  const out = {}
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i)
    if (!m) continue
    out[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
  }
  return out
}

const env = { ...loadEnv(), ...process.env }
const url = (env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
const key = env.VITE_SUPABASE_ANON_KEY || ''

if (!url || !key || url.includes('YOUR_PROJECT') || key.includes('your_supabase')) {
  console.error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env first.')
  process.exit(1)
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
}

const testId = `verify-${Date.now()}`

async function main() {
  console.log('Checking', url)

  // Select (table must exist)
  const sel = await fetch(
    `${url}/rest/v1/oci_store?select=collection,id&limit=1`,
    { headers },
  )
  const selText = await sel.text()
  if (!sel.ok) {
    console.error('FAIL read oci_store:', sel.status, selText)
    console.error('→ Run supabase/migrations/001_onchainin_multiuser.sql in SQL Editor')
    process.exit(1)
  }
  console.log('OK  read oci_store')

  // Insert
  const ins = await fetch(`${url}/rest/v1/oci_store`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      collection: '_health',
      id: testId,
      data: { ok: true, at: new Date().toISOString() },
    }),
  })
  const insText = await ins.text()
  if (!ins.ok) {
    console.error('FAIL write oci_store:', ins.status, insText)
    process.exit(1)
  }
  console.log('OK  write oci_store')

  // Delete cleanup
  await fetch(
    `${url}/rest/v1/oci_store?collection=eq._health&id=eq.${encodeURIComponent(testId)}`,
    { method: 'DELETE', headers },
  )
  console.log('OK  cleanup')
  console.log('\nSupabase multi-user store is ready.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
