import React, { useState, useMemo } from 'react';
import {
  Award,
  Search,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Users,
  ChevronRight,
  X,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Monitor, calcularAptidao } from '../rules';
import { MonitorDetailModal } from './MonitorDetailModal';

export const TabStatus: React.FC = () => {
  const { monitores, presencas, abrirTour } = useApp();

  const [busca, setBusca] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState<'TODOS' | 'LAQI' | 'EXTERNO'>('TODOS');
  const [filtroStatus, setFiltroStatus] = useState<'TODOS' | 'APTO' | 'PENDENTE'>('TODOS');
  const [monitorSelecionado, setMonitorSelecionado] = useState<Monitor | null>(null);

  // Calcula aptidão para todos os monitores
  const monitoresComAptidao = useMemo(() => {
    return monitores.map((m) => {
      const apt = calcularAptidao(m, presencas);
      return {
        monitor: m,
        aptidao: apt,
      };
    });
  }, [monitores, presencas]);

  // Contadores gerais
  const resumo = useMemo(() => {
    const ativos = monitoresComAptidao.filter((item) => item.monitor.ativo);
    const aptos = ativos.filter((item) => item.aptidao.isApto);
    const pendentes = ativos.filter((item) => !item.aptidao.isApto);

    return {
      total: ativos.length,
      aptos: aptos.length,
      pendentes: pendentes.length,
    };
  }, [monitoresComAptidao]);

  // Filtragem da lista
  const listaFiltrada = useMemo(() => {
    return monitoresComAptidao.filter(({ monitor, aptidao }) => {
      if (!monitor.ativo) return false;

      if (filtroGrupo === 'LAQI' && monitor.grupo !== 'LAQI') return false;
      if (filtroGrupo === 'EXTERNO' && monitor.grupo !== 'EXTERNO') return false;

      if (filtroStatus === 'APTO' && !aptidao.isApto) return false;
      if (filtroStatus === 'PENDENTE' && aptidao.isApto) return false;

      if (busca.trim()) {
        const termo = busca.toLowerCase();
        return monitor.nome.toLowerCase().includes(termo);
      }

      return true;
    });
  }, [monitoresComAptidao, filtroGrupo, filtroStatus, busca]);

  // Exportar CSV completo
  const exportarCSV = () => {
    const cabecalho = ['Nome', 'Grupo', 'Turno', 'Dias Presentes', 'Dias Exigidos', 'Status', 'Critério Atendido'];
    const linhas = monitoresComAptidao
      .filter((i) => i.monitor.ativo)
      .map(({ monitor, aptidao }) => [
        `"${monitor.nome.replace(/"/g, '""')}"`,
        monitor.grupo,
        monitor.turno || 'Integral',
        aptidao.diasPresentes,
        aptidao.diasExigidos,
        aptidao.isApto ? 'APTO' : 'PENDENTE',
        `"${aptidao.detalhes.replace(/"/g, '""')}"`,
      ]);

    const csvConteudo = '\uFEFF' + [cabecalho.join(';'), ...linhas.map((l) => l.join(';'))].join('\r\n');
    const blob = new Blob([csvConteudo], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CONQUITECH_Presenca_Geral_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportar Lista de Aptos
  const exportarListaAptos = () => {
    const aptos = monitoresComAptidao.filter((i) => i.monitor.ativo && i.aptidao.isApto);
    const cabecalho = ['Nome', 'Grupo', 'Turno', 'Dias Presentes', 'Dias Exigidos', 'Certificação'];
    const linhas = aptos.map(({ monitor, aptidao }) => [
      `"${monitor.nome.replace(/"/g, '""')}"`,
      monitor.grupo,
      monitor.turno || 'Integral',
      aptidao.diasPresentes,
      aptidao.diasExigidos,
      'APTO PARA CERTIFICADO',
    ]);

    const csvConteudo = '\uFEFF' + [
      `"LISTA DE MONITORES APTOS AO CERTIFICADO - CONQUITECH-MA 2026"`,
      `"Total de Aptos: ${aptos.length} de ${resumo.total} monitores cadastrados"`,
      `"Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}"`,
      '',
      cabecalho.join(';'),
      ...linhas.map((l) => l.join(';')),
    ].join('\r\n');

    const blob = new Blob([csvConteudo], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CONQUITECH_Monitores_APTOS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="pb-32 pt-2 px-3 sm:px-4 max-w-md mx-auto animate-in fade-in duration-200">
      {/* 1. CARTÕES DE RESUMO GERAL (Estilo "Today's stats" do anexo) */}
      <div className="grid grid-cols-3 gap-2.5 mb-3.5">
        {/* Total */}
        <div className="rounded-[24px] bg-white/80 p-3.5 border border-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:bg-[#162e30]/80 dark:border-teal-500/20 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-black text-zinc-400 tracking-wider">
              Total
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-500/15 text-[#007a87] dark:text-teal-300">
              <Users className="h-3.5 w-3.5" />
            </div>
          </div>
          <span className="text-2xl font-black text-zinc-900 dark:text-white leading-none">
            {resumo.total}
          </span>
          <span className="text-[10px] text-zinc-400 mt-1 font-medium">Monitores</span>
        </div>

        {/* Aptos */}
        <div className="rounded-[24px] bg-emerald-50/80 p-3.5 border border-emerald-300/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:bg-emerald-950/30 dark:border-emerald-800/40 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-black text-emerald-700 dark:text-emerald-300 tracking-wider">
              Aptos
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <span className="text-2xl font-black text-emerald-800 dark:text-emerald-300 leading-none">
            {resumo.aptos}
          </span>
          <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400 mt-1 font-semibold">Certificado OK</span>
        </div>

        {/* Pendentes */}
        <div className="rounded-[24px] bg-amber-50/80 p-3.5 border border-amber-300/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:bg-amber-950/30 dark:border-amber-800/40 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-black text-amber-700 dark:text-amber-300 tracking-wider">
              Pendentes
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white shadow-xs">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <span className="text-2xl font-black text-amber-800 dark:text-amber-300 leading-none">
            {resumo.pendentes}
          </span>
          <span className="text-[10px] text-amber-700/80 dark:text-amber-400 mt-1 font-semibold">Em andamento</span>
        </div>
      </div>

      {/* 2. BOTÕES DE EXPORTAÇÃO EM PILLS FLUTUANTES */}
      <div className="grid grid-cols-2 gap-2 mb-3.5">
        <button
          onClick={exportarCSV}
          className="min-h-[46px] rounded-full bg-white/80 border border-teal-600/40 text-[#007a87] hover:bg-white active:scale-98 transition flex items-center justify-center gap-2 text-xs font-black shadow-xs dark:bg-[#162e30]/80 dark:text-teal-300 dark:border-teal-500/30"
          title="Baixar planilha completa compatível com Excel"
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Exportar CSV</span>
        </button>

        <button
          onClick={exportarListaAptos}
          className="min-h-[46px] rounded-full bg-gradient-to-r from-[#007a87] to-[#0d9488] text-white hover:opacity-95 active:scale-98 transition flex items-center justify-center gap-2 text-xs font-black shadow-md"
          title="Exportar apenas quem atingiu a meta de certificação"
        >
          <Download className="h-4 w-4" />
          <span>Lista de Aptos</span>
        </button>
      </div>

      {/* Dica de Regras e Acesso ao Tour */}
      <div className="mb-2.5 flex items-center justify-between px-1">
        <span className="text-[11px] font-bold text-zinc-500">
          Critérios de Certificação
        </span>
        <button
          type="button"
          onClick={abrirTour}
          className="text-[11px] font-black text-[#007a87] hover:underline flex items-center gap-1 active:scale-95 transition"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Como Funciona o Status?</span>
        </button>
      </div>

      {/* 3. BARRA DE BUSCA E FILTROS */}
      <div className="space-y-2 mb-3.5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome no relatório..."
            className="w-full min-h-[48px] rounded-full border border-white/70 bg-white/80 pl-11 pr-10 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:border-[#007a87] focus:ring-2 focus:ring-[#007a87]/20 focus:outline-none dark:border-teal-500/20 dark:bg-[#162e30]/80 dark:text-zinc-100 dark:placeholder-zinc-500 shadow-xs backdrop-blur-xl transition"
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

        {/* Filtros em linha com Pills arredondadas */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[10px] uppercase font-black text-zinc-400 flex items-center px-1">
            Status:
          </span>
          {(['TODOS', 'APTO', 'PENDENTE'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFiltroStatus(st)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold shrink-0 transition-all active:scale-95 ${
                filtroStatus === st
                  ? 'bg-zinc-800 text-white dark:bg-teal-400 dark:text-zinc-950 shadow-xs'
                  : 'bg-white/70 text-zinc-600 hover:bg-white dark:bg-[#162e30]/60 dark:text-zinc-400'
              }`}
            >
              {st === 'TODOS' ? 'Todos' : st === 'APTO' ? 'Aptos' : 'Pendentes'}
            </button>
          ))}

          <span className="text-[10px] uppercase font-black text-zinc-400 flex items-center px-1 ml-1">
            Grupo:
          </span>
          {(['TODOS', 'LAQI', 'EXTERNO'] as const).map((gp) => (
            <button
              key={gp}
              onClick={() => setFiltroGrupo(gp)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold shrink-0 transition-all active:scale-95 ${
                filtroGrupo === gp
                  ? 'bg-[#007a87] text-white shadow-xs'
                  : 'bg-white/70 text-zinc-600 hover:bg-white dark:bg-[#162e30]/60 dark:text-zinc-400'
              }`}
            >
              {gp === 'TODOS' ? 'Todos' : gp === 'LAQI' ? 'LAQI' : 'Externos'}
            </button>
          ))}
        </div>
      </div>

      {/* 4. LISTA DE MONITORES COM STATUS E BARRA DE PROGRESSO */}
      <div className="space-y-2.5">
        {listaFiltrada.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-800 bg-white/40 dark:bg-[#162e30]/40">
            <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
              Nenhum monitor encontrado.
            </p>
          </div>
        ) : (
          listaFiltrada.map(({ monitor, aptidao }) => (
            <div
              key={monitor.id}
              onClick={() => setMonitorSelecionado(monitor)}
              className="rounded-[26px] bg-white/80 p-4 border border-white/70 shadow-[0_6px_24px_rgba(0,0,0,0.03)] backdrop-blur-xl transition hover:border-[#007a87]/60 active:scale-[0.99] dark:bg-[#162e30]/75 dark:border-teal-500/20 cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                    {monitor.nome}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    <span
                      className={`rounded-full px-2 py-0.2 text-[10px] font-extrabold ${
                        monitor.grupo === 'LAQI'
                          ? 'bg-teal-100 text-[#007a87] dark:bg-teal-950 dark:text-teal-300'
                          : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                      }`}
                    >
                      {monitor.grupo}
                    </span>
                    {monitor.turno && (
                      <span className="text-[10px] font-semibold">Turno {monitor.turno === 'MANHA' ? 'Manhã' : 'Tarde'}</span>
                    )}
                  </div>
                </div>

                {/* Badge APTO ou Pendente */}
                <div className="shrink-0 flex items-center gap-1.5">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide flex items-center gap-1 ${
                      aptidao.isApto
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-500/30 shadow-2xs'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {aptidao.isApto ? '✓ APTO' : '⏳ PENDENTE'}
                  </span>
                  <ChevronRight className="h-4 w-4 text-zinc-400" />
                </div>
              </div>

              {/* Barra de Progresso Arredondada */}
              <div>
                <div className="flex justify-between text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                  <span>{aptidao.texto}</span>
                  <span>{aptidao.progressoPercent}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-100/90 overflow-hidden dark:bg-zinc-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      aptidao.isApto ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-amber-400 to-orange-400'
                    }`}
                    style={{ width: `${aptidao.progressoPercent}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Grade 5 dias x 2 turnos */}
      <MonitorDetailModal
        monitor={monitorSelecionado}
        onFechar={() => setMonitorSelecionado(null)}
      />
    </div>
  );
};
