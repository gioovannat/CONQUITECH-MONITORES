import React, { useState } from 'react';
import {
  WifiOff,
  RefreshCw,
  LogOut,
  User,
  Shield,
  Download,
  Share2,
  CheckCircle2,
  Bell,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useNotification } from '../context/NotificationContext';

export const Header: React.FC = () => {
  const { syncStatus, pendentesSyncCount, setModalSyncAberto, abrirTour } = useApp();
  const { usuarioAtual, logout } = useAuth();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { setModalCentralAberto, atividadesAbertasCount } = useNotification();
  const [mostrarGuiaIOS, setMostrarGuiaIOS] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 w-full transition-all">
        {/* Barra Superior Estilo Frosted Glass com Logo Pequena no Canto Esquerdo (Versão Compacta Original) */}
        <div className="mx-auto max-w-md px-3 pt-2">
          <div className="rounded-[24px] bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] px-3.5 py-2.5 transition-colors">
            <div className="flex items-center justify-between gap-2">
              {/* Logo Oficial Pequena no Canto Esquerdo */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white p-1 shadow-xs border border-teal-100 overflow-hidden">
                  <img
                    src="/assets/aistudio/logo_conquitech_oficial.png"
                    alt="Logo CONQUITECH-MA"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-sm font-black tracking-tight leading-tight text-[#007a87] truncate">
                      CONQUITECH-MA
                    </h1>
                    <span className="rounded-full bg-teal-500/15 text-[#007a87] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider shrink-0">
                      Equipe D
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 truncate leading-none mt-0.5">
                    UFMA / LAQI • 30/11 a 04/12/2026
                  </p>
                </div>
              </div>

              {/* Controles e Indicadores à Direita */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Botão de Sino / Central de Notificações */}
                <button
                  onClick={() => setModalCentralAberto(true)}
                  className="relative flex items-center justify-center h-8 w-8 rounded-full bg-zinc-100 text-zinc-700 hover:bg-teal-50 hover:text-[#007a87] transition shadow-xs active:scale-95"
                  title="Central de Atividades e Notificações Locais"
                  aria-label="Abrir notificações"
                >
                  <Bell className="h-4 w-4" />
                  {atividadesAbertasCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-emerald-500 text-white text-[9px] font-black shadow-xs animate-pulse">
                      {atividadesAbertasCount}
                    </span>
                  )}
                </button>

                {/* Botão de Ajuda / Tour Guiado */}
                <button
                  onClick={abrirTour}
                  className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-100 text-zinc-700 hover:bg-teal-50 hover:text-[#007a87] transition shadow-xs active:scale-95"
                  title="Como Usar o App (Tour Guiado)"
                  aria-label="Abrir tour guiado"
                >
                  <HelpCircle className="h-4 w-4" />
                </button>

                {/* Status de Sincronização em Pill Flutuante */}
                <button
                  onClick={() => setModalSyncAberto(true)}
                  title={`Status: ${syncStatus}. Clique para abrir o painel de sincronização offline.`}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition shadow-xs active:scale-95 ${
                    syncStatus === 'sincronizado'
                      ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-400/30'
                      : syncStatus === 'sincronizando'
                      ? 'bg-cyan-500/20 text-cyan-800 border border-cyan-400/40 animate-pulse'
                      : 'bg-amber-500/20 text-amber-800 border border-amber-400/50'
                  }`}
                >
                  {syncStatus === 'sincronizado' ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      <span className="hidden xs:inline">Sincronizado</span>
                    </>
                  ) : syncStatus === 'sincronizando' ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin text-cyan-600" />
                      <span className="hidden xs:inline">Sincronizando</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3 text-amber-600" />
                      <span>Offline {pendentesSyncCount > 0 ? `(${pendentesSyncCount})` : ''}</span>
                    </>
                  )}
                </button>

                {/* PWA Install Button se disponível */}
                {!isInstalled && isInstallable && (
                  <button
                    onClick={install}
                    className="flex items-center gap-1 rounded-full bg-[#007a87] px-2.5 py-1 text-xs font-bold text-white hover:bg-teal-600 active:scale-95 transition shadow-xs"
                    title="Instalar App no Celular"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Instalar</span>
                  </button>
                )}

                {!isInstalled && isIOS && (
                  <button
                    onClick={() => setMostrarGuiaIOS(true)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-[#007a87] hover:bg-teal-100 transition shadow-xs"
                    title="Instalar no iPhone"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </button>
                )}

                {/* Sair do Sistema */}
                {usuarioAtual && (
                  <button
                    onClick={logout}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-red-50 hover:text-red-600 transition shadow-xs active:scale-95"
                    title={`Sair de ${usuarioAtual.nome}`}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Usuário Logado em Pill Delicada na Base do Header */}
            {usuarioAtual && (
              <div className="mt-2 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 truncate">
                  {usuarioAtual.perfil === 'coordenador' ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                      <Shield className="h-3 w-3" />
                    </span>
                  ) : (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                      <User className="h-3 w-3" />
                    </span>
                  )}
                  <span className="font-bold text-zinc-800 truncate">
                    {usuarioAtual.nome}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-[#007a87]">
                    ({usuarioAtual.perfil})
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-zinc-400 shrink-0">
                  {usuarioAtual.perfil === 'coordenador' ? 'Gestão Total' : 'Registro de Presença'}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modal Guia de Instalação iOS */}
      {mostrarGuiaIOS && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-[28px] bg-white p-5 shadow-2xl text-zinc-900 border border-white/50">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="font-black text-base text-[#007a87]">
                Instalar no iPhone / iPad
              </h3>
              <button
                onClick={() => setMostrarGuiaIOS(false)}
                className="text-zinc-400 hover:text-zinc-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 space-y-2 text-xs text-zinc-600">
              <p>Adicione o <strong>Presença CONQUITECH</strong> à tela de início para acesso veloz com uma mão:</p>
              <div className="flex items-start gap-2.5 rounded-2xl bg-teal-50 p-3">
                <span className="font-extrabold text-[#007a87]">1.</span>
                <span>Toque no botão <strong>Compartilhar</strong> (ícone de quadrado com seta para cima) no Safari.</span>
              </div>
              <div className="flex items-start gap-2.5 rounded-2xl bg-teal-50 p-3">
                <span className="font-extrabold text-[#007a87]">2.</span>
                <span>Role a lista e toque em <strong>"Adicionar à Tela de Início"</strong>.</span>
              </div>
              <div className="flex items-start gap-2.5 rounded-2xl bg-teal-50 p-3">
                <span className="font-extrabold text-[#007a87]">3.</span>
                <span>Toque em <strong>"Adicionar"</strong> no canto superior direito.</span>
              </div>
            </div>
            <button
              onClick={() => setMostrarGuiaIOS(false)}
              className="mt-4 w-full min-h-[48px] rounded-2xl bg-[#007a87] font-bold text-white hover:bg-teal-600 active:scale-98 transition shadow-md"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
