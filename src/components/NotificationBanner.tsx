import React from 'react';
import { Bell, ArrowRight, X, Clock, MapPin, Sparkles } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { DIAS_CONGRESSO } from '../rules';

interface NotificationBannerProps {
  onNavegarParaRegistrar?: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({ onNavegarParaRegistrar }) => {
  const { notificacaoAtiva, fecharNotificacaoAtiva, irParaRegistroAtividade } = useNotification();

  if (!notificacaoAtiva) return null;

  const diaInfo = DIAS_CONGRESSO[notificacaoAtiva.dia];

  const handleRegistrar = () => {
    irParaRegistroAtividade(notificacaoAtiva);
    if (onNavegarParaRegistrar) {
      onNavegarParaRegistrar();
    }
  };

  return (
    <div className="fixed top-3 left-0 right-0 z-50 px-3 sm:px-4 pointer-events-none animate-in slide-in-from-top-3 duration-300">
      <div className="mx-auto max-w-md pointer-events-auto">
        <div className="rounded-[28px] bg-white/95 p-4 shadow-[0_16px_40px_rgba(0,122,135,0.22)] border border-teal-500/30 backdrop-blur-2xl text-zinc-900 transition-all">
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#007a87] to-[#10b981] text-white shadow-md animate-pulse">
                <Bell className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="rounded-full bg-emerald-500/15 text-emerald-800 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                    Registro Aberto
                  </span>
                  <span className="text-[11px] font-bold text-zinc-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {diaInfo.diaSemana} ({notificacaoAtiva.turno === 'MANHA' ? 'Manhã' : 'Tarde'})
                  </span>
                </div>

                <h4 className="font-black text-sm text-zinc-900 leading-snug mt-1 truncate">
                  {notificacaoAtiva.titulo.replace('Registro Aberto: ', '')}
                </h4>

                <p className="text-xs text-zinc-600 line-clamp-2 mt-0.5 leading-relaxed">
                  {notificacaoAtiva.mensagem}
                </p>
              </div>
            </div>

            <button
              onClick={fecharNotificacaoAtiva}
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition shrink-0"
              aria-label="Fechar notificação"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Botão de Ação Tátil - Altura Confortável de Toque */}
          <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center gap-2">
            <button
              onClick={handleRegistrar}
              className="flex-1 min-h-[48px] rounded-2xl bg-gradient-to-r from-[#007a87] to-[#0d9488] text-white font-bold text-xs sm:text-sm hover:opacity-95 active:scale-98 transition flex items-center justify-center gap-2 shadow-md"
            >
              <span>Registrar Presença Agora</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={fecharNotificacaoAtiva}
              className="min-h-[48px] px-4 rounded-2xl bg-zinc-100 text-zinc-700 text-xs font-bold hover:bg-zinc-200 transition active:scale-95"
            >
              Depois
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
