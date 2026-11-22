import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const rawUrl = (
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ??
  import.meta.env.VITE_SUPABASE_URL ??
  ''
).trim();

const rawAnonKey = (
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
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
  if (!value || value === 'SUA_CHAVE_ANON_PUBLICA') return false;
  if (value.startsWith('sb_publishable_')) return true;

  const tokenParts = value.split('.');
  if (tokenParts.length !== 3) return false;

  try {
    const base64Payload = tokenParts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const paddedPayload = base64Payload.padEnd(
      Math.ceil(base64Payload.length / 4) * 4,
      '=',
    );
    const payload = JSON.parse(atob(paddedPayload)) as { role?: unknown };
    return payload.role === 'anon';
  } catch {
    return false;
  }
}

const normalizedUrl = normalizeSupabaseUrl(rawUrl);

export const isSupabaseConfigured =
  Boolean(normalizedUrl) && isValidAnonKey(rawAnonKey);

export const supabaseConfigWarning = isSupabaseConfigured
  ? null
  : 'Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ou NEXT_PUBLIC_SUPABASE_ANON_KEY) nas variáveis de ambiente do projeto.';

export const supabase: SupabaseClient | null =
  isSupabaseConfigured && normalizedUrl
    ? createClient(normalizedUrl, rawAnonKey)
    : null;
