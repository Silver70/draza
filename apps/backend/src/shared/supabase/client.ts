import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
  supabaseInstance = createClient(supabaseUrl, supabaseKey);
  console.log('✓ Supabase client initialized');
} else {
  console.warn('⚠ Supabase credentials not found. Image upload features will be disabled.');
  console.warn('  Set SUPABASE_URL and SUPABASE_ANON_KEY in .env to enable image uploads.');
}

export const supabase = supabaseInstance;

export function ensureSupabaseClient(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env'
    );
  }
  return supabase;
}
