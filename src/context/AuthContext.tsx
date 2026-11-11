import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

export type PerfilUsuario = 'coordenador' | 'equipe';
export interface Usuario { id: string; nome: string; email: string; perfil: PerfilUsuario; ativo: boolean; criadoEm: number; }

interface AuthContextType {
  usuarioAtual: Usuario | null; usuarios: Usuario[]; estaCarregando: boolean;
  login: (email: string, senha: string) => Promise<{ sucesso: boolean; mensagem?: string }>;
  logout: () => void;
  criarUsuario: (dados: { nome: string; email: string; perfil: PerfilUsuario; senha: string }) => Promise<{ sucesso: boolean; mensagem?: string }>;
  alternarStatusUsuario: (id: string) => Promise<{ sucesso: boolean; mensagem?: string }>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const toUsuario = (profile: any, email = ''): Usuario => ({ id: profile.id, nome: profile.nome, email, perfil: profile.perfil, ativo: profile.ativo, criadoEm: new Date(profile.criado_em).getTime() });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuarioAtual, setUsuarioAtual] = useState<Usuario | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [estaCarregando, setEstaCarregando] = useState(true);
  const requestId = useRef(0);

  const limparSessao = () => {
    requestId.current += 1;
    setUsuarioAtual(null);
    setUsuarios([]);
    setEstaCarregando(false);
  };

  const carregarPerfil = async (user: User | null) => {
    const currentRequest = ++requestId.current;
    if (!user) {
      setUsuarioAtual(null);
      setUsuarios([]);
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
        setEstaCarregando(false);
        return;
      }

      setUsuarioAtual(toUsuario(profile, user.email));
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

  const criarUsuario = async (dados: { nome: string; email: string; perfil: PerfilUsuario; senha: string }) => {
    if (usuarioAtual?.perfil !== 'coordenador') return { sucesso: false, mensagem: 'Apenas coordenadores podem cadastrar membros.' };
    if (!dados.senha || dados.senha.length < 8) return { sucesso: false, mensagem: 'A senha deve ter pelo menos 8 caracteres.' };
    const { error } = await supabase.functions.invoke('create-user', { body: dados });
    if (error) return { sucesso: false, mensagem: 'Não foi possível cadastrar o usuário. Verifique os dados e tente novamente.' };
    const { data: { user } } = await supabase.auth.getUser();
    await carregarPerfil(user);
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

  return <AuthContext.Provider value={{ usuarioAtual, usuarios, estaCarregando, login, logout, criarUsuario, alternarStatusUsuario }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => { const context = useContext(AuthContext); if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider'); return context; };
