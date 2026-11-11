import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

export const AuthCallbackScreen: React.FC = () => {
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let active = true;

    const concluirAutenticacao = async () => {
      const code = new URLSearchParams(window.location.search).get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          window.location.replace('/');
          return;
        }
      }

      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (!error && data.session) {
        window.location.replace('/');
        return;
      }
      setErro(true);
    };

    void concluirAutenticacao();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eaf4f3] px-4 text-center font-sans text-zinc-900" aria-live="polite">
      {erro ? (
        <div className="max-w-sm rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl">
          <h1 className="text-lg font-black">Não foi possível validar o convite</h1>
          <p className="mt-2 text-sm text-zinc-600">O link pode ter expirado ou já ter sido usado. Peça à coordenação para enviar um novo convite.</p>
          <a href="/" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-4 text-sm font-bold text-white">Voltar ao acesso</a>
        </div>
      ) : (
        <p className="text-sm font-semibold text-[#007a87]">Validando seu convite...</p>
      )}
    </main>
  );
};
