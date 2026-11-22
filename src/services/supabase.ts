import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const rawUrl = (
  import.meta.env.VITE_SUPABASE_URL ??
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ??
  ''
).trim();

const rawAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  ''
).trim();

function normalizeSupabaseUrl(value: string): string | null {
  if (!value || value.includes('SEU-PROJETO')) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

function isValidAnonKey(value: string): boolean {
  return Boolean(value) && value !== 'SUA_CHAVE_ANON_PUBLICA';
}

const normalizedUrl = normalizeSupabaseUrl(rawUrl);

export const isSupabaseConfigured =
  Boolean(normalizedUrl) && isValidAnonKey(rawAnonKey);

export const supabaseConfigWarning = isSupabaseConfigured
  ? null
  : 'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis de ambiente do projeto.';

export const supabase: SupabaseClient | null =
  isSupabaseConfigured && normalizedUrl
    ? createClient(normalizedUrl, rawAnonKey)
    : null;
