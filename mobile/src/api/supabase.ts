import { createClient } from '@supabase/supabase-js';

const rawUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://your-project.supabase.co';

const rawKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'your-anon-key';

const supabaseUrl = rawUrl.trim();
const supabaseAnonKey = rawKey.trim();

export const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  !supabaseUrl.includes('your-project') &&
  Boolean(supabaseAnonKey) &&
  !supabaseAnonKey.includes('your-anon-key');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
