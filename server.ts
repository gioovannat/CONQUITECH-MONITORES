import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

type PerfilUsuario = 'coordenador' | 'equipe';

interface UsuarioSanitizado {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  criadoEm: number;
}

interface AuthenticatedRequest extends Request {
  supabaseUser?: User;
  usuario?: UsuarioSanitizado;
  accessToken?: string;
}

const PORT = Number(process.env.PORT || 3000);

function getSupabaseEnv() {
  const url = (process.env.SUPABASE_URL || '').trim();
  const anonKey = (process.env.SUPABASE_ANON_KEY || '').trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const coordinatorEmail = (process.env.COORDINATOR_EMAIL || '').trim().toLowerCase();

  let urlValida = false;
  if (url) {
    try {
      const parsed = new URL(url);
      urlValida = parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
      urlValida = false;
    }
  }

  return {
    url,
    anonKey,
    serviceRoleKey,
    coordinatorEmail,
    configured: Boolean(url && urlValida && anonKey),
    hasServiceRole: Boolean(url && urlValida && serviceRoleKey),
  };
}

function createAnonClient(): SupabaseClient | null {
  const env = getSupabaseEnv();
  if (!env.configured) return null;
  return createClient(env.url, env.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function createAdminClient(): SupabaseClient | null {
  const env = getSupabaseEnv();
  if (!env.hasServiceRole) return null;
  return createClient(env.url, env.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function mapSupabaseUser(user: User, coordinatorEmail: string): UsuarioSanitizado {
  const appMeta = (user.app_metadata || {}) as Record<string, unknown>;
  const userMeta = (user.user_metadata || {}) as Record<string, unknown>;

  const email = (user.email || '').toLowerCase();
  const isDesignatedCoord = Boolean(coordinatorEmail && email === coordinatorEmail);

  const rawPerfil = appMeta.perfil ?? userMeta.perfil;
  const perfil: PerfilUsuario =
    isDesignatedCoord || rawPerfil === 'coordenador' ? 'coordenador' : 'equipe';

  const rawAtivo = appMeta.ativo ?? userMeta.ativo;
  const bannedUntil = (user as User & { banned_until?: string | null }).banned_until;
  const isBanned = Boolean(bannedUntil && new Date(bannedUntil).getTime() > Date.now());
  const ativo = rawAtivo !== false && !isBanned;

  const rawNome = typeof userMeta.nome === 'string' && userMeta.nome.trim()
    ? userMeta.nome.trim()
    : typeof userMeta.full_name === 'string' && userMeta.full_name.trim()
    ? userMeta.full_name.trim()
    : email.split('@')[0] || 'Membro Equipe D';

  const criadoEm = user.created_at ? new Date(user.created_at).getTime() : Date.now();

  return {
    id: user.id,
    nome: rawNome,
    email: user.email || '',
    perfil,
    ativo,
    criadoEm,
  };
}

function isValidEmail(email: unknown): email is string {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim();
  return trimmed.length >= 5 && trimmed.length <= 150 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function getSafeRedirectUrl(): string | undefined {
  const appUrl = (process.env.APP_URL || '').trim();
  if (!appUrl) return undefined;
  try {
    const parsed = new URL(appUrl);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.origin;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

async function requireSupabaseAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const env = getSupabaseEnv();
  const supabase = createAnonClient();
  if (!supabase) {
    return res.status(503).json({
      erro: 'Supabase não configurado no servidor. Configure SUPABASE_URL e SUPABASE_ANON_KEY em Settings -> Secrets.',
    });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Sessão ausente ou expirada. Faça login novamente.' });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({ erro: 'Token de acesso inválido.' });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ erro: 'Sessão inválida ou expirada no Supabase.' });
    }

    const usuario = mapSupabaseUser(data.user, env.coordinatorEmail);
    if (!usuario.ativo) {
      return res.status(403).json({
        erro: 'Esta conta foi desativada pela coordenação. Entre em contato com a equipe.',
      });
    }

    req.supabaseUser = data.user;
    req.usuario = usuario;
    req.accessToken = token;
    next();
  } catch {
    return res.status(401).json({ erro: 'Não foi possível validar sua sessão no Supabase.' });
  }
}

function requireCoordinator(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.usuario || req.usuario.perfil !== 'coordenador') {
    return res.status(403).json({
      erro: 'Acesso restrito: apenas coordenadores podem executar esta ação.',
    });
  }
  next();
}

async function bootstrapServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  // 1. Status da conexão com Supabase (somente metadados não-sensíveis)
  app.get('/api/auth/config', (_req, res) => {
    const env = getSupabaseEnv();
    res.json({
      configured: env.configured,
      hasUrl: Boolean(env.url),
      hasAnonKey: Boolean(env.anonKey),
      hasServiceRole: env.hasServiceRole,
    });
  });

  // 2. Login via Supabase Auth (Email + Senha)
  app.post('/api/auth/login', async (req, res) => {
    const env = getSupabaseEnv();
    const supabase = createAnonClient();

    if (!supabase) {
      return res.status(503).json({
        erro: 'Conexão com o Supabase ainda não configurada. Defina SUPABASE_URL e SUPABASE_ANON_KEY nos Secrets.',
      });
    }

    const { email, senha } = req.body || {};
    if (!isValidEmail(email) || typeof senha !== 'string' || senha.length < 1 || senha.length > 128) {
      return res.status(400).json({ erro: 'Informe um e-mail válido e sua senha de acesso.' });
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: senha,
      });

      if (error || !data.user || !data.session) {
        const msg = error?.message?.toLowerCase() || '';
        if (msg.includes('email not confirmed')) {
          return res.status(401).json({
            erro: 'Confirme seu e-mail através do link enviado pelo Supabase antes de acessar.',
          });
        }
        return res.status(401).json({
          erro: 'E-mail ou senha inválidos, ou conta não encontrada no Supabase.',
        });
      }

      const usuario = mapSupabaseUser(data.user, env.coordinatorEmail);
      if (!usuario.ativo) {
        return res.status(403).json({
          erro: 'Esta conta foi desativada pela coordenação. Entre em contato com a equipe.',
        });
      }

      return res.json({
        token: data.session.access_token,
        expiresAt: data.session.expires_at ? data.session.expires_at * 1000 : undefined,
        usuario,
      });
    } catch {
      return res.status(502).json({ erro: 'Erro de comunicação ao autenticar com o Supabase.' });
    }
  });

  // 3. Cadastro / Primeiro Acesso no Supabase Auth
  app.post('/api/auth/signup', async (req, res) => {
    const env = getSupabaseEnv();
    const supabase = createAnonClient();
    const supabaseAdmin = createAdminClient();

    if (!supabase) {
      return res.status(503).json({
        erro: 'Conexão com o Supabase ainda não configurada. Defina SUPABASE_URL e SUPABASE_ANON_KEY nos Secrets.',
      });
    }

    const { nome, email, senha } = req.body || {};
    if (typeof nome !== 'string' || nome.trim().length < 2 || nome.trim().length > 150) {
      return res.status(400).json({ erro: 'Informe seu nome completo (mínimo 2 caracteres).' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ erro: 'Informe um e-mail válido.' });
    }
    if (typeof senha !== 'string' || senha.length < 6 || senha.length > 128) {
      return res.status(400).json({ erro: 'A senha deve ter entre 6 e 128 caracteres.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanNome = nome.trim();

    try {
      let perfilInicial: PerfilUsuario =
        env.coordinatorEmail && cleanEmail === env.coordinatorEmail ? 'coordenador' : 'equipe';

      // Se SUPABASE_SERVICE_ROLE_KEY estiver configurada, verifica se é o primeiro usuário do projeto
      if (supabaseAdmin) {
        const { data: lista, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 1,
        });
        if (!listErr && (!lista?.users || lista.users.length === 0)) {
          perfilInicial = 'coordenador';
        }

        const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          password: senha,
          email_confirm: true,
          user_metadata: { nome: cleanNome, perfil: perfilInicial, ativo: true },
          app_metadata: { perfil: perfilInicial, ativo: true },
        });

        if (createErr || !created.user) {
          const msg = createErr?.message?.toLowerCase() || '';
          if (msg.includes('already') || msg.includes('registered')) {
            return res.status(409).json({ erro: 'Já existe uma conta cadastrada com este e-mail.' });
          }
          return res.status(400).json({ erro: createErr?.message || 'Não foi possível criar a conta no Supabase.' });
        }

        // Autentica imediatamente para entregar sessão em memória
        const { data: loginData } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: senha,
        });

        return res.status(201).json({
          token: loginData?.session?.access_token || null,
          usuario: mapSupabaseUser(created.user, env.coordinatorEmail),
          requiresEmailConfirmation: !loginData?.session,
          mensagem:
            perfilInicial === 'coordenador'
              ? 'Conta de Coordenação criada e conectada ao Supabase!'
              : 'Conta criada com sucesso no Supabase!',
        });
      }

      // Fluxo padrão com SUPABASE_ANON_KEY (signUp)
      const redirectTo = getSafeRedirectUrl();
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: senha,
        options: {
          data: {
            nome: cleanNome,
            perfil: perfilInicial,
            ativo: true,
          },
          ...(redirectTo ? { emailRedirectTo: redirectTo } : {}),
        },
      });

      if (error || !data.user) {
        const msg = error?.message?.toLowerCase() || '';
        if (msg.includes('already') || msg.includes('registered')) {
          return res.status(409).json({ erro: 'Já existe uma conta cadastrada com este e-mail.' });
        }
        return res.status(400).json({ erro: error?.message || 'Erro ao cadastrar conta no Supabase.' });
      }

      // Supabase retorna identities vazio se o email já existir e enum protection estiver ativo
      if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return res.status(409).json({ erro: 'Já existe uma conta cadastrada com este e-mail.' });
      }

      const usuario = mapSupabaseUser(data.user, env.coordinatorEmail);
      const hasSession = Boolean(data.session?.access_token);

      return res.status(201).json({
        token: data.session?.access_token || null,
        usuario: hasSession ? usuario : null,
        requiresEmailConfirmation: !hasSession,
        mensagem: hasSession
          ? 'Conta criada e conectada ao Supabase!'
          : 'Cadastro realizado no Supabase! Verifique seu e-mail para confirmar e liberar o login.',
      });
    } catch {
      return res.status(502).json({ erro: 'Falha ao criar usuário no Supabase.' });
    }
  });

  // 4. Recuperação de Senha via Supabase Auth
  app.post('/api/auth/reset-password', async (req, res) => {
    const supabase = createAnonClient();
    if (!supabase) {
      return res.status(503).json({
        erro: 'Conexão com o Supabase ainda não configurada.',
      });
    }

    const { email } = req.body || {};
    if (!isValidEmail(email)) {
      return res.status(400).json({ erro: 'Informe um e-mail válido para recuperação.' });
    }

    try {
      const redirectTo = getSafeRedirectUrl();
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        redirectTo ? { redirectTo } : undefined
      );

      if (error) {
        return res.status(400).json({ erro: 'Não foi possível enviar o e-mail de recuperação.' });
      }

      return res.json({
        sucesso: true,
        mensagem: 'Se o e-mail estiver cadastrado no Supabase, você receberá um link para redefinir sua senha.',
      });
    } catch {
      return res.status(502).json({ erro: 'Erro de comunicação ao solicitar redefinição de senha.' });
    }
  });

  // 5. Sessão Atual Verificada no Servidor
  app.get('/api/auth/me', requireSupabaseAuth, (req: AuthenticatedRequest, res) => {
    return res.json({ usuario: req.usuario });
  });

  // 6. Logout
  app.post('/api/auth/logout', (_req, res) => {
    return res.json({ sucesso: true });
  });

  // 7. Listar Usuários Autorizados (Coordenador)
  app.get(
    '/api/auth/users',
    requireSupabaseAuth,
    requireCoordinator,
    async (req: AuthenticatedRequest, res) => {
      const env = getSupabaseEnv();
      const supabaseAdmin = createAdminClient();

      if (!supabaseAdmin) {
        return res.json({
          users: req.usuario ? [req.usuario] : [],
          serviceRoleConfigured: false,
        });
      }

      try {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 200,
        });

        if (error) {
          return res.status(502).json({ erro: 'Não foi possível listar usuários do Supabase.' });
        }

        const users = (data.users || [])
          .map((u) => mapSupabaseUser(u, env.coordinatorEmail))
          .sort((a, b) => b.criadoEm - a.criadoEm);

        return res.json({
          users,
          serviceRoleConfigured: true,
        });
      } catch {
        return res.status(502).json({ erro: 'Erro ao consultar usuários no Supabase.' });
      }
    }
  );

  // 8. Criar Novo Usuário da Equipe D no Supabase Auth (Coordenador)
  app.post(
    '/api/auth/users',
    requireSupabaseAuth,
    requireCoordinator,
    async (req: AuthenticatedRequest, res) => {
      const env = getSupabaseEnv();
      const supabaseAdmin = createAdminClient();

      if (!supabaseAdmin) {
        return res.status(501).json({
          erro: 'Para criar outros usuários diretamente pelo painel, adicione SUPABASE_SERVICE_ROLE_KEY em Settings -> Secrets.',
        });
      }

      const { nome, email, perfil, senha } = req.body || {};
      if (typeof nome !== 'string' || nome.trim().length < 2 || nome.trim().length > 150) {
        return res.status(400).json({ erro: 'Informe o nome completo do operador (mínimo 2 caracteres).' });
      }
      if (!isValidEmail(email)) {
        return res.status(400).json({ erro: 'Informe um e-mail válido.' });
      }
      if (perfil !== 'coordenador' && perfil !== 'equipe') {
        return res.status(400).json({ erro: 'Perfil inválido.' });
      }
      if (typeof senha !== 'string' || senha.length < 6 || senha.length > 128) {
        return res.status(400).json({ erro: 'Defina uma senha inicial com pelo menos 6 caracteres.' });
      }

      try {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: email.trim().toLowerCase(),
          password: senha,
          email_confirm: true,
          user_metadata: {
            nome: nome.trim(),
            perfil,
            ativo: true,
          },
          app_metadata: {
            perfil,
            ativo: true,
          },
        });

        if (error || !data.user) {
          const msg = error?.message?.toLowerCase() || '';
          if (msg.includes('already') || msg.includes('registered')) {
            return res.status(409).json({ erro: 'Já existe um usuário cadastrado com este e-mail no Supabase.' });
          }
          return res.status(400).json({ erro: error?.message || 'Falha ao criar usuário no Supabase.' });
        }

        return res.status(201).json({
          usuario: mapSupabaseUser(data.user, env.coordinatorEmail),
        });
      } catch {
        return res.status(502).json({ erro: 'Erro de comunicação ao criar usuário no Supabase.' });
      }
    }
  );

  // 9. Ativar / Desativar Usuário no Supabase Auth (Coordenador)
  app.patch(
    '/api/auth/users/:id/status',
    requireSupabaseAuth,
    requireCoordinator,
    async (req: AuthenticatedRequest, res) => {
      const env = getSupabaseEnv();
      const supabaseAdmin = createAdminClient();

      if (!supabaseAdmin) {
        return res.status(501).json({
          erro: 'Para ativar/desativar usuários pelo painel, configure SUPABASE_SERVICE_ROLE_KEY em Settings -> Secrets.',
        });
      }

      const targetId = String(req.params.id || '').trim();
      if (!targetId || targetId.length > 128) {
        return res.status(400).json({ erro: 'ID de usuário inválido.' });
      }

      if (targetId === req.usuario?.id) {
        return res.status(400).json({ erro: 'Você não pode desativar o seu próprio usuário logado.' });
      }

      try {
        const { data: existingData, error: getErr } = await supabaseAdmin.auth.admin.getUserById(targetId);
        if (getErr || !existingData.user) {
          return res.status(404).json({ erro: 'Usuário não encontrado no Supabase.' });
        }

        const currentUser = mapSupabaseUser(existingData.user, env.coordinatorEmail);
        const novoAtivo = !currentUser.ativo;

        const { data: updatedData, error: updErr } = await supabaseAdmin.auth.admin.updateUserById(targetId, {
          ban_duration: novoAtivo ? 'none' : '876000h',
          app_metadata: {
            ...(existingData.user.app_metadata || {}),
            perfil: currentUser.perfil,
            ativo: novoAtivo,
          },
          user_metadata: {
            ...(existingData.user.user_metadata || {}),
            ativo: novoAtivo,
          },
        });

        if (updErr || !updatedData.user) {
          return res.status(400).json({ erro: 'Não foi possível atualizar o status no Supabase.' });
        }

        return res.json({
          usuario: mapSupabaseUser(updatedData.user, env.coordinatorEmail),
        });
      } catch {
        return res.status(502).json({ erro: 'Erro de comunicação ao atualizar usuário no Supabase.' });
      }
    }
  );

  // Vite dev middleware ou produção estática
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CONQUITECH-MA server listening on http://0.0.0.0:${PORT}`);
  });
}

bootstrapServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
