import React, { useState } from 'react';
import { Lock, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

interface SetPasswordScreenProps {
  onSubmit: (password: string) => Promise<{ sucesso: boolean; mensagem?: string }>;
}

export const SetPasswordScreen: React.FC<SetPasswordScreenProps> = ({ onSubmit }) => {
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErro(null);

    if (senha.length < 8) {
      setErro('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (senha !== confirmacao) {
      setErro('As senhas não coincidem.');
      return;
    }

    setEnviando(true);
    const resultado = await onSubmit(senha);
    if (!resultado.sucesso) {
      setErro(resultado.mensagem || 'Não foi possível salvar a senha.');
      setEnviando(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-[#eaf4f3] via-[#dcebe8] to-[#d3e5e2] px-4 py-8 text-zinc-900 font-sans">
      <div className="pointer-events-none fixed -top-20 -left-20 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-20 -right-20 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
      <section className="relative z-10 w-full max-w-sm rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_16px_50px_rgba(0,0,0,0.08)] backdrop-blur-xl" aria-labelledby="set-password-title">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-700 text-white">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 id="set-password-title" className="text-xl font-black tracking-tight">Defina sua senha</h1>
        <p className="mt-1 text-sm text-zinc-600">Seu convite foi validado. Crie uma senha exclusiva para acessar o sistema.</p>

        {erro && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5" aria-busy={enviando}>
          <div>
            <label htmlFor="invite-password" className="mb-1 block text-sm font-semibold text-zinc-700">Nova senha</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
              <input
                id="invite-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                className="min-h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-10 pr-3 text-sm text-zinc-900 shadow-xs transition focus:border-[#007a87] focus:outline-none focus:ring-2 focus:ring-[#007a87]/20"
              />
            </div>
            <p className="mt-1 text-xs text-zinc-500">Use pelo menos 8 caracteres.</p>
          </div>

          <div>
            <label htmlFor="invite-password-confirm" className="mb-1 block text-sm font-semibold text-zinc-700">Confirme a nova senha</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
              <input
                id="invite-password-confirm"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirmacao}
                onChange={(event) => setConfirmacao(event.target.value)}
                className="min-h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-10 pr-3 text-sm text-zinc-900 shadow-xs transition focus:border-[#007a87] focus:outline-none focus:ring-2 focus:ring-[#007a87]/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#007a87] to-[#0d9488] text-sm font-bold text-white shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>{enviando ? 'Salvando senha...' : 'Salvar e entrar'}</span>
            {!enviando && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </button>
        </form>
      </section>
    </main>
  );
};
