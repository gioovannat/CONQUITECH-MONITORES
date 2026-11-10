import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

export type PerfilUsuario = 'coordenador' | 'equipe';
export interface Usuario { id: string; nome: string; email: string; perfil: PerfilUsuario; ativo: boolean; criadoEm: number; }

interface AuthContextType {
  usuarioAtual: Usuario | null; usuarios: Usuario[]; estaCarregando: boolean;
  login: (email: string, senha: string) => Promise<{ sucesso: boolean; mensagem?: string }>;
  logout: () => void;
  criarUsuario: (dados: { nome: string; email: string; perfil: PerfilUsuario; senha?: string }) => Promise<{ sucesso: boolean; mensagem?: string }>;
  alternarStatusUsuario: (id: string) => Promise<{ sucesso: boolean; mensagem?: string }>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const toUsuario = (profile: any, email = ''): Usuario => ({ id: profile.id, nome: profile.nome, email, perfil: profile.perfil, ativo: profile.ativo, criadoEm: new Date(profile.criado_em).getTime() });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuarioAtual, setUsuarioAtual] = useState<Usuario | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [estaCarregando, setEstaCarregando] = useState(true);

  const carregarSessao = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUsuarioAtual(null); setUsuarios([]); setEstaCarregando(false); return; }
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile || !profile.ativo) { await supabase.auth.signOut(); setUsuarioAtual(null); setEstaCarregando(false); return; }
    setUsuarioAtual(toUsuario(profile, user.email));
    if (profile.perfil === 'coordenador') {
      const { data } = await supabase.from('profiles').select('*').order('criado_em', { ascending: false });
      setUsuarios((data ?? []).map((item: any) => toUsuario(item)));
    }
    setEstaCarregando(false);
  };

  useEffect(() => {
    carregarSessao();
    const { data: listener } = supabase.auth.onAuthStateChange(() => { carregarSessao(); });
    return () => listener.subscription.unsubscribe();
  }, []);

  const login = async (email: string, senha: string) => {
    setEstaCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    if (error) { setEstaCarregando(false); return { sucesso: false, mensagem: 'E-mail ou senha inválidos.' }; }
    await carregarSessao();
    return { sucesso: true };
  };
  const logout = () => { void supabase.auth.signOut(); setUsuarioAtual(null); setUsuarios([]); };
  const criarUsuario = async (dados: { nome: string; email: string; perfil: PerfilUsuario; senha?: string }) => {
    if (usuarioAtual?.perfil !== 'coordenador') return { sucesso: false, mensagem: 'Apenas coordenadores podem cadastrar membros.' };
    const { error } = await supabase.functions.invoke('create-user', { body: { ...dados, senha: dados.senha || 'conquitech2026' } });
    if (error) return { sucesso: false, mensagem: error.message };
    await carregarSessao(); return { sucesso: true };
  };
  const alternarStatusUsuario = async (id: string) => {
    const target = usuarios.find((user) => user.id === id);
    if (!target || id === usuarioAtual?.id) return { sucesso: false, mensagem: 'Não é possível alterar este usuário.' };
    const { error } = await supabase.from('profiles').update({ ativo: !target.ativo }).eq('id', id);
    if (error) return { sucesso: false, mensagem: error.message };
    await carregarSessao(); return { sucesso: true };
  };
  return <AuthContext.Provider value={{ usuarioAtual, usuarios, estaCarregando, login, logout, criarUsuario, alternarStatusUsuario }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => { const context = useContext(AuthContext); if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider'); return context; };
