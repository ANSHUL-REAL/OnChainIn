import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()

export const supabaseEnvError =
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl.includes('YOUR_PROJECT') ||
  supabaseAnonKey.includes('your_supabase')
    ? 'Supabase env missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for multi-user online mode.'
    : null

export function isCloudEnabled(): boolean {
  return !supabaseEnvError && Boolean(supabaseUrl && supabaseAnonKey)
}

export const supabase: SupabaseClient | null = isCloudEnabled()
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: { eventsPerSecond: 10 },
      },
    })
  : null

export function requireSupabase() {
  if (!supabase) {
    throw new Error(supabaseEnvError || 'Supabase is not configured.')
  }
  return supabase
}
