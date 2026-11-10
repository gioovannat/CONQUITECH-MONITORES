import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (request) => {
  const auth = request.headers.get('Authorization');
  if (!auth) return Response.json({ message: 'Não autorizado.' }, { status: 401 });

  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
  const { data: { user } } = await client.auth.getUser();
  if (!user) return Response.json({ message: 'Não autorizado.' }, { status: 401 });
  const { data: caller } = await client.from('profiles').select('perfil, ativo').eq('id', user.id).single();
  if (caller?.perfil !== 'coordenador' || !caller.ativo) return Response.json({ message: 'Acesso negado.' }, { status: 403 });

  const { nome, email, senha, perfil } = await request.json();
  if (!nome?.trim() || !email?.trim() || !senha || !['coordenador', 'equipe'].includes(perfil)) {
    return Response.json({ message: 'Dados inválidos.' }, { status: 400 });
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data, error } = await admin.auth.admin.createUser({
    email: email.trim().toLowerCase(), password: senha, email_confirm: true, user_metadata: { nome: nome.trim() },
  });
  if (error) return Response.json({ message: error.message }, { status: 400 });
  const { error: profileError } = await admin.from('profiles').update({ perfil }).eq('id', data.user.id);
  if (profileError) return Response.json({ message: profileError.message }, { status: 400 });
  return Response.json({ id: data.user.id }, { status: 201 });
});
