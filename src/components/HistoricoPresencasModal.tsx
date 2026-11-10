import React, { useState, useMemo } from 'react';
import {
  X,
  History,
  Search,
  UserCheck,
  Calendar,
  Clock,
  Download,
  Shield,
  Filter,
  CheckCircle,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { DIAS_CONGRESSO, Presenca, DiaIndex, Turno } from '../rules';

interface HistoricoPresencasModalProps {
  aberto: boolean;
  onFechar: () => void;
}

export const HistoricoPresencasModal: React.FC<HistoricoPresencasModalProps> = ({
  aberto,
  onFechar,
}) => {
  const { presencas, monitores, desmarcarPresenca } = useApp();
  const { usuarioAtual } = useAuth();
  const ehCoordenador = usuarioAtual?.perfil === 'coordenador';

  const [busca, setBusca] = useState('');
  const [filtroCoordenador, setFiltroCoordenador] = useState<string>('TODOS');
  const [filtroDia, setFiltroDia] = useState<string>('TODOS');
  const [filtroTurno, setFiltroTurno] = useState<string>('TODOS');
  const [presencaParaRemover, setPresencaParaRemover] = useState<Presenca | null>(null);

  // Mapa de monitores para busca rápida de nome e grupo
  const mapaMonitores = useMemo(() => {
    const mapa = new Map<string, { nome: string; grupo: string; turno?: string }>();
    monitores.forEach((m) => {
      mapa.set(m.id, { nome: m.nome, grupo: m.grupo, turno: m.turno });
    });
    return mapa;
  }, [monitores]);

  // Lista de nomes únicos de coordenadores/operadores que registraram
  const listaResponsaveis = useMemo(() => {
    const nomes = new Set<string>();
    presencas.forEach((p) => {
      if (p.registradoPorNome) {
        nomes.add(p.registradoPorNome);
      }
    });
    return Array.from(nomes).sort();
  }, [presencas]);

  // Contagem de registros por coordenador
  const contagemPorCoordenador = useMemo(() => {
    const cont: Record<string, number> = {};
    presencas.forEach((p) => {
      const nome = p.registradoPorNome || 'Desconhecido';
      cont[nome] = (cont[nome] || 0) + 1;
    });
    return cont;
  }, [presencas]);

  // Filtragem e ordenação cronológica decrescente (mais recentes primeiro)
  const presencasFiltradas = useMemo(() => {
    return [...presencas]
      .filter((p) => {
        const monitorInfo = mapaMonitores.get(p.monitorId);
        const nomeMonitor = monitorInfo?.nome || p.monitorId;

        // Filtro por Coordenador
        if (filtroCoordenador !== 'TODOS' && p.registradoPorNome !== filtroCoordenador) {
          return false;
        }

        // Filtro por Dia
        if (filtroDia !== 'TODOS' && String(p.dia) !== filtroDia) {
          return false;
        }

        // Filtro por Turno
        if (filtroTurno !== 'TODOS' && p.turno !== filtroTurno) {
          return false;
        }

        // Busca por nome do monitor
        if (busca.trim()) {
          const termo = busca.toLowerCase();
          return (
            nomeMonitor.toLowerCase().includes(termo) ||
            (p.registradoPorNome && p.registradoPorNome.toLowerCase().includes(termo))
          );
        }

        return true;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [presencas, mapaMonitores, filtroCoordenador, filtroDia, filtroTurno, busca]);

  // Exportar histórico de auditoria em CSV
  const exportarAuditoriaCSV = () => {
    const cabecalho = [
      'Monitor',
      'Grupo',
      'Turno do Monitor',
      'Dia do Congresso',
      'Data Congresso',
      'Turno da Presença',
      'Registrado Por (Nome)',
      'Perfil do Operador',
      'Data e Hora do Registro',
      'ID do Registro',
    ];

    const linhas = presencasFiltradas.map((p) => {
      const monitor = mapaMonitores.get(p.monitorId);
      const diaConfig = DIAS_CONGRESSO[p.dia];
      const dataHora = new Date(p.timestamp).toLocaleString('pt-BR');

      return [
        `"${(monitor?.nome || p.monitorId).replace(/"/g, '""')}"`,
        monitor?.grupo || 'N/A',
        monitor?.turno || 'Integral',
        `"${diaConfig?.diaSemana || p.dia}"`,
        `"${diaConfig?.diaMes || ''}"`,
        p.turno === 'MANHA' ? 'Manhã' : 'Tarde',
        `"${(p.registradoPorNome || 'Coordenação').replace(/"/g, '""')}"`,
        p.registradoPorPerfil || 'coordenador',
        `"${dataHora}"`,
        p.id,
      ];
    });

    const csvConteudo = '\uFEFF' + [
      `"AUDITORIA DE REGISTROS DE PRESENÇA - CONQUITECH-MA 2026"`,
      `"Total de Registros: ${presencasFiltradas.length}"`,
      `"Exportado em: ${new Date().toLocaleString('pt-BR')}"`,
      '',
      cabecalho.join(';'),
      ...linhas.map((l) => l.join(';')),
    ].join('\r\n');

    const blob = new Blob([csvConteudo], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CONQUITECH_Auditoria_Presencas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmarRemocao = async () => {
    if (presencaParaRemover) {
      await desmarcarPresenca(
        presencaParaRemover.monitorId,
        presencaParaRemover.dia,
        presencaParaRemover.turno
      );
      setPresencaParaRemover(null);
    }
  };

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md max-h-[92vh] rounded-[32px] bg-white/95 dark:bg-[#162e30]/95 shadow-[0_16px_50px_rgba(0,0,0,0.25)] border border-white/80 dark:border-teal-500/25 text-zinc-900 dark:text-zinc-100 flex flex-col overflow-hidden backdrop-blur-2xl">
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
              <h3 className="font-black text-sm sm:text-base leading-tight">
                Histórico de Presenças
              </h3>
              <p className="text-[11px] text-teal-100/90">
                Auditoria de quem registrou cada monitor
              </p>
            </div>
          </div>
          <button
            onClick={onFechar}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Informação Anti-Duplicidade */}
        <div className="bg-teal-50 px-4 py-2 border-b border-teal-100 dark:bg-zinc-800/80 dark:border-zinc-800 text-[11px] text-teal-900 dark:text-zinc-300 flex items-center gap-2">
          <Shield className="h-4 w-4 text-teal-700 dark:text-teal-400 shrink-0" />
          <span>
            Identifica o coordenador responsável por cada presença para evitar registros duplicados.
          </span>
        </div>

        {/* Resumo de Registros por Coordenador */}
        <div className="px-4 pt-3 pb-1 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Registros por Coordenador:
            </span>
            <button
              onClick={exportarAuditoriaCSV}
              className="text-[11px] font-bold text-teal-700 hover:text-teal-800 dark:text-teal-400 flex items-center gap-1"
            >
              <Download className="h-3 w-3" />
              <span>Exportar CSV</span>
            </button>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
            <button
              onClick={() => setFiltroCoordenador('TODOS')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold shrink-0 transition ${
                filtroCoordenador === 'TODOS'
                  ? 'bg-teal-700 text-white dark:bg-teal-600'
                  : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200'
              }`}
            >
              Todos ({presencas.length})
            </button>
            {listaResponsaveis.map((nome) => (
              <button
                key={nome}
                onClick={() => setFiltroCoordenador(nome)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold shrink-0 transition ${
                  filtroCoordenador === nome
                    ? 'bg-teal-700 text-white dark:bg-teal-600'
                    : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200'
                }`}
              >
                {nome.split(' ')[0]}: {contagemPorCoordenador[nome] || 0}
              </button>
            ))}
          </div>
        </div>

        {/* Barra de Busca e Filtros Rápidos */}
        <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 space-y-2">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar monitor ou coordenador..."
              className="w-full min-h-[38px] rounded-xl border border-zinc-200 bg-white pl-8 pr-7 text-xs text-zinc-900 placeholder-zinc-400 focus:border-teal-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            />
            {busca && (
              <button
                onClick={() => setBusca('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtros de Dia e Turno */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <select
              value={filtroDia}
              onChange={(e) => setFiltroDia(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-800 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-200"
            >
              <option value="TODOS">Todos os dias</option>
              {DIAS_CONGRESSO.map((d) => (
                <option key={d.index} value={String(d.index)}>
                  {d.diaSemana} ({d.diaMes})
                </option>
              ))}
            </select>

            <select
              value={filtroTurno}
              onChange={(e) => setFiltroTurno(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-800 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-200"
            >
              <option value="TODOS">Todos os turnos</option>
              <option value="MANHA">Manhã (08h-12h)</option>
              <option value="TARDE">Tarde (14h-18h)</option>
            </select>
          </div>
        </div>

        {/* Lista de Registros */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {presencasFiltradas.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 text-xs">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-zinc-300 dark:text-zinc-700" />
              Nenhum registro encontrado com os filtros selecionados.
            </div>
          ) : (
            presencasFiltradas.map((p) => {
              const monitor = mapaMonitores.get(p.monitorId);
              const diaConfig = DIAS_CONGRESSO[p.dia];
              const hora = new Date(p.timestamp).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });
              const data = new Date(p.timestamp).toLocaleDateString('pt-BR');

              return (
                <div
                  key={p.id}
                  className="rounded-xl border border-zinc-200 bg-white p-3 shadow-2xs dark:bg-zinc-950 dark:border-zinc-800 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-zinc-900 dark:text-white truncate">
                          {monitor?.nome || p.monitorId}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                            monitor?.grupo === 'LAQI'
                              ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                              : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                          }`}
                        >
                          {monitor?.grupo || 'LAQI'}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                        <Calendar className="h-3 w-3 text-zinc-400" />
                        <span>
                          {diaConfig?.diaSemana} ({diaConfig?.diaMes}) • {p.turno === 'MANHA' ? 'Manhã' : 'Tarde'}
                        </span>
                      </div>
                    </div>

                    {/* Botão de exclusão para coordenador */}
                    {ehCoordenador && (
                      <button
                        onClick={() => setPresencaParaRemover(p)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600 transition dark:hover:bg-red-950/40"
                        title="Desfazer este registro"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Informação em destaque de QUEM REGISTROU */}
                  <div className="mt-2.5 flex items-center justify-between rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                    <div className="flex items-center gap-1.5 truncate">
                      <UserCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-bold truncate">
                        Registrado por: {p.registradoPorNome || 'Coordenador'}
                      </span>
                      {p.registradoPorPerfil && (
                        <span className="rounded bg-emerald-200/80 px-1 py-0.2 text-[9px] font-semibold uppercase text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200">
                          {p.registradoPorPerfil}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono shrink-0 ml-1">
                      {hora}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé */}
        <div className="bg-zinc-50 p-3 border-t border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 flex items-center justify-between text-xs">
          <span className="text-zinc-500 dark:text-zinc-400">
            Mostrando <strong>{presencasFiltradas.length}</strong> de <strong>{presencas.length}</strong> presenças
          </span>
          <button
            onClick={onFechar}
            className="rounded-xl bg-zinc-800 px-4 py-2 font-bold text-white hover:bg-zinc-700 transition dark:bg-zinc-700"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Modal de Confirmação de Remoção */}
      {presencaParaRemover && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xs rounded-2xl bg-white p-4 shadow-xl dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
            <h4 className="font-bold text-sm text-red-600 mb-1">Desfazer Presença</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-3 leading-relaxed">
              Deseja remover o registro de{' '}
              <strong>{mapaMonitores.get(presencaParaRemover.monitorId)?.nome}</strong> no dia{' '}
              <strong>{DIAS_CONGRESSO[presencaParaRemover.dia]?.diaSemana} ({presencaParaRemover.turno})</strong>?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPresencaParaRemover(null)}
                className="flex-1 min-h-[40px] rounded-lg border border-zinc-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarRemocao}
                className="flex-1 min-h-[40px] rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
