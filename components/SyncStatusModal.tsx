import React from 'react';
import {
  X,
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SyncStatusModalProps {
  aberto: boolean;
  onFechar: () => void;
}

export const SyncStatusModal: React.FC<SyncStatusModalProps> = ({ aberto, onFechar }) => {
  const {
    syncStatus,
    isOnline,
    pendentesSyncCount,
    filaSync,
    modoOfflineSimulado,
    alternarModoOfflineSimulado,
    forcarSincronizacao,
  } = useApp();

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-[32px] bg-white/95 shadow-[0_16px_50px_rgba(0,0,0,0.25)] border border-white/80 text-zinc-900 flex flex-col overflow-hidden backdrop-blur-2xl">
        {/* Cabeçalho */}
        <div
          className={`px-4 py-3.5 text-white flex items-center justify-between ${
            syncStatus === 'sincronizado'
              ? 'bg-gradient-to-r from-[#007a87] to-[#10b981]'
              : 'bg-gradient-to-r from-amber-600 to-orange-600'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              {syncStatus === 'sincronizado' ? (
                <Wifi className="h-5 w-5" />
              ) : (
                <WifiOff className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base leading-tight">
                {syncStatus === 'sincronizado'
                  ? 'Conectado & Sincronizado'
                  : syncStatus === 'sincronizando'
                  ? 'Sincronizando Dados...'
                  : 'Modo Offline Ativo'}
              </h3>
              <p className="text-[11px] text-white/90">
                IndexedDB & LocalStorage • CONQUITECH-MA
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

        {/* Conteúdo Informativo */}
        <div className="p-4 space-y-3.5 overflow-y-auto max-h-[70vh]">
          {/* Card de Status da Conexão */}
          <div
            className={`rounded-[24px] p-3.5 border ${
              syncStatus === 'sincronizado'
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/70 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`flex h-3 w-3 rounded-full ${
                  syncStatus === 'sincronizado'
                    ? 'bg-emerald-500'
                    : syncStatus === 'sincronizando'
                    ? 'bg-cyan-500 animate-ping'
                    : 'bg-amber-500'
                }`}
              />
              <span className="font-black text-xs uppercase tracking-wider">
                Status: {syncStatus === 'sincronizado' ? 'Sincronizado' : syncStatus === 'sincronizando' ? 'Sincronizando' : 'Offline / Salvo Localmente'}
              </span>
            </div>

            <p className="text-xs leading-relaxed text-zinc-700">
              {syncStatus === 'sincronizado'
                ? 'Todas as presenças registradas estão salvas e sincronizadas com o banco local do dispositivo.'
                : 'O dispositivo está sem conexão com a internet. Você pode continuar registrando presenças normalmente: os dados são gravados no banco local IndexedDB e serão sincronizados automaticamente assim que a conexão retornar.'}
            </p>
          </div>

          {/* Destaque da Arquitetura IndexedDB */}
          <div className="rounded-[24px] bg-teal-50/60 p-3.5 border border-teal-200/70 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#007a87] text-white shadow-xs">
              <Database className="h-4 w-4" />
            </div>
            <div className="text-xs">
              <strong className="block font-black text-zinc-900 mb-0.5">
                Garantia de Não-Perda de Frequência
              </strong>
              <p className="text-zinc-600 leading-relaxed text-[11px]">
                O aplicativo utiliza <strong>IndexedDB</strong> de alta capacidade e espelhamento em <strong>localStorage</strong>. Mesmo se a aba for fechada ou o celular reiniciado, nenhum registro será perdido.
              </p>
            </div>
          </div>

          {/* Fila de Ações Pendentes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Fila Offline ({filaSync.length} pendente{filaSync.length !== 1 ? 's' : ''})
              </span>
              {filaSync.length > 0 && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  Aguardando Conexão
                </span>
              )}
            </div>

            {filaSync.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 p-4 text-center text-xs text-zinc-400 bg-zinc-50/50">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1 opacity-80" />
                <span>Nenhuma ação pendente. Todos os dados estão em dia!</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {filaSync.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl p-2.5 bg-amber-50/60 border border-amber-200/80 text-xs flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1 truncate">
                      <strong className="block text-zinc-900 truncate font-bold">
                        {item.descricao}
                      </strong>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {new Date(item.criadoEm).toLocaleTimeString('pt-BR')} • {item.tipo}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-md shrink-0">
                      Na Fila
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ações Manuais e Simulação */}
          <div className="pt-2 border-t border-zinc-100 space-y-2">
            <button
              onClick={forcarSincronizacao}
              className="w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-[#007a87] to-[#0d9488] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:opacity-95 active:scale-98 transition"
            >
              <RefreshCw className={`h-4 w-4 ${syncStatus === 'sincronizando' ? 'animate-spin' : ''}`} />
              <span>Sincronizar Agora com o Servidor</span>
            </button>

            {/* Alternador de Simulação Offline (Ideal para testes em demonstração) */}
            <button
              onClick={alternarModoOfflineSimulado}
              className={`w-full min-h-[44px] rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition active:scale-98 ${
                modoOfflineSimulado
                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                  : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {modoOfflineSimulado ? (
                <>
                  <WifiOff className="h-4 w-4 text-amber-700" />
                  <span>Desativar Simulação Offline (Voltar Online)</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-zinc-500" />
                  <span>Simular Modo Offline (Testar Sem Internet)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
