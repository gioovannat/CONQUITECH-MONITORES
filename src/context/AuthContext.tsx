import React, { createContext, useContext, useState, useEffect } from 'react';

export type PerfilUsuario = 'coordenador' | 'equipe';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  criadoEm: number;
  senha?: string;
}

interface AuthContextType {
  usuarioAtual: Usuario | null;
  usuarios: Usuario[];
  estaCarregando: boolean;
  login: (email: string, senha: string) => Promise<{ sucesso: boolean; mensagem?: string }>;
  logout: () => void;
  criarUsuario: (dados: { nome: string; email: string; perfil: PerfilUsuario; senha?: string }) => Promise<{ sucesso: boolean; mensagem?: string }>;
  alternarStatusUsuario: (id: string) => Promise<{ sucesso: boolean; mensagem?: string }>;
}

const USUARIOS_INICIAIS: Usuario[] = [
  {
    id: 'user_coord_01',
    nome: 'Coordenação Geral - Equipe D',
    email: 'coordenacao@conquitech.ufma.br',
    perfil: 'coordenador',
    ativo: true,
    criadoEm: Date.now() - 86400000,
    senha: 'conquitech2026',
  },
  {
    id: 'user_equipe_01',
    nome: 'Monitor Validador - Equipe D',
    email: 'equiped@conquitech.ufma.br',
    perfil: 'equipe',
    ativo: true,
    criadoEm: Date.now() - 43200000,
    senha: 'equiped2026',
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>(() => {
    try {
      const salvo = localStorage.getItem('conquitech_usuarios');
      if (salvo) {
        const parsed = JSON.parse(salvo);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return USUARIOS_INICIAIS;
  });

  const [usuarioAtual, setUsuarioAtual] = useState<Usuario | null>(() => {
    try {
      const salvo = localStorage.getItem('conquitech_usuario_logado');
      if (salvo) return JSON.parse(salvo);
    } catch {
      // fallback
    }
    // Inicialmente inicia com o coordenador para facilitar o primeiro acesso imediato
    return USUARIOS_INICIAIS[0];
  });

  const [estaCarregando, setEstaCarregando] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('conquitech_usuarios', JSON.stringify(usuarios));
    } catch {
      // localstorage quota guard
    }
  }, [usuarios]);

  useEffect(() => {
    try {
      if (usuarioAtual) {
        localStorage.setItem('conquitech_usuario_logado', JSON.stringify(usuarioAtual));
      } else {
        localStorage.removeItem('conquitech_usuario_logado');
      }
    } catch {
      // ignore
    }
  }, [usuarioAtual]);

  const login = async (email: string, senha: string): Promise<{ sucesso: boolean; mensagem?: string }> => {
    setEstaCarregando(true);
    await new Promise((r) => setTimeout(r, 400)); // Pequeno delay realista

    const cleanEmail = email.trim().toLowerCase();
    const usuario = usuarios.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!usuario) {
      setEstaCarregando(false);
      return { sucesso: false, mensagem: 'Usuário não encontrado. Apenas a coordenação pode cadastrar novos membros.' };
    }

    if (!usuario.ativo) {
      setEstaCarregando(false);
      return { sucesso: false, mensagem: 'Esta conta foi desativada pela coordenação. Entre em contato com a equipe.' };
    }

    if (usuario.senha && usuario.senha !== senha) {
      setEstaCarregando(false);
      return { sucesso: false, mensagem: 'Senha incorreta. Tente novamente.' };
    }

    setUsuarioAtual(usuario);
    setEstaCarregando(false);
    return { sucesso: true };
  };

  const logout = () => {
    setUsuarioAtual(null);
    localStorage.removeItem('conquitech_usuario_logado');
  };

  const criarUsuario = async (dados: {
    nome: string;
    email: string;
    perfil: PerfilUsuario;
    senha?: string;
  }): Promise<{ sucesso: boolean; mensagem?: string }> => {
    if (usuarioAtual?.perfil !== 'coordenador') {
      return { sucesso: false, mensagem: 'Apenas coordenadores podem cadastrar novos membros.' };
    }

    const cleanEmail = dados.email.trim().toLowerCase();
    if (!cleanEmail || !dados.nome.trim()) {
      return { sucesso: false, mensagem: 'Preencha o nome e o e-mail corretamente.' };
    }

    const existente = usuarios.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existente) {
      return { sucesso: false, mensagem: 'Já existe um usuário cadastrado com este e-mail.' };
    }

    const novo: Usuario = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      nome: dados.nome.trim(),
      email: cleanEmail,
      perfil: dados.perfil,
      ativo: true,
      criadoEm: Date.now(),
      senha: dados.senha?.trim() || 'conquitech2026',
    };

    setUsuarios((antigos) => [novo, ...antigos]);
    return { sucesso: true };
  };

  const alternarStatusUsuario = async (id: string): Promise<{ sucesso: boolean; mensagem?: string }> => {
    if (usuarioAtual?.perfil !== 'coordenador') {
      return { sucesso: false, mensagem: 'Acesso negado: apenas coordenadores podem alterar status de usuários.' };
    }

    if (id === usuarioAtual.id) {
      return { sucesso: false, mensagem: 'Você não pode desativar o seu próprio usuário logado.' };
    }

    setUsuarios((antigos) =>
      antigos.map((u) => (u.id === id ? { ...u, ativo: !u.ativo } : u))
    );
    return { sucesso: true };
  };

  return (
    <AuthContext.Provider
      value={{
        usuarioAtual,
        usuarios,
        estaCarregando,
        login,
        logout,
        criarUsuario,
        alternarStatusUsuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};
