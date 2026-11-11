import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { NotificationProvider } from './context/NotificationContext';
import { Header } from './components/Header';
import { BottomNav, TabTipo } from './components/BottomNav';
import { TabRegistrar } from './components/TabRegistrar';
import { TabStatus } from './components/TabStatus';
import { TabAdmin } from './components/TabAdmin';
import { LoginScreen } from './components/LoginScreen';
import { AuthCallbackScreen } from './components/AuthCallbackScreen';
import { SetPasswordScreen } from './components/SetPasswordScreen';
import { NotificationBanner } from './components/NotificationBanner';
import { CentralNotificacoesModal } from './components/CentralNotificacoesModal';
import { SyncStatusModal } from './components/SyncStatusModal';
import { OnboardingTour } from './components/OnboardingTour';
import { CheckCircle2 } from 'lucide-react';

function MainApp() {
  const { usuarioAtual, estaCarregando, precisaDefinirSenha, definirSenha } = useAuth();
  const {
    modalSyncAberto,
    setModalSyncAberto,
    mensagemSyncToast,
    setMensagemSyncToast,
    tourAberto,
    fecharTour,
  } = useApp();
  const [abaAtiva, setAbaAtiva] = useState<TabTipo>('registrar');

  if (estaCarregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eaf4f3] px-4 text-sm font-medium text-[#007a87]" aria-live="polite">
        Verificando sessão segura...
      </main>
    );
  }

  if (precisaDefinirSenha) {
    return <SetPasswordScreen onSubmit={definirSenha} />;
  }

  if (!usuarioAtual) {
    return <LoginScreen />;
  }

  // Se o usuário atual não for coordenador e tentar abrir admin, redireciona para registrar
  const abaEfetiva = abaAtiva === 'admin' && usuarioAtual.perfil !== 'coordenador' ? 'registrar' : abaAtiva;

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#eaf4f3] via-[#ddeee9] to-[#d4e8e4] text-zinc-900 flex flex-col font-sans selection:bg-[#007a87] selection:text-white overflow-x-hidden">
      {/* Toast de Sincronização Concluída */}
      {mensagemSyncToast && (
        <div className="fixed top-3 left-0 right-0 z-50 px-4 pointer-events-none animate-in slide-in-from-top-2 duration-200">
          <div className="mx-auto max-w-sm rounded-2xl bg-emerald-600 text-white p-3 shadow-xl flex items-center justify-between gap-2 pointer-events-auto">
            <div className="flex items-center gap-2 text-xs font-bold min-w-0">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-200" />
              <span className="truncate">{mensagemSyncToast}</span>
            </div>
            <button
              onClick={() => setMensagemSyncToast(null)}
              className="text-white hover:text-emerald-100 font-black text-xs px-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Alerta Flutuante de Atividade Aberta */}
      <NotificationBanner onNavegarParaRegistrar={() => setAbaAtiva('registrar')} />

      {/* Círculos decorativos de iluminação ambiente inspirados na referência */}
      <div className="pointer-events-none fixed -top-24 -left-24 h-80 w-80 rounded-full bg-teal-400/20 blur-3xl" />
      <div className="pointer-events-none fixed top-1/3 -right-24 h-96 w-96 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-24 left-1/4 h-80 w-80 rounded-full bg-amber-400/15 blur-3xl" />

      {/* Barra Superior */}
      <Header />

      {/* Conteúdo Central Responsivo (Mobile-First 360-430px) */}
      <main className="relative flex-1 w-full max-w-md mx-auto z-10">
        {abaEfetiva === 'registrar' && <TabRegistrar />}
        {abaEfetiva === 'status' && <TabStatus />}
        {abaEfetiva === 'admin' && <TabAdmin />}
      </main>

      {/* Barra de Navegação Inferior (Floating Capsule Dock) */}
      <BottomNav
        abaAtiva={abaEfetiva}
        onSelecionarAba={(aba) => setAbaAtiva(aba)}
      />

      {/* Central Completa de Notificações e Agenda de Atividades */}
      <CentralNotificacoesModal onNavegarParaRegistrar={() => setAbaAtiva('registrar')} />

      {/* Modal de Status de Sincronização e Fila Offline IndexedDB */}
      <SyncStatusModal
        aberto={modalSyncAberto}
        onFechar={() => setModalSyncAberto(false)}
      />

      {/* Tour Guiado (Onboarding) para Monitores */}
      <OnboardingTour
        aberto={tourAberto}
        onFechar={fecharTour}
        onMudarAba={(aba) => setAbaAtiva(aba)}
      />
    </div>
  );
}

export default function App() {
  if (window.location.pathname === '/auth/callback') return <AuthCallbackScreen />;

  return (
    <AuthProvider>
      <AppProvider>
        <NotificationProvider>
          <MainApp />
        </NotificationProvider>
      </AppProvider>
    </AuthProvider>
  );
}
