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

  let payload: { nome?: unknown; email?: unknown; senha?: unknown; perfil?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ message: 'Dados inválidos.' }, 400);
  }

  const nome = typeof payload.nome === 'string' ? payload.nome.trim() : '';
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const senha = typeof payload.senha === 'string' ? payload.senha : '';
  const perfil = payload.perfil;
  if (nome.length < 2 || nome.length > 160 || !email || senha.length < 8 || !['coordenador', 'equipe'].includes(String(perfil))) {
    return json({ message: 'Informe nome, e-mail, perfil e senha válida (mínimo de 8 caracteres).' }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome },
  });
  if (error) return json({ message: 'Não foi possível criar a conta com esses dados.' }, 400);

  const { error: profileError } = await admin
    .from('profiles')
    .update({ perfil })
    .eq('id', data.user.id);
  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return json({ message: 'Não foi possível concluir o cadastro.' }, 500);
  }

  return json({ id: data.user.id }, 201);
});
