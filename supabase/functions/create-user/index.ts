import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ message: 'Método não permitido.' }, 405);

  const authorization = request.headers.get('Authorization');
  if (!authorization) return json({ message: 'Não autorizado.' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ message: 'Serviço indisponível.' }, 500);

  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return json({ message: 'Não autorizado.' }, 401);

  const { data: caller } = await client
    .from('profiles')
    .select('perfil, ativo')
    .eq('id', user.id)
    .single();
  if (caller?.perfil !== 'coordenador' || !caller.ativo) return json({ message: 'Acesso negado.' }, 403);

  let payload: { nome?: unknown; email?: unknown; perfil?: unknown; redirectTo?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ message: 'Dados inválidos.' }, 400);
  }

  const nome = typeof payload.nome === 'string' ? payload.nome.trim() : '';
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const perfil = payload.perfil;
  const redirectTo = typeof payload.redirectTo === 'string' ? payload.redirectTo.trim() : '';
  if (nome.length < 2 || nome.length > 160 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !['coordenador', 'equipe'].includes(String(perfil))) {
    return json({ message: 'Informe nome, e-mail e perfil válidos.' }, 400);
  }

  const requestOrigin = request.headers.get('origin');
  let parsedRedirect: URL;
  try {
    parsedRedirect = new URL(redirectTo);
  } catch {
    return json({ message: 'Não foi possível preparar o link de convite.' }, 400);
  }
  const sameOrigin = requestOrigin ? parsedRedirect.origin === requestOrigin : false;
  const trustedVercelHost = ['v0.app', 'v0.dev', 'v0.build', 'vercel.app', 'vercel.live'].some(
    (domain) => parsedRedirect.hostname === domain || parsedRedirect.hostname.endsWith(`.${domain}`),
  );
  const secureRedirect = parsedRedirect.protocol === 'https:' && (sameOrigin || trustedVercelHost);
  const localRedirect = parsedRedirect.protocol === 'http:' && sameOrigin && ['localhost', '127.0.0.1'].includes(parsedRedirect.hostname);
  if (!secureRedirect && !localRedirect) return json({ message: 'Endereço de retorno inválido.' }, 400);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: { nome, must_set_password: true },
  });
  if (error) {
    if (data?.user) await admin.auth.admin.deleteUser(data.user.id);
    if (error.code === 'email_address_not_authorized') {
      return json({ message: 'O remetente padrão do Supabase não está autorizado a enviar para este domínio. Sem SMTP externo, o convite não pode ser entregue.' }, 400);
    }
    if (error.code === 'over_email_send_rate_limit') {
      return json({ message: 'O limite de envio de convites foi atingido. Tente novamente mais tarde.' }, 429);
    }
    if (error.code === 'user_already_exists' || error.code === 'email_exists') {
      return json({ message: 'Já existe uma conta para este e-mail.' }, 409);
    }
    return json({ message: 'Não foi possível enviar o convite. Verifique o endereço e tente novamente.' }, 400);
  }

  if (!data.user) return json({ message: 'Não foi possível concluir o convite.' }, 500);
  const { error: profileError } = await admin
    .from('profiles')
    .update({ perfil })
    .eq('id', data.user.id);
  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return json({ message: 'Não foi possível concluir o convite.' }, 500);
  }

  return json({ id: data.user.id }, 201);
});
