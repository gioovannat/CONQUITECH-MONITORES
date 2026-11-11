import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginScreen: React.FC = () => {
  const { login, estaCarregando } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (!email.trim() || !senha.trim()) {
      setErro('Por favor, digite seu e-mail e sua senha de acesso.');
      return;
    }

    const res = await login(email, senha);
    if (!res.sucesso) {
      setErro(res.mensagem || 'Falha na autenticação.');
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#eaf4f3] via-[#dcebe8] to-[#d3e5e2] text-zinc-900 flex flex-col justify-center px-4 py-8 overflow-hidden font-sans">
      {/* Luz ambiente de fundo inspirada na estética do anexo */}
      <div className="pointer-events-none fixed -top-20 -left-20 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-20 -right-20 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />

      <div className="relative w-full max-w-sm mx-auto animate-in fade-in duration-300 z-10">
        {/* Banner com Logo Oficial do Congresso CONQUITECH-MA Centralizado */}
        <div className="mb-4 text-center">
          <div className="rounded-[28px] bg-white/95 p-4 shadow-[0_12px_40px_rgba(0,122,135,0.12)] border border-white/80 backdrop-blur-xl flex items-center justify-center">
            <img
              src="/assets/aistudio/logo_conquitech_oficial.png"
              alt="CONQUITECH-MA - I Congresso de Química, Indústria e Tecnologia do Maranhão"
              className="w-full max-h-32 object-contain mx-auto"
            />
          </div>
          <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-teal-500/15 px-3.5 py-1 text-xs font-bold text-[#007a87]">
            <span>UFMA</span>
            <span>•</span>
            <span>LAQI</span>
            <span>•</span>
            <span>Equipe D (Presença)</span>
          </div>
        </div>

        {/* Card do Formulário Frosted Glass */}
        <div className="rounded-[32px] bg-white/85 p-6 shadow-[0_16px_50px_rgba(0,0,0,0.06)] backdrop-blur-2xl border border-white/70">
          <div className="mb-4 text-center sm:text-left">
            <h2 className="text-lg font-black text-zinc-900 tracking-tight">
              Acesso à Equipe D
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Identifique-se para registrar a frequência dos monitores.
            </p>
          </div>

          {erro && (
            <div className="mb-4 rounded-2xl bg-red-50 p-3 text-xs text-red-700 border border-red-200 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{erro}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">
                E-mail Cadastrado
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="coordenacao@conquitech.ufma.br"
                  className="w-full min-h-[48px] rounded-2xl border border-zinc-200 bg-white/90 pl-10 pr-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-[#007a87] focus:ring-2 focus:ring-[#007a87]/20 focus:outline-none shadow-xs transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full min-h-[48px] rounded-2xl border border-zinc-200 bg-white/90 pl-10 pr-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-[#007a87] focus:ring-2 focus:ring-[#007a87]/20 focus:outline-none shadow-xs transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={estaCarregando}
              className="w-full min-h-[50px] rounded-2xl bg-gradient-to-r from-[#007a87] to-[#0d9488] font-bold text-white shadow-md hover:opacity-95 active:scale-98 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {estaCarregando ? (
                <span>Validando acesso...</span>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Informação sobre permissões fechadas */}
        <div className="mt-3.5 rounded-2xl bg-white/70 p-3.5 border border-white/60 text-[11px] text-zinc-600 leading-relaxed backdrop-blur-xl">
          <p className="font-bold text-[#007a87] flex items-center gap-1.5 mb-0.5">
            <Shield className="h-3.5 w-3.5 text-teal-600" /> Acesso Fechado aos Monitores
          </p>
          <p>
            O cadastro de novos usuários é restrito. Somente a coordenação da Equipe D pode criar contas de operadores através da aba Admin.
          </p>
        </div>
      </div>
    </div>
  );
};
