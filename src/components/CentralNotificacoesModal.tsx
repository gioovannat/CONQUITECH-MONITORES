import React, { useState } from 'react';
import {
  X,
  Bell,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  Play,
  Calendar,
  Sparkles,
  Shield,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { AtividadeCongresso } from '../data/atividadesData';
import { DIAS_CONGRESSO } from '../rules';

interface CentralNotificacoesModalProps {
  onNavegarParaRegistrar?: () => void;
}

export const CentralNotificacoesModal: React.FC<CentralNotificacoesModalProps> = ({
  onNavegarParaRegistrar,
}) => {
  const {
    modalCentralAberto,
    setModalCentralAberto,
    atividades,
    notificacoes,
    permissoesNotificacao,
    somHabilitado,
    setSomHabilitado,
    solicitarPermissao,
    simularAberturaAtividade,
    alternarStatusAtividade,
    irParaRegistroAtividade,
    limparTodasNotificacoes,
  } = useNotification();

  const { usuarioAtual } = useAuth();
  const ehCoordenador = usuarioAtual?.perfil === 'coordenador';

  const [abaInterna, setAbaInterna] = useState<'agenda' | 'historico'>('agenda');
  const [filtroTurno, setFiltroTurno] = useState<'TODOS' | 'MANHA' | 'TARDE'>('TODOS');

  if (!modalCentralAberto) return null;

  const handleIrParaRegistro = (atv: AtividadeCongresso) => {
    irParaRegistroAtividade(atv);
    if (onNavegarParaRegistrar) {
      onNavegarParaRegistrar();
    }
  };

  const atividadesFiltradas = atividades.filter((a) => {
    if (filtroTurno === 'MANHA' && a.turno !== 'MANHA') return false;
    if (filtroTurno === 'TARDE' && a.turno !== 'TARDE') return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md max-h-[92vh] rounded-[32px] bg-white/95 shadow-[0_16px_50px_rgba(0,0,0,0.25)] border border-white/80 text-zinc-900 flex flex-col overflow-hidden backdrop-blur-2xl">
        {/* Cabeçalho do Modal com Nova Logo Oficial */}
        <div className="bg-gradient-to-r from-[#007a87] to-[#0d9488] px-4 py-3.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white p-1 shadow-xs border border-teal-100 overflow-hidden">
              <img
                src="/assets/aistudio/logo_conquitech_oficial.png"
                alt="CONQUITECH-MA"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base leading-tight">
                Notificações por Atividade
              </h3>
              <p className="text-[11px] text-teal-100/90">
                Alertas de abertura de presença da Equipe D
              </p>
            </div>
          </div>

          <button
            onClick={() => setModalCentralAberto(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Configurações de Notificação (Permissão e Som) */}
        <div className="px-4 py-3 bg-teal-50/70 border-b border-teal-100/70 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            {permissoesNotificacao === 'granted' ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Navegador: Ativo
              </span>
            ) : (
              <button
                onClick={solicitarPermissao}
                className="flex items-center gap-1 text-[11px] font-bold text-[#007a87] bg-white border border-teal-300 px-2.5 py-1 rounded-full shadow-xs hover:bg-teal-50 transition active:scale-95"
              >
                <Bell className="h-3.5 w-3.5" />
                Permitir no Celular/PC
              </button>
            )}
          </div>

          <button
            onClick={() => setSomHabilitado(!somHabilitado)}
            className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-700 bg-white border border-zinc-200 px-2.5 py-1 rounded-full hover:bg-zinc-50 transition active:scale-95"
            title="Alternar som dos avisos"
          >
            {somHabilitado ? (
              <>
                <Volume2 className="h-3.5 w-3.5 text-teal-600" />
                <span>Som: Ligado</span>
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5 text-zinc-400" />
                <span>Som: Mudo</span>
              </>
            )}
          </button>
        </div>

        {/* Abas Internas: Agenda de Atividades vs Histórico de Alertas */}
        <div className="px-4 pt-3 pb-1">
          <div className="grid grid-cols-2 gap-1 bg-zinc-100 p-1 rounded-full">
            <button
              onClick={() => setAbaInterna('agenda')}
              className={`min-h-[38px] rounded-full text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                abaInterna === 'agenda'
                  ? 'bg-white text-[#007a87] shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Agenda de Atividades</span>
            </button>

            <button
              onClick={() => setAbaInterna('historico')}
              className={`min-h-[38px] rounded-full text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                abaInterna === 'historico'
                  ? 'bg-white text-[#007a87] shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Bell className="h-3.5 w-3.5" />
              <span>Histórico ({notificacoes.length})</span>
            </button>
          </div>
        </div>

        {/* Conteúdo com rolagem suave */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {abaInterna === 'agenda' ? (
            <>
              {/* Filtro de turno */}
              <div className="flex items-center justify-between gap-1 pb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Filtrar Atividades:
                </span>
                <div className="flex gap-1">
                  {(['TODOS', 'MANHA', 'TARDE'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setFiltroTurno(t)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold transition-all ${
                        filtroTurno === t
                          ? 'bg-[#007a87] text-white shadow-xs'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      {t === 'TODOS' ? 'Todas' : t === 'MANHA' ? 'Manhã' : 'Tarde'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista de Atividades do Congresso */}
              {atividadesFiltradas.map((atv) => {
                const diaInfo = DIAS_CONGRESSO[atv.dia];
                return (
                  <div
                    key={atv.id}
                    className={`rounded-[24px] p-3.5 border transition-all ${
                      atv.abertoParaRegistro
                        ? 'bg-emerald-50/80 border-emerald-300 shadow-xs'
                        : 'bg-white border-zinc-200/80 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                              atv.abertoParaRegistro
                                ? 'bg-emerald-500 text-white'
                                : 'bg-zinc-100 text-zinc-600'
                            }`}
                          >
                            {atv.abertoParaRegistro ? '● Registro Aberto' : 'Programado'}
                          </span>

                          <span className="text-[10px] font-extrabold text-[#007a87]">
                            {diaInfo.diaSemana} ({diaInfo.diaMes})
                          </span>

                          <span className="text-[10px] font-semibold text-zinc-400">
                            • Turno {atv.turno === 'MANHA' ? 'Manhã' : 'Tarde'}
                          </span>
                        </div>

                        <h4 className="font-bold text-xs sm:text-sm text-zinc-900 mt-1 leading-snug">
                          {atv.titulo}
                        </h4>

                        <div className="mt-1 flex items-center gap-3 text-[11px] text-zinc-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-zinc-400" />
                            {atv.horarioInicio} às {atv.horarioFim}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-zinc-400" />
                            {atv.local}
                          </span>
                        </div>

                        <p className="mt-1 text-[11px] text-zinc-500 line-clamp-1">
                          {atv.descricao}
                        </p>
                      </div>
                    </div>

                    {/* Botões de Ação por Atividade */}
                    <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
                        {atv.publicoAlvo === 'LAQI_E_MANHA'
                          ? 'Público: LAQI + Manhã'
                          : atv.publicoAlvo === 'LAQI_E_TARDE'
                          ? 'Público: LAQI + Tarde'
                          : 'Público: Todos'}
                      </span>

                      <div className="flex items-center gap-1.5 ml-auto">
                        {/* Botão de teste para simular abertura imediata */}
                        <button
                          onClick={() => simularAberturaAtividade(atv.id)}
                          className="min-h-[38px] px-3 rounded-full bg-teal-50 hover:bg-teal-100 text-[#007a87] text-[11px] font-black transition active:scale-95 flex items-center gap-1"
                          title="Simular abertura de presença e disparar alerta"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span>Disparar Alerta</span>
                        </button>

                        {/* Botão para ir direto ao registro */}
                        <button
                          onClick={() => handleIrParaRegistro(atv)}
                          className={`min-h-[38px] px-3.5 rounded-full text-[11px] font-black transition active:scale-95 flex items-center gap-1 shadow-xs ${
                            atv.abertoParaRegistro
                              ? 'bg-gradient-to-r from-[#007a87] to-[#0d9488] text-white hover:opacity-95'
                              : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                          }`}
                        >
                          <span>Registrar</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <>
              {/* Histórico de Alertas Disparados */}
              <div className="flex items-center justify-between pb-1">
                <span className="text-[11px] font-bold text-zinc-500">
                  {notificacoes.length} alertas registrados localmente
                </span>
                {notificacoes.length > 0 && (
                  <button
                    onClick={limparTodasNotificacoes}
                    className="text-[11px] font-bold text-red-600 hover:text-red-700"
                  >
                    Limpar Histórico
                  </button>
                )}
              </div>

              {notificacoes.length === 0 ? (
                <div className="p-8 text-center rounded-[24px] border border-dashed border-zinc-200">
                  <Bell className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-zinc-600">Nenhuma notificação recebida ainda.</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Quando o horário de registro de uma atividade for aberto, os alertas aparecerão aqui.
                  </p>
                </div>
              ) : (
                notificacoes.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-[22px] p-3 border border-zinc-200 bg-white shadow-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-extrabold text-[#007a87] uppercase">
                        {n.turno === 'MANHA' ? 'Turno Manhã' : 'Turno Tarde'}
                      </span>
                      <span className="text-zinc-400 font-mono">{n.disparadaEm}</span>
                    </div>
                    <h5 className="font-bold text-xs text-zinc-900">{n.titulo}</h5>
                    <p className="text-[11px] text-zinc-600 leading-relaxed">{n.mensagem}</p>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="p-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
          <span>Equipe D • CONQUITECH-MA</span>
          <button
            onClick={() => setModalCentralAberto(false)}
            className="min-h-[40px] px-4 rounded-xl bg-zinc-200 font-bold text-zinc-800 hover:bg-zinc-300 active:scale-95 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
