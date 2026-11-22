import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase, supabaseConfigWarning } from '../services/supabase';

export type PerfilUsuario = 'coordenador' | 'equipe';
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  criadoEm: number;
}

interface AuthContextType {
  usuarioAtual: Usuario | null;
  usuarios: Usuario[];
  verificandoSessao: boolean;
  estaCarregando: boolean;
  precisaDefinirSenha: boolean;
  supabaseConfigurado: boolean;
  login: (email: string, senha: string) => Promise<{ sucesso: boolean; mensagem?: string }>;
  logout: () => void;
  convidarUsuario: (dados: { nome: string; email: string; perfil: PerfilUsuario; redirectTo: string }) => Promise<{ sucesso: boolean; mensagem?: string }>;
  definirSenha: (senha: string) => Promise<{ sucesso: boolean; mensagem?: string }>;
  alternarStatusUsuario: (id: string) => Promise<{ sucesso: boolean; mensagem?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toUsuario = (profile: any, email = ''): Usuario => ({
  id: profile.id,
  nome: profile.nome,
  email,
  perfil: profile.perfil,
  ativo: Boolean(profile.ativo),
  criadoEm: profile.criado_em ? new Date(profile.criado_em).getTime() : Date.now(),
});

function traduzirErroAuthSupabase(message?: string, code?: string): string {
  const msg = (message || '').toLowerCase();
  const errCode = (code || '').toLowerCase();
  if (errCode === 'email_provider_disabled' || msg.includes('email logins are disabled')) {
    return 'O login por E-mail está desativado no seu projeto Supabase. Acesse Authentication → Sign In / Providers → Email e ative a opção "Enable Email provider".';
  }
  if (errCode === 'email_not_confirmed' || msg.includes('email not confirmed')) {
    return 'E-mail ainda não confirmado no Supabase. Confirme o link enviado ou ative "Auto Confirm User" em Authentication → Users.';
  }
  if (errCode === 'invalid_credentials' || msg.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos no Supabase Auth.';
  }
  if (errCode === 'user_banned' || msg.includes('user is banned')) {
    return 'Este usuário está bloqueado no Supabase Auth.';
  }
  if (msg.includes('too many requests') || msg.includes('rate limit')) {
    return 'Muitas tentativas seguidas. Aguarde alguns instantes e tente novamente.';
  }
  if (msg.includes('failed to fetch') || msg.includes('network')) {
    return 'Não foi possível conectar ao servidor do Supabase. Verifique sua internet e a URL do projeto.';
  }
  return message || 'Não foi possível validar o acesso no Supabase.';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuarioAtual, setUsuarioAtual] = useState<Usuario | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [verificandoSessao, setVerificandoSessao] = useState<boolean>(isSupabaseConfigured);
  const [estaCarregando, setEstaCarregando] = useState<boolean>(false);
  const [precisaDefinirSenha, setPrecisaDefinirSenha] = useState(false);

  const requestId = useRef(0);
  const loginEmCursoRef = useRef(false);

  const limparSessao = () => {
    requestId.current += 1;
    setUsuarioAtual(null);
    setUsuarios([]);
    setPrecisaDefinirSenha(false);
    setEstaCarregando(false);
    setVerificandoSessao(false);
  };

  const carregarPerfil = async (
    user: User | null
  ): Promise<{ sucesso: boolean; mensagem?: string }> => {
    const currentRequest = ++requestId.current;
    if (!supabase || !user) {
      setUsuarioAtual(null);
      setUsuarios([]);
      setPrecisaDefinirSenha(false);
      setVerificandoSessao(false);
      return { sucesso: false, mensagem: 'Sessão não iniciada.' };
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (currentRequest !== requestId.current) {
        return { sucesso: false, mensagem: 'Requisição substituída por uma nova tentativa.' };
      }

      if (error) {
        void supabase.auth.signOut();
        setUsuarioAtual(null);
        setUsuarios([]);
        setPrecisaDefinirSenha(false);
        return {
          sucesso: false,
          mensagem: `Erro ao consultar tabela profiles no Supabase: ${error.message}. Verifique se o script SQL foi executado.`,
        };
      }

      if (!profile) {
        void supabase.auth.signOut();
        setUsuarioAtual(null);
        setUsuarios([]);
        setPrecisaDefinirSenha(false);
        return {
          sucesso: false,
          mensagem:
            'Login validado, mas este usuário ainda não possui registro na tabela public.profiles. Execute o script SQL de sincronização no SQL Editor do Supabase.',
        };
      }

      if (!profile.ativo) {
        void supabase.auth.signOut();
        setUsuarioAtual(null);
        setUsuarios([]);
        setPrecisaDefinirSenha(false);
        return {
          sucesso: false,
          mensagem: 'Esta conta foi desativada pela coordenação (ativo = false).',
        };
      }

      const usuarioLogado = toUsuario(profile, user.email || '');
      setUsuarioAtual(usuarioLogado);
      setPrecisaDefinirSenha(user.user_metadata?.must_set_password === true);

      if (profile.perfil === 'coordenador') {
        const { data, error: usersError } = await supabase
          .from('profiles')
          .select('*')
          .order('criado_em', { ascending: false });

        if (currentRequest === requestId.current) {
          if (!usersError && Array.isArray(data)) {
            setUsuarios(
              data.map((item: any) =>
                toUsuario(item, item.id === user.id ? user.email || '' : '')
              )
            );
          } else {
            setUsuarios([usuarioLogado]);
          }
        }
      } else {
        setUsuarios([usuarioLogado]);
      }

      return { sucesso: true };
    } catch (err) {
      if (currentRequest === requestId.current) {
        void supabase.auth.signOut();
        setUsuarioAtual(null);
        setUsuarios([]);
        setPrecisaDefinirSenha(false);
      }
      return {
        sucesso: false,
        mensagem:
          err instanceof Error
            ? `Falha ao carregar perfil: ${err.message}`
            : 'Falha inesperada ao carregar perfil no Supabase.',
      };
    } finally {
      if (currentRequest === requestId.current) {
        setVerificandoSessao(false);
      }
    }
  };

  useEffect(() => {
    if (!supabase) {
      setVerificandoSessao(false);
      return;
    }

    let mounted = true;
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (loginEmCursoRef.current) return;
      if (event === 'TOKEN_REFRESHED' && session?.user) return;

      queueMicrotask(() => {
        if (mounted && !loginEmCursoRef.current) {
          void carregarPerfil(session?.user ?? null);
        }
      });
    });

    void supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (mounted && !loginEmCursoRef.current) {
          void carregarPerfil(user);
        }
      })
      .catch(() => {
        if (mounted) setVerificandoSessao(false);
      });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
      requestId.current += 1;
    };
  }, []);

  const login = async (email: string, senha: string) => {
    if (!supabase) {
      return {
        sucesso: false,
        mensagem: supabaseConfigWarning || 'Supabase não configurado no ambiente do projeto.',
      };
    }

    loginEmCursoRef.current = true;
    setEstaCarregando(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

      if (error || !data.user) {
        return {
          sucesso: false,
          mensagem: traduzirErroAuthSupabase(error?.message, error?.code),
        };
      }

      const resultadoPerfil = await carregarPerfil(data.user);
      return resultadoPerfil;
    } catch (err) {
      return {
        sucesso: false,
        mensagem:
          err instanceof Error
            ? traduzirErroAuthSupabase(err.message)
            : 'Erro ao conectar com o Supabase.',
      };
    } finally {
      loginEmCursoRef.current = false;
      setEstaCarregando(false);
    }
  };

  const logout = () => {
    limparSessao();
    if (supabase) {
      void supabase.auth.signOut();
    }
  };

  const convidarUsuario = async (dados: {
    nome: string;
    email: string;
    perfil: PerfilUsuario;
    redirectTo: string;
  }) => {
    if (!supabase) {
      return {
        sucesso: false,
        mensagem: supabaseConfigWarning || 'Supabase não configurado no ambiente do projeto.',
      };
    }

    if (usuarioAtual?.perfil !== 'coordenador') {
      return { sucesso: false, mensagem: 'Apenas coordenadores podem convidar membros.' };
    }
    const { error } = await supabase.functions.invoke('create-user', { body: dados });
    if (error) {
      const response = error.context;
      if (response instanceof Response) {
        try {
          const payload = (await response.clone().json()) as { message?: unknown };
          if (typeof payload.message === 'string') return { sucesso: false, mensagem: payload.message };
        } catch {
          // Mantém a mensagem genérica quando a resposta não contém JSON utilizável.
        }
      }
      return {
        sucesso: false,
        mensagem: 'Não foi possível enviar o convite. Verifique os dados e tente novamente.',
      };
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await carregarPerfil(user);
    return { sucesso: true };
  };

  const definirSenha = async (senha: string) => {
    if (!supabase) {
      return {
        sucesso: false,
        mensagem: supabaseConfigWarning || 'Supabase não configurado no ambiente do projeto.',
      };
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return {
        sucesso: false,
        mensagem: 'O convite não foi validado. Solicite um novo link à coordenação.',
      };
    }

    const { data, error } = await supabase.auth.updateUser({
      password: senha,
      data: { ...user.user_metadata, must_set_password: false },
    });
    if (error || !data.user) {
      return { sucesso: false, mensagem: 'Não foi possível salvar a senha. Tente novamente.' };
    }

    await carregarPerfil(data.user);
    return { sucesso: true };
  };

  const alternarStatusUsuario = async (id: string) => {
    if (!supabase) {
      return {
        sucesso: false,
        mensagem: supabaseConfigWarning || 'Supabase não configurado no ambiente do projeto.',
      };
    }

    const target = usuarios.find((user) => user.id === id);
    if (!target || id === usuarioAtual?.id) {
      return { sucesso: false, mensagem: 'Não é possível alterar este usuário.' };
    }
    const { error } = await supabase.from('profiles').update({ ativo: !target.ativo }).eq('id', id);
    if (error) {
      return { sucesso: false, mensagem: 'Não foi possível atualizar o acesso deste usuário.' };
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await carregarPerfil(user);
    return { sucesso: true };
  };

  return (
    <AuthContext.Provider
      value={{
        usuarioAtual,
        usuarios,
        verificandoSessao,
        estaCarregando,
        precisaDefinirSenha,
        supabaseConfigurado: isSupabaseConfigured,
        login,
        logout,
        convidarUsuario,
        definirSenha,
        alternarStatusUsuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
};
