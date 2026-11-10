import React, { useState, useMemo } from 'react';
import {
  Search,
  Check,
  AlertTriangle,
  Sun,
  Sunset,
  X,
  Users,
  History,
  UserCheck,
  Sparkles,
  Calendar,
  WifiOff,
  HelpCircle,
} from 'lucide-react';
import {
  DIAS_CONGRESSO,
  DiaIndex,
  Turno,
  Grupo,
  Monitor,
} from '../rules';
import { useApp } from '../context/AppContext';
import { UndoConfirmModal } from './UndoConfirmModal';
import { HistoricoPresencasModal } from './HistoricoPresencasModal';

import { useNotification } from '../context/NotificationContext';

export const TabRegistrar: React.FC = () => {
  const {
    monitores,
    presencas,
    diaAtivo,
    setDiaAtivo,
    turnoAtivo,
    setTurnoAtivo,
    isPresencaRegistrada,
    obterDetalhesPresenca,
    marcarPresenca,
    desmarcarPresenca,
    isOnline,
    pendentesSyncCount,
    setModalSyncAberto,
  } = useApp();

  const { atividades, setModalCentralAberto } = useNotification();

  const [filtroGrupo, setFiltroGrupo] = useState<'TODOS' | 'LAQI' | 'EXTERNO'>('TODOS');
  const [busca, setBusca] = useState('');
  const [monitorParaDesfazer, setMonitorParaDesfazer] = useState<Monitor | null>(null);
  const [mensagemTemporaria, setMensagemTemporaria] = useState<string | null>(null);
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);

  const diaConfig = DIAS_CONGRESSO[diaAtivo];
  const ehSextaTarde = diaAtivo === 4 && turnoAtivo === 'TARDE';

  const atividadeAtual = useMemo(() => {
    return atividades.find((a) => a.dia === diaAtivo && a.turno === turnoAtivo && a.abertoParaRegistro);
  }, [atividades, diaAtivo, turnoAtivo]);

  // Filtragem dos monitores
  const monitoresFiltrados = useMemo(() => {
    return monitores.filter((monitor) => {
      if (!monitor.ativo) return false;

      // Se Externo: mostrar apenas os do turno ativo
      if (monitor.grupo === 'EXTERNO' && monitor.turno !== turnoAtivo) {
        return false;
      }

      if (filtroGrupo === 'LAQI' && monitor.grupo !== 'LAQI') return false;
      if (filtroGrupo === 'EXTERNO' && monitor.grupo !== 'EXTERNO') return false;

      if (busca.trim()) {
        const termo = busca.toLowerCase();
        return monitor.nome.toLowerCase().includes(termo);
      }

      return true;
    });
  }, [monitores, turnoAtivo, filtroGrupo, busca]);

  // Contagem de presentes no turno ativo
  const { totalPresentes, totalElegiveis } = useMemo(() => {
    let presentes = 0;
    monitoresFiltrados.forEach((m) => {
      if (isPresencaRegistrada(m.id, diaAtivo, turnoAtivo)) {
        presentes++;
      }
    });
    return {
      totalPresentes: presentes,
      totalElegiveis: monitoresFiltrados.length,
    };
  }, [monitoresFiltrados, diaAtivo, turnoAtivo, isPresencaRegistrada]);

  const handleAcaoPresenca = async (monitor: Monitor) => {
    if (ehSextaTarde) {
      setMensagemTemporaria('Na tarde de sexta (04/12) não há programação. Registros bloqueados.');
      setTimeout(() => setMensagemTemporaria(null), 3000);
      return;
    }

    const estaPresente = isPresencaRegistrada(monitor.id, diaAtivo, turnoAtivo);

    if (estaPresente) {
      setMonitorParaDesfazer(monitor);
    } else {
      const res = await marcarPresenca(monitor.id, diaAtivo, turnoAtivo);
      if (!res.sucesso && res.mensagem) {
        setMensagemTemporaria(res.mensagem);
        setTimeout(() => setMensagemTemporaria(null), 3500);
      }
    }
  };

  const confirmarDesfazer = async () => {
    if (monitorParaDesfazer) {
      await desmarcarPresenca(monitorParaDesfazer.id, diaAtivo, turnoAtivo);
      setMonitorParaDesfazer(null);
    }
  };

  return (
    <div className="pb-32 pt-2 px-3 sm:px-4 max-w-md mx-auto animate-in fade-in duration-200">
      {/* 1. SELETOR DE DIAS (Chips Horizontais estilo Wellness Tracker) */}
      <div className="mb-3.5">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#007a87] dark:text-teal-400 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" /> Dia do Congresso
          </span>
          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
            {diaConfig.descricao}
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar">
          {DIAS_CONGRESSO.map((dia) => {
            const isSelecionado = dia.index === diaAtivo;
            return (
              <button
                key={dia.index}
                onClick={() => setDiaAtivo(dia.index)}
                className={`flex-1 min-w-[70px] min-h-[56px] rounded-2xl flex flex-col items-center justify-center px-2 py-1.5 transition-all active:scale-95 border ${
                  isSelecionado
                    ? 'bg-[#007a87] text-white border-teal-600 shadow-[0_8px_20px_rgba(0,122,135,0.25)] font-bold scale-[1.02]'
                    : 'bg-white/80 text-zinc-700 border-white/80 hover:bg-white dark:bg-[#162e30]/70 dark:text-zinc-300 dark:border-teal-500/15 backdrop-blur-md'
                }`}
              >
                <span className="text-xs uppercase font-black tracking-wide leading-none">
                  {dia.diaSemana}
                </span>
                <span
                  className={`text-[11px] mt-1 font-semibold ${
                    isSelecionado ? 'text-teal-100' : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {dia.diaMes}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. SELETOR DE TURNO (Pill Segmented Switch estilo anexo 2) */}
      <div className="mb-3.5">
        <div className="grid grid-cols-2 gap-1.5 bg-white/70 p-1.5 rounded-full dark:bg-[#132729]/80 backdrop-blur-xl border border-white/60 dark:border-teal-500/20 shadow-xs">
          <button
            onClick={() => setTurnoAtivo('MANHA')}
            className={`min-h-[44px] rounded-full flex items-center justify-center gap-2 font-black text-xs transition-all active:scale-98 ${
              turnoAtivo === 'MANHA'
                ? 'bg-gradient-to-r from-[#007a87] to-[#0d9488] text-white shadow-md'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Sun className={`h-4 w-4 ${turnoAtivo === 'MANHA' ? 'text-amber-300' : ''}`} />
            <span>Manhã (08h - 12h)</span>
          </button>

          <button
            onClick={() => setTurnoAtivo('TARDE')}
            className={`min-h-[44px] rounded-full flex items-center justify-center gap-2 font-black text-xs transition-all active:scale-98 ${
              turnoAtivo === 'TARDE'
                ? 'bg-gradient-to-r from-[#007a87] to-[#0d9488] text-white shadow-md'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Sunset className={`h-4 w-4 ${turnoAtivo === 'TARDE' ? 'text-orange-300' : ''}`} />
            <span>Tarde (14h - 18h)</span>
          </button>
        </div>
      </div>

      {/* AVISO DA SEXTA-FEIRA À TARDE */}
      {ehSextaTarde && (
        <div className="mb-3.5 rounded-[24px] bg-amber-500/15 p-4 border border-amber-500/30 text-amber-900 dark:bg-amber-950/40 dark:border-amber-500/30 dark:text-amber-200 flex items-start gap-3 backdrop-blur-md animate-in slide-in-from-top-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="text-xs leading-relaxed">
            <strong className="block font-black text-sm mb-0.5">Sem Programação na Tarde de Sexta</strong>
            O congresso encerra as atividades ao meio-dia da sexta-feira (04/12). Registros de presença bloqueados conforme as normas oficiais do evento.
          </div>
        </div>
      )}

      {/* MENSAGEM TEMPORÁRIA / TOAST */}
      {mensagemTemporaria && (
        <div className="mb-3 rounded-2xl bg-red-600 p-3 text-xs font-bold text-white shadow-lg flex items-center justify-between animate-in fade-in">
          <span>{mensagemTemporaria}</span>
          <button onClick={() => setMensagemTemporaria(null)} className="ml-2 font-black text-sm">✕</button>
        </div>
      )}

      {/* 3. BARRA DE BUSCA EM PÁPSULA (Estilo Activity Tracker) */}
      <div className="space-y-2 mb-3.5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar monitor por nome..."
            className="w-full min-h-[48px] rounded-full border border-white/70 bg-white/80 pl-11 pr-10 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:border-[#007a87] focus:ring-2 focus:ring-[#007a87]/20 focus:outline-none dark:border-teal-500/20 dark:bg-[#162e30]/80 dark:text-zinc-100 dark:placeholder-zinc-500 shadow-[0_4px_20px_rgb(0,0,0,0.03)] backdrop-blur-xl transition"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filtros de Grupo em Pills Arredondadas */}
        <div className="flex gap-1.5">
          {(['TODOS', 'LAQI', 'EXTERNO'] as const).map((grupo) => (
            <button
              key={grupo}
              onClick={() => setFiltroGrupo(grupo)}
              className={`flex-1 min-h-[38px] rounded-full text-xs font-black transition-all active:scale-95 ${
                filtroGrupo === grupo
                  ? 'bg-[#007a87] text-white shadow-sm'
                  : 'bg-white/70 text-zinc-600 border border-white/70 hover:bg-white dark:bg-[#162e30]/60 dark:text-zinc-400 dark:border-teal-500/15'
              }`}
            >
              {grupo === 'TODOS' ? 'Todos' : grupo === 'LAQI' ? 'LAQI (41)' : `Externos (${turnoAtivo === 'MANHA' ? 'Manhã' : 'Tarde'})`}
            </button>
          ))}
        </div>
      </div>

      {/* 4. CARD DE STATS EM DESTAQUE (Inspirado em "Today's stats" do anexo) */}
      <div className="mb-3.5 rounded-[28px] bg-white/80 dark:bg-[#162e30]/80 backdrop-blur-xl p-4 border border-white/70 dark:border-teal-500/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/15 text-[#007a87] dark:text-teal-300 dark:bg-teal-400/20">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                Frequência no Turno
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-zinc-900 dark:text-white leading-none">
                  {totalPresentes}
                </span>
                <span className="text-xs font-bold text-zinc-400">/ {totalElegiveis} esperados</span>
              </div>
            </div>
          </div>

          {/* Botão de Histórico e Auditoria dos Coordenadores */}
          <button
            type="button"
            onClick={() => setModalHistoricoAberto(true)}
            className="flex items-center gap-1.5 rounded-full bg-[#007a87] hover:bg-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm active:scale-95 transition"
            title="Ver histórico de coordenadores para evitar duplicidades"
          >
            <History className="h-3.5 w-3.5" />
            <span>Histórico ({presencas.length})</span>
          </button>
        </div>

        {/* Indicador de Persistência Offline / Fila de Sincronização */}
        {(!isOnline || pendentesSyncCount > 0) && (
          <button
            type="button"
            onClick={() => setModalSyncAberto(true)}
            className="mt-3 w-full flex items-center justify-between px-3 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold hover:bg-amber-100 transition active:scale-[0.99] text-left"
          >
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                {!isOnline ? 'Modo Offline: ' : 'Sincronização pendente: '}
                <strong className="font-bold">Gravando localmente</strong> (IndexedDB)
              </span>
            </div>
            <span className="shrink-0 bg-amber-200 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full">
              {pendentesSyncCount} {pendentesSyncCount === 1 ? 'pendente' : 'pendentes'}
            </span>
          </button>
        )}
      </div>
      {atividadeAtual && (
        <div className="mb-3.5 rounded-[26px] bg-gradient-to-r from-teal-50 to-emerald-50 p-3.5 border border-teal-200/90 shadow-xs flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#007a87] text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Atividade Aberta
                </span>
                <span className="text-[10px] font-bold text-zinc-500">
                  {atividadeAtual.horarioInicio} às {atividadeAtual.horarioFim}
                </span>
              </div>
              <h4 className="text-xs font-black text-zinc-900 truncate mt-0.5">
                {atividadeAtual.titulo}
              </h4>
            </div>
          </div>
          <button
            onClick={() => setModalCentralAberto(true)}
            className="px-2.5 py-1.5 rounded-full bg-white border border-teal-200 text-[#007a87] text-[11px] font-extrabold hover:bg-teal-50 shrink-0 active:scale-95 transition shadow-xs"
          >
            Ver Agenda
          </button>
        </div>
      )}

      {/* 5. LISTA DE CARDS DE MONITORES (Estilo "Today's workout") */}
      <div className="space-y-3">
        {monitoresFiltrados.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-800 bg-white/40 dark:bg-[#162e30]/40">
            <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
              Nenhum monitor encontrado.
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Verifique os filtros selecionados ou o termo de busca.
            </p>
          </div>
        ) : (
          monitoresFiltrados.map((monitor) => {
            const presente = isPresencaRegistrada(monitor.id, diaAtivo, turnoAtivo);
            const detalhesPresenca = presente ? obterDetalhesPresenca(monitor.id, diaAtivo, turnoAtivo) : undefined;
            const horaStr = detalhesPresenca?.timestamp
              ? new Date(detalhesPresenca.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
              : null;

            return (
              <div
                key={monitor.id}
                className={`rounded-[26px] p-4 transition-all border shadow-[0_6px_24px_rgba(0,0,0,0.03)] backdrop-blur-xl ${
                  presente
                    ? 'bg-emerald-50/80 border-emerald-300/80 dark:bg-emerald-950/25 dark:border-emerald-800/60'
                    : 'bg-white/80 border-white/70 dark:bg-[#162e30]/75 dark:border-teal-500/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                      {monitor.nome}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                          monitor.grupo === 'LAQI'
                            ? 'bg-teal-100 text-[#007a87] dark:bg-teal-950 dark:text-teal-300'
                            : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                        }`}
                      >
                        {monitor.grupo}
                      </span>
                      {monitor.turno && (
                        <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                          Turno {monitor.turno === 'MANHA' ? 'Manhã' : 'Tarde'}
                        </span>
                      )}
                    </div>
                  </div>

                  {presente && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-black text-white shrink-0 shadow-xs">
                      <Check className="h-3 w-3 stroke-[3]" /> Marcado
                    </span>
                  )}
                </div>

                {/* Tag de Auditoria com o Nome do Coordenador para evitar duplicidades */}
                {presente && detalhesPresenca && (
                  <div className="mb-3 flex items-center gap-1.5 rounded-2xl bg-emerald-100/80 px-3 py-1.5 text-[11px] text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-200 border border-emerald-300/50 dark:border-emerald-800/40">
                    <UserCheck className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                    <div className="min-w-0 flex-1 truncate">
                      <span>Registrado por: </span>
                      <strong className="font-black">{detalhesPresenca.registradoPorNome || 'Coordenação'}</strong>
                      {horaStr && (
                        <span className="text-[10px] text-emerald-800 dark:text-emerald-400 ml-1 font-mono">
                          ({horaStr})
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* BOTÃO GRANDE (Mínimo 48px de altura, otimizado para toque com uma mão) */}
                <button
                  type="button"
                  disabled={ehSextaTarde}
                  onClick={() => handleAcaoPresenca(monitor)}
                  className={`w-full min-h-[48px] rounded-2xl flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-98 shadow-sm ${
                    ehSextaTarde
                      ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-600'
                      : presente
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-500/20'
                      : 'bg-gradient-to-r from-[#007a87] to-[#0d9488] text-white hover:opacity-95 active:scale-98 shadow-teal-700/20'
                  }`}
                  aria-label={`${presente ? 'Desfazer presença' : 'Marcar presença'} para ${monitor.nome}`}
                >
                  {ehSextaTarde ? (
                    <span>Sem Programação</span>
                  ) : presente ? (
                    <>
                      <Check className="h-5 w-5 stroke-[3]" />
                      <span>✓ Presente (Toque p/ desfazer)</span>
                    </>
                  ) : (
                    <span>Marcar Presença</span>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Confirmação para Desfazer Presença */}
      <UndoConfirmModal
        monitor={monitorParaDesfazer}
        dia={diaAtivo}
        turno={turnoAtivo}
        presenca={
          monitorParaDesfazer
            ? obterDetalhesPresenca(monitorParaDesfazer.id, diaAtivo, turnoAtivo)
            : undefined
        }
        onConfirmar={confirmarDesfazer}
        onCancelar={() => setMonitorParaDesfazer(null)}
      />

      {/* Modal de Histórico Completo de Auditoria */}
      <HistoricoPresencasModal
        aberto={modalHistoricoAberto}
        onFechar={() => setModalHistoricoAberto(false)}
      />
    </div>
  );
};
