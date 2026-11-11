import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

export type PerfilUsuario = 'coordenador' | 'equipe';
export interface Usuario { id: string; nome: string; email: string; perfil: PerfilUsuario; ativo: boolean; criadoEm: number; }

interface AuthContextType {
  usuarioAtual: Usuario | null; usuarios: Usuario[]; estaCarregando: boolean; precisaDefinirSenha: boolean;
  login: (email: string, senha: string) => Promise<{ sucesso: boolean; mensagem?: string }>;
  logout: () => void;
  convidarUsuario: (dados: { nome: string; email: string; perfil: PerfilUsuario; redirectTo: string }) => Promise<{ sucesso: boolean; mensagem?: string }>;
  definirSenha: (senha: string) => Promise<{ sucesso: boolean; mensagem?: string }>;
  alternarStatusUsuario: (id: string) => Promise<{ sucesso: boolean; mensagem?: string }>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const toUsuario = (profile: any, email = ''): Usuario => ({ id: profile.id, nome: profile.nome, email, perfil: profile.perfil, ativo: profile.ativo, criadoEm: new Date(profile.criado_em).getTime() });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuarioAtual, setUsuarioAtual] = useState<Usuario | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [estaCarregando, setEstaCarregando] = useState(true);
  const [precisaDefinirSenha, setPrecisaDefinirSenha] = useState(false);
  const requestId = useRef(0);

  const limparSessao = () => {
    requestId.current += 1;
    setUsuarioAtual(null);
    setUsuarios([]);
    setPrecisaDefinirSenha(false);
    setEstaCarregando(false);
  };

  const carregarPerfil = async (user: User | null) => {
    const currentRequest = ++requestId.current;
    if (!user) {
      setUsuarioAtual(null);
      setUsuarios([]);
      setPrecisaDefinirSenha(false);
      setEstaCarregando(false);
      return;
    }

    setEstaCarregando(true);
    setUsuarioAtual(null);
    setUsuarios([]);
    try {
      const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (currentRequest !== requestId.current) return;

      if (error || !profile || !profile.ativo) {
        void supabase.auth.signOut();
        setUsuarioAtual(null);
        setUsuarios([]);
        setPrecisaDefinirSenha(false);
        setEstaCarregando(false);
        return;
      }

      setUsuarioAtual(toUsuario(profile, user.email));
      setPrecisaDefinirSenha(user.user_metadata?.must_set_password === true);
      if (profile.perfil === 'coordenador') {
        const { data, error: usersError } = await supabase.from('profiles').select('*').order('criado_em', { ascending: false });
        if (currentRequest !== requestId.current) return;
        if (!usersError) setUsuarios((data ?? []).map((item: any) => toUsuario(item)));
      }
    } catch {
      if (currentRequest === requestId.current) {
        void supabase.auth.signOut();
        setUsuarioAtual(null);
        setUsuarios([]);
        setPrecisaDefinirSenha(false);
      }
    } finally {
      if (currentRequest === requestId.current) setEstaCarregando(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      queueMicrotask(() => {
        if (mounted) void carregarPerfil(session?.user ?? null);
      });
    });
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted) void carregarPerfil(user);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
      requestId.current += 1;
    };
  }, []);

  const login = async (email: string, senha: string) => {
    setEstaCarregando(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    if (error || !data.user) {
      setEstaCarregando(false);
      return { sucesso: false, mensagem: 'E-mail ou senha inválidos.' };
    }
    await carregarPerfil(data.user);
    return { sucesso: true };
  };

  const logout = () => {
    limparSessao();
    void supabase.auth.signOut();
  };

  const convidarUsuario = async (dados: { nome: string; email: string; perfil: PerfilUsuario; redirectTo: string }) => {
    if (usuarioAtual?.perfil !== 'coordenador') return { sucesso: false, mensagem: 'Apenas coordenadores podem convidar membros.' };
    const { error } = await supabase.functions.invoke('create-user', { body: dados });
    if (error) {
      const response = error.context;
      if (response instanceof Response) {
        try {
          const payload = await response.clone().json() as { message?: unknown };
          if (typeof payload.message === 'string') return { sucesso: false, mensagem: payload.message };
        } catch {
          // Mantém a mensagem genérica quando a resposta não contém JSON utilizável.
        }
      }
      return { sucesso: false, mensagem: 'Não foi possível enviar o convite. Verifique os dados e tente novamente.' };
    }
    const { data: { user } } = await supabase.auth.getUser();
    await carregarPerfil(user);
    return { sucesso: true };
  };

  const definirSenha = async (senha: string) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return { sucesso: false, mensagem: 'O convite não foi validado. Solicite um novo link à coordenação.' };

    const { data, error } = await supabase.auth.updateUser({
      password: senha,
      data: { ...user.user_metadata, must_set_password: false },
    });
    if (error || !data.user) return { sucesso: false, mensagem: 'Não foi possível salvar a senha. Tente novamente.' };

    await carregarPerfil(data.user);
    return { sucesso: true };
  };

  const alternarStatusUsuario = async (id: string) => {
    const target = usuarios.find((user) => user.id === id);
    if (!target || id === usuarioAtual?.id) return { sucesso: false, mensagem: 'Não é possível alterar este usuário.' };
    const { error } = await supabase.from('profiles').update({ ativo: !target.ativo }).eq('id', id);
    if (error) return { sucesso: false, mensagem: 'Não foi possível atualizar o acesso deste usuário.' };
    const { data: { user } } = await supabase.auth.getUser();
    await carregarPerfil(user);
    return { sucesso: true };
  };

  return <AuthContext.Provider value={{ usuarioAtual, usuarios, estaCarregando, precisaDefinirSenha, login, logout, convidarUsuario, definirSenha, alternarStatusUsuario }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => { const context = useContext(AuthContext); if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider'); return context; };
