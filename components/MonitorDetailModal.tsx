import React from 'react';
import { X, Check, Minus, AlertCircle, Calendar, Award, Clock } from 'lucide-react';
import { Monitor, DiaIndex, Turno, DIAS_CONGRESSO, calcularAptidao } from '../rules';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

interface MonitorDetailModalProps {
  monitor: Monitor | null;
  onFechar: () => void;
}

export const MonitorDetailModal: React.FC<MonitorDetailModalProps> = ({ monitor, onFechar }) => {
  const { presencas, isPresencaRegistrada, marcarPresenca, desmarcarPresenca } = useApp();
  const { usuarioAtual } = useAuth();
  const ehCoordenador = usuarioAtual?.perfil === 'coordenador';

  if (!monitor) return null;

  const resultado = calcularAptidao(monitor, presencas);
  const turnos: Turno[] = ['MANHA', 'TARDE'];

  const handleToggleGrade = async (dia: DiaIndex, turno: Turno) => {
    if (!ehCoordenador) return;
    if (dia === 4 && turno === 'TARDE') return;

    const estaPresente = isPresencaRegistrada(monitor.id, dia, turno);
    if (estaPresente) {
      await desmarcarPresenca(monitor.id, dia, turno);
    } else {
      await marcarPresenca(monitor.id, dia, turno);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="w-full max-w-md rounded-[32px] bg-white/95 dark:bg-[#162e30]/95 shadow-[0_16px_50px_rgba(0,0,0,0.25)] border border-white/80 dark:border-teal-500/25 text-zinc-900 dark:text-zinc-100 overflow-hidden my-auto backdrop-blur-2xl">
        {/* Cabeçalho do Modal */}
        <div className="bg-gradient-to-r from-[#007a87] to-[#0d9488] px-4 py-3.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white p-1 shadow-xs border border-teal-100 overflow-hidden">
              <img
                src="/assets/aistudio/logo_conquitech_oficial.png"
                alt="CONQUITECH-MA"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base leading-tight">Grade de Frequência</h3>
              <p className="text-[11px] text-teal-100/90">
                5 Dias × 2 Turnos do Congresso
              </p>
            </div>
          </div>
          <button
            onClick={onFechar}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Informações do Monitor */}
          <div className="flex items-start justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
            <div>
              <h4 className="text-base font-bold text-zinc-900 dark:text-white leading-snug">
                {monitor.nome}
              </h4>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="rounded-md bg-teal-100 px-2 py-0.5 font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                  {monitor.grupo}
                </span>
                {monitor.turno && (
                  <span className="rounded-md bg-sky-100 px-2 py-0.5 font-semibold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                    Turno: {monitor.turno === 'MANHA' ? 'Manhã' : 'Tarde'}
                  </span>
                )}
                {!monitor.ativo && (
                  <span className="rounded-md bg-red-100 px-2 py-0.5 font-semibold text-red-700 dark:bg-red-950 dark:text-red-400">
                    Inativo
                  </span>
                )}
              </div>
            </div>

            {/* Badge de Aptidão */}
            <div className="shrink-0 text-right">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-wide ${
                  resultado.isApto
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-500/30'
                }`}
              >
                {resultado.isApto ? '✓ APTO' : '⏳ PENDENTE'}
              </span>
              <p className="mt-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                {resultado.texto}
              </p>
            </div>
          </div>

          {/* Barra de Progresso */}
          <div>
            <div className="flex justify-between text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              <span>{resultado.detalhes}</span>
              <span>{resultado.progressoPercent}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden dark:bg-zinc-800">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  resultado.isApto ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${resultado.progressoPercent}%` }}
              />
            </div>
          </div>

          {/* Grade 5 Dias × 2 Turnos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Frequência Detalhada
              </span>
              {ehCoordenador && (
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                  Toque na célula para alternar
                </span>
              )}
            </div>

            <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-center text-xs">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700">
                    <th className="py-2.5 px-2 text-left font-bold">Dia</th>
                    <th className="py-2.5 px-2 font-bold">Manhã (08h-12h)</th>
                    <th className="py-2.5 px-2 font-bold">Tarde (14h-18h)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {DIAS_CONGRESSO.map((dia) => {
                    const presencaManha = isPresencaRegistrada(monitor.id, dia.index, 'MANHA');
                    const presencaTarde = isPresencaRegistrada(monitor.id, dia.index, 'TARDE');

                    return (
                      <tr key={dia.index} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                        {/* Coluna Dia */}
                        <td className="py-2.5 px-2.5 text-left font-medium text-zinc-900 dark:text-zinc-200">
                          <span className="font-bold">{dia.diaSemana}</span>
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 ml-1">
                            {dia.diaMes}
                          </span>
                        </td>

                        {/* Turno Manhã */}
                        <td className="p-1.5">
                          <button
                            type="button"
                            disabled={!ehCoordenador}
                            onClick={() => handleToggleGrade(dia.index, 'MANHA')}
                            className={`w-full min-h-[38px] rounded-lg flex items-center justify-center font-semibold text-xs transition ${
                              presencaManha
                                ? 'bg-emerald-500 text-white shadow-xs dark:bg-emerald-600'
                                : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500'
                            } ${ehCoordenador ? 'cursor-pointer hover:opacity-90 active:scale-95' : 'cursor-default'}`}
                          >
                            {presencaManha ? (
                              <span className="flex items-center gap-1">
                                <Check className="h-3.5 w-3.5 stroke-[3]" /> Presente
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Minus className="h-3.5 w-3.5" /> Ausente
                              </span>
                            )}
                          </button>
                        </td>

                        {/* Turno Tarde */}
                        <td className="p-1.5">
                          {dia.index === 4 ? (
                            <div className="w-full min-h-[38px] rounded-lg bg-zinc-100 text-zinc-400 dark:bg-zinc-800/70 dark:text-zinc-500 flex items-center justify-center text-[10px] italic px-1">
                              Sem programação
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={!ehCoordenador}
                              onClick={() => handleToggleGrade(dia.index, 'TARDE')}
                              className={`w-full min-h-[38px] rounded-lg flex items-center justify-center font-semibold text-xs transition ${
                                presencaTarde
                                  ? 'bg-emerald-500 text-white shadow-xs dark:bg-emerald-600'
                                  : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500'
                              } ${ehCoordenador ? 'cursor-pointer hover:opacity-90 active:scale-95' : 'cursor-default'}`}
                            >
                              {presencaTarde ? (
                                <span className="flex items-center gap-1">
                                  <Check className="h-3.5 w-3.5 stroke-[3]" /> Presente
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Minus className="h-3.5 w-3.5" /> Ausente
                                </span>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Histórico dos Coordenadores que Registraram este Monitor */}
          {presencas.filter((p) => p.monitorId === monitor.id).length > 0 && (
            <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-200 dark:bg-zinc-850 dark:border-zinc-800 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-2">
                Responsáveis pelos Registros deste Monitor:
              </span>
              <div className="space-y-1.5">
                {presencas
                  .filter((p) => p.monitorId === monitor.id)
                  .sort((a, b) => a.dia - b.dia)
                  .map((p) => {
                    const diaConfig = DIAS_CONGRESSO[p.dia];
                    const horaStr = new Date(p.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 border border-zinc-200/70 dark:bg-zinc-900 dark:border-zinc-800 text-[11px]"
                      >
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {diaConfig?.diaSemana} • {p.turno === 'MANHA' ? 'Manhã' : 'Tarde'}
                        </span>
                        <span className="text-teal-700 dark:text-teal-400 font-medium">
                          Registrado por: <strong>{p.registradoPorNome || 'Coordenação'}</strong> às {horaStr}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Regra Aplicada */}
          <div className="rounded-xl bg-teal-50 p-3 text-xs text-teal-900 dark:bg-zinc-800/80 dark:text-zinc-300 border border-teal-200/60 dark:border-zinc-700">
            <p className="font-semibold text-teal-950 dark:text-teal-300">
              Criterio de Certificação Aplicado:
            </p>
            <p className="mt-0.5 leading-relaxed">
              {monitor.grupo === 'LAQI'
                ? 'Membro LAQI: Apto com presença em pelo menos 4 dos 5 dias (computado presença na manhã OU tarde).'
                : monitor.turno === 'MANHA'
                ? 'Monitor Externo (Manhã): Apto com presença em todos os 5 dias exigidos (segunda a sexta).'
                : 'Monitor Externo (Tarde): Apto com presença em todos os 4 dias exigidos (segunda a quinta, pois sexta não há atividades à tarde).'}
            </p>
          </div>

          {/* Botão Fechar */}
          <button
            onClick={onFechar}
            className="w-full min-h-[48px] rounded-xl bg-zinc-800 font-semibold text-white hover:bg-zinc-700 active:scale-98 transition dark:bg-zinc-700 dark:hover:bg-zinc-600"
          >
            Fechar Grade
          </button>
        </div>
      </div>
    </div>
  );
};
