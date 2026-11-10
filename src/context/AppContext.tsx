import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Monitor,
  Presenca,
  AcaoLog,
  DiaIndex,
  Turno,
  Grupo,
  DIAS_CONGRESSO,
  calcularAptidao,
  detectarDiaAtual,
  detectarTurnoAtual,
} from '../rules';
import { gerarMonitoresIniciais } from '../data/initialData';
import { useAuth } from './AuthContext';
import { offlineStorage, ItemFilaSincronizacao } from '../services/offlineStorage';

export type SyncStatus = 'offline' | 'sincronizando' | 'sincronizado';
export type ThemeMode = 'auto' | 'light' | 'dark';

interface AppContextType {
  // Dados
  monitores: Monitor[];
  presencas: Presenca[];
  logs: AcaoLog[];
  syncStatus: SyncStatus;
  isOnline: boolean;
  pendentesSyncCount: number;
  filaSync: ItemFilaSincronizacao[];
  modoOfflineSimulado: boolean;
  modalSyncAberto: boolean;
  setModalSyncAberto: (aberto: boolean) => void;
  alternarModoOfflineSimulado: () => void;
  mensagemSyncToast: string | null;
  setMensagemSyncToast: (msg: string | null) => void;

  // Onboarding / Tour Guiado
  tourAberto: boolean;
  setTourAberto: (aberto: boolean) => void;
  abrirTour: () => void;
  fecharTour: () => void;

  // Seleções ativas de navegação
  diaAtivo: DiaIndex;
  turnoAtivo: Turno;
  setDiaAtivo: (dia: DiaIndex) => void;
  setTurnoAtivo: (turno: Turno) => void;

  // Tema
  tema: ThemeMode;
  setTema: (tema: ThemeMode) => void;
  temaEfetivo: 'light' | 'dark';

  // Operações de Presença
  marcarPresenca: (monitorId: string, dia: DiaIndex, turno: Turno) => Promise<{ sucesso: boolean; mensagem?: string }>;
  desmarcarPresenca: (monitorId: string, dia: DiaIndex, turno: Turno) => Promise<{ sucesso: boolean; mensagem?: string }>;
  registrarPresencaRetroativa: (
    monitorId: string,
    dia: DiaIndex,
    turno: Turno,
    tipo: 'MARCAR' | 'DESMARCAR',
    justificativa?: string
  ) => Promise<{ sucesso: boolean; mensagem?: string }>;

  // Operações de Monitores (Coordenador)
  adicionarMonitor: (dados: { nome: string; grupo: Grupo; turno?: Turno }) => Promise<{ sucesso: boolean; mensagem?: string }>;
  editarMonitor: (id: string, dados: { nome: string; grupo: Grupo; turno?: Turno; ativo: boolean }) => Promise<{ sucesso: boolean; mensagem?: string }>;
  alternarStatusMonitor: (id: string) => Promise<{ sucesso: boolean; mensagem?: string }>;
  restaurarMonitoresOriginais: () => void;

  // Utilitários de Consulta
  isPresencaRegistrada: (monitorId: string, dia: DiaIndex, turno: Turno) => boolean;
  obterDetalhesPresenca: (monitorId: string, dia: DiaIndex, turno: Turno) => Presenca | undefined;
  obterPresencasDoMonitor: (monitorId: string) => Presenca[];
  forcarSincronizacao: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuarioAtual } = useAuth();

  // 1. Estado online e sinc
  const [isOnlineReal, setIsOnlineReal] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [modoOfflineSimulado, setModoOfflineSimulado] = useState<boolean>(false);
  const isOnline = isOnlineReal && !modoOfflineSimulado;

  const [syncStatus, setSyncStatus] = useState<SyncStatus>(isOnline ? 'sincronizado' : 'offline');
  const [pendentesSyncCount, setPendentesSyncCount] = useState<number>(0);
  const [filaSync, setFilaSync] = useState<ItemFilaSincronizacao[]>([]);
  const [modalSyncAberto, setModalSyncAberto] = useState(false);
  const [mensagemSyncToast, setMensagemSyncToast] = useState<string | null>(null);

  // Tour Guiado / Onboarding (Aparece na primeira vez que o monitor acessa)
  const [tourAberto, setTourAberto] = useState<boolean>(() => {
    try {
      const visto = localStorage.getItem('conquitech_onboarding_visto');
      return !visto;
    } catch {
      return false;
    }
  });

  const abrirTour = () => setTourAberto(true);
  const fecharTour = () => {
    setTourAberto(false);
    try {
      localStorage.setItem('conquitech_onboarding_visto', 'true');
    } catch {}
  };

  // 2. Seleções ativas
  const [diaAtivo, setDiaAtivo] = useState<DiaIndex>(() => detectarDiaAtual());
  const [turnoAtivo, setTurnoAtivo] = useState<Turno>(() => detectarTurnoAtual());

  // 3. Tema Claro Oficial CONQUITECH
  const tema: ThemeMode = 'light';
  const temaEfetivo: 'light' = 'light';
  const setTema = () => {};

  useEffect(() => {
    try {
      document.documentElement.classList.remove('dark');
      localStorage.removeItem('conquitech_tema');
    } catch {}
  }, []);

  // 4. Carregar Monitores (com 57 iniciais garantidos)
  const [monitores, setMonitores] = useState<Monitor[]>(() => {
    try {
      const salvo = localStorage.getItem('conquitech_monitores');
      if (salvo) {
        const parsed = JSON.parse(salvo);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return gerarMonitoresIniciais();
  });

  // 5. Carregar Presenças
  const [presencas, setPresencas] = useState<Presenca[]>(() => {
    try {
      const salvo = localStorage.getItem('conquitech_presencas');
      if (salvo) {
        const parsed = JSON.parse(salvo);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // 6. Carregar Logs
  const [logs, setLogs] = useState<AcaoLog[]>(() => {
    try {
      const salvo = localStorage.getItem('conquitech_logs');
      if (salvo) {
        const parsed = JSON.parse(salvo);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [
      {
        id: 'log_seed',
        timestamp: Date.now(),
        usuarioId: 'sistema',
        usuarioNome: 'Sistema CONQUITECH',
        tipo: 'PRESENCA_MARCADA',
        detalhes: 'Base de dados inicial configurada com 57 monitores da Equipe D.',
      },
    ];
  });

  // Carregar dados adicionais assíncronos do IndexedDB na montagem
  useEffect(() => {
    async function inicializarBancoOffline() {
      try {
        const fila = await offlineStorage.obterFilaSincronizacao();
        setFilaSync(fila);
        setPendentesSyncCount(fila.length);
        if (fila.length > 0 && !isOnline) {
          setSyncStatus('offline');
        }

        const presencasDB = await offlineStorage.carregarPresencas();
        if (presencasDB && presencasDB.length > presencas.length) {
          setPresencas(presencasDB);
        }
      } catch {}
    }
    inicializarBancoOffline();
  }, []);

  // Persistir no IndexedDB + localStorage sempre que presencas ou monitores mudarem
  useEffect(() => {
    offlineStorage.salvarMonitores(monitores);
  }, [monitores]);

  useEffect(() => {
    offlineStorage.salvarPresencas(presencas);
  }, [presencas]);

  useEffect(() => {
    try {
      localStorage.setItem('conquitech_logs', JSON.stringify(logs.slice(0, 50)));
    } catch {}
  }, [logs]);

  // Função interna para adicionar log
  const registrarLog = useCallback(
    (tipo: AcaoLog['tipo'], detalhes: string) => {
      const novoLog: AcaoLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        usuarioId: usuarioAtual?.id || 'anonimo',
        usuarioNome: usuarioAtual?.nome || 'Operador',
        tipo,
        detalhes,
      };

      setLogs((antigos) => [novoLog, ...antigos.slice(0, 49)]);
    },
    [usuarioAtual]
  );

  // Sincronizar fila de ações pendentes quando a conexão voltar
  const processarFilaSincronizacao = useCallback(async () => {
    setSyncStatus('sincronizando');

    try {
      const itensFila = await offlineStorage.obterFilaSincronizacao();
      const quantidade = itensFila.length;

      // Simulação de sincronização com servidor
      await new Promise((r) => setTimeout(r, 800));

      // Limpar fila no IndexedDB e localStorage
      await offlineStorage.limparFilaSincronizacao();
      setFilaSync([]);
      setPendentesSyncCount(0);
      setSyncStatus('sincronizado');

      if (quantidade > 0) {
        setMensagemSyncToast(`Conexão restabelecida: ${quantidade} registro(s) sincronizados com sucesso.`);
        setTimeout(() => setMensagemSyncToast(null), 4000);
      }
    } catch {
      setSyncStatus('sincronizado');
    }
  }, []);

  // Monitorar conectividade do navegador
  useEffect(() => {
    const handleOnline = () => {
      setIsOnlineReal(true);
      if (!modoOfflineSimulado) {
        processarFilaSincronizacao();
      }
    };

    const handleOffline = () => {
      setIsOnlineReal(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [modoOfflineSimulado, processarFilaSincronizacao]);

  const alternarModoOfflineSimulado = () => {
    const novoModo = !modoOfflineSimulado;
    setModoOfflineSimulado(novoModo);
    if (novoModo) {
      setSyncStatus('offline');
    } else {
      processarFilaSincronizacao();
    }
  };

  // Vibração leve em dispositivos móveis compatíveis
  const dispararVibracaoLeve = () => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(35);
      }
    } catch {}
  };

  // Checagem rápida de presença
  const isPresencaRegistrada = useCallback(
    (monitorId: string, dia: DiaIndex, turno: Turno) => {
      const id = `${monitorId}_${dia}_${turno}`;
      return presencas.some((p) => p.id === id);
    },
    [presencas]
  );

  const obterDetalhesPresenca = useCallback(
    (monitorId: string, dia: DiaIndex, turno: Turno) => {
      const id = `${monitorId}_${dia}_${turno}`;
      return presencas.find((p) => p.id === id);
    },
    [presencas]
  );

  const obterPresencasDoMonitor = useCallback(
    (monitorId: string) => {
      return presencas.filter((p) => p.monitorId === monitorId);
    },
    [presencas]
  );

  // Marcar Presença (Offline-First com IndexedDB e Fila de Sincronização)
  const marcarPresenca = async (
    monitorId: string,
    dia: DiaIndex,
    turno: Turno
  ): Promise<{ sucesso: boolean; mensagem?: string }> => {
    // Regra da Sexta à Tarde: bloqueado
    if (dia === 4 && turno === 'TARDE') {
      return {
        sucesso: false,
        mensagem: 'Na sexta-feira (04/12) à tarde não há programação. Registros bloqueados.',
      };
    }

    const monitor = monitores.find((m) => m.id === monitorId);
    if (!monitor) return { sucesso: false, mensagem: 'Monitor não encontrado.' };

    const presencaId = `${monitorId}_${dia}_${turno}`;
    const jaRegistrado = presencas.find((p) => p.id === presencaId);
    if (jaRegistrado) {
      const horaStr = new Date(jaRegistrado.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const quemRegistrou = jaRegistrado.registradoPorNome || 'outro coordenador';
      return {
        sucesso: false,
        mensagem: `Registro já efetuado por ${quemRegistrou} às ${horaStr}. Duplicidade evitada.`,
      };
    }

    const novaPresenca: Presenca = {
      id: presencaId,
      monitorId,
      dia,
      turno,
      registradoPor: usuarioAtual?.id || 'desconhecido',
      registradoPorNome: usuarioAtual?.nome || 'Coordenação',
      registradoPorEmail: usuarioAtual?.email,
      registradoPorPerfil: usuarioAtual?.perfil || 'coordenador',
      timestamp: Date.now(),
    };

    // Feedback tátil imediato
    dispararVibracaoLeve();

    // Atualização otimista e persistência local garantida
    const novasPresencas = [...presencas, novaPresenca];
    setPresencas(novasPresencas);
    offlineStorage.salvarPresencas(novasPresencas);

    const diaConfig = DIAS_CONGRESSO[dia];
    registrarLog(
      'PRESENCA_MARCADA',
      `Presença marcada para ${monitor.nome} (${diaConfig.diaSemana} ${diaConfig.diaMes} - ${turno === 'MANHA' ? 'Manhã' : 'Tarde'}) por ${usuarioAtual?.nome || 'Coordenador'}.`
    );

    // Se estiver sem conexão, enfileira a ação para sincronizar quando a rede retornar
    if (!isOnline) {
      setSyncStatus('offline');
      const itemFila: ItemFilaSincronizacao = {
        id: `sync_${Date.now()}_${presencaId}`,
        tipo: 'MARCAR_PRESENCA',
        payload: { presenca: novaPresenca },
        criadoEm: Date.now(),
        descricao: `Presença: ${monitor.nome} (${diaConfig.diaSemana} - ${turno === 'MANHA' ? 'Manhã' : 'Tarde'})`,
      };
      await offlineStorage.adicionarItemFila(itemFila);
      setFilaSync((prev) => [...prev, itemFila]);
      setPendentesSyncCount((c) => c + 1);
    } else {
      setSyncStatus('sincronizando');
      setTimeout(() => setSyncStatus('sincronizado'), 500);
    }

    return { sucesso: true };
  };

  // Desmarcar Presença (com suporte offline)
  const desmarcarPresenca = async (
    monitorId: string,
    dia: DiaIndex,
    turno: Turno
  ): Promise<{ sucesso: boolean; mensagem?: string }> => {
    const presencaId = `${monitorId}_${dia}_${turno}`;
    const monitor = monitores.find((m) => m.id === monitorId);

    dispararVibracaoLeve();

    const novasPresencas = presencas.filter((p) => p.id !== presencaId);
    setPresencas(novasPresencas);
    offlineStorage.salvarPresencas(novasPresencas);

    const diaConfig = DIAS_CONGRESSO[dia];
    registrarLog(
      'PRESENCA_DESFEITA',
      `Presença desfeita para ${monitor ? monitor.nome : monitorId} (${diaConfig.diaSemana} ${diaConfig.diaMes} - ${turno === 'MANHA' ? 'Manhã' : 'Tarde'}).`
    );

    if (!isOnline) {
      setSyncStatus('offline');
      const itemFila: ItemFilaSincronizacao = {
        id: `sync_desfazer_${Date.now()}_${presencaId}`,
        tipo: 'DESMARCAR_PRESENCA',
        payload: { monitorId, dia, turno },
        criadoEm: Date.now(),
        descricao: `Remoção: ${monitor?.nome || monitorId} (${diaConfig.diaSemana} - ${turno === 'MANHA' ? 'Manhã' : 'Tarde'})`,
      };
      await offlineStorage.adicionarItemFila(itemFila);
      setFilaSync((prev) => [...prev, itemFila]);
      setPendentesSyncCount((c) => c + 1);
    } else {
      setSyncStatus('sincronizando');
      setTimeout(() => setSyncStatus('sincronizado'), 500);
    }

    return { sucesso: true };
  };

  // Registro Retroativo (Apenas Coordenador)
  const registrarPresencaRetroativa = async (
    monitorId: string,
    dia: DiaIndex,
    turno: Turno,
    tipo: 'MARCAR' | 'DESMARCAR',
    justificativa?: string
  ): Promise<{ sucesso: boolean; mensagem?: string }> => {
    if (usuarioAtual?.perfil !== 'coordenador') {
      return { sucesso: false, mensagem: 'Apenas coordenadores podem realizar registros retroativos.' };
    }

    const presencaId = `${monitorId}_${dia}_${turno}`;
    const monitor = monitores.find((m) => m.id === monitorId);
    const diaConfig = DIAS_CONGRESSO[dia];

    if (tipo === 'MARCAR') {
      const jaExiste = presencas.some((p) => p.id === presencaId);
      if (jaExiste) {
        return { sucesso: false, mensagem: 'Esta presença já estava registrada.' };
      }

      const novaPresenca: Presenca = {
        id: presencaId,
        monitorId,
        dia,
        turno,
        registradoPor: usuarioAtual.id,
        registradoPorNome: usuarioAtual.nome,
        registradoPorEmail: usuarioAtual.email,
        registradoPorPerfil: 'coordenador',
        timestamp: Date.now(),
      };

      const novas = [...presencas, novaPresenca];
      setPresencas(novas);
      offlineStorage.salvarPresencas(novas);

      registrarLog(
        'REGISTRO_RETROATIVO',
        `Ajuste retroativo (+): ${monitor?.nome} no dia ${diaConfig.diaSemana} (${turno === 'MANHA' ? 'Manhã' : 'Tarde'}). Justificativa: ${justificativa || 'Sem justificativa informada'}.`
      );
    } else {
      const novas = presencas.filter((p) => p.id !== presencaId);
      setPresencas(novas);
      offlineStorage.salvarPresencas(novas);

      registrarLog(
        'REGISTRO_RETROATIVO',
        `Ajuste retroativo (-): Remoção de ${monitor?.nome} no dia ${diaConfig.diaSemana} (${turno === 'MANHA' ? 'Manhã' : 'Tarde'}). Justificativa: ${justificativa || 'Sem justificativa informada'}.`
      );
    }

    return { sucesso: true };
  };

  // Gerenciamento de Monitores (Apenas Coordenador)
  const adicionarMonitor = async (dados: {
    nome: string;
    grupo: Grupo;
    turno?: Turno;
  }): Promise<{ sucesso: boolean; mensagem?: string }> => {
    if (usuarioAtual?.perfil !== 'coordenador') {
      return { sucesso: false, mensagem: 'Apenas coordenadores podem adicionar monitores.' };
    }

    const novoMonitor: Monitor = {
      id: `mon_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      nome: dados.nome.trim(),
      grupo: dados.grupo,
      turno: dados.grupo === 'EXTERNO' ? dados.turno : undefined,
      ativo: true,
      criadoEm: Date.now(),
    };

    setMonitores((antigos) => [...antigos, novoMonitor]);
    registrarLog('MONITOR_CRIADO', `Novo monitor ${novoMonitor.nome} (${novoMonitor.grupo}) cadastrado.`);
    return { sucesso: true };
  };

  const editarMonitor = async (
    id: string,
    dados: { nome: string; grupo: Grupo; turno?: Turno; ativo: boolean }
  ): Promise<{ sucesso: boolean; mensagem?: string }> => {
    if (usuarioAtual?.perfil !== 'coordenador') {
      return { sucesso: false, mensagem: 'Apenas coordenadores podem editar monitores.' };
    }

    setMonitores((antigos) =>
      antigos.map((m) => {
        if (m.id === id) {
          return {
            ...m,
            nome: dados.nome.trim(),
            grupo: dados.grupo,
            turno: dados.grupo === 'EXTERNO' ? dados.turno : undefined,
            ativo: dados.ativo,
            atualizadoEm: Date.now(),
          };
        }
        return m;
      })
    );

    registrarLog('MONITOR_EDITADO', `Monitor ${dados.nome} atualizado.`);
    return { sucesso: true };
  };

  const alternarStatusMonitor = async (id: string): Promise<{ sucesso: boolean; mensagem?: string }> => {
    if (usuarioAtual?.perfil !== 'coordenador') {
      return { sucesso: false, mensagem: 'Apenas coordenadores podem desativar monitores.' };
    }

    let nomeMonitor = '';
    let novoStatus = true;

    setMonitores((antigos) =>
      antigos.map((m) => {
        if (m.id === id) {
          nomeMonitor = m.nome;
          novoStatus = !m.ativo;
          return { ...m, ativo: !m.ativo, atualizadoEm: Date.now() };
        }
        return m;
      })
    );

    registrarLog('MONITOR_EDITADO', `Monitor ${nomeMonitor} foi ${novoStatus ? 'reativado' : 'desativado'}.`);
    return { sucesso: true };
  };

  const restaurarMonitoresOriginais = () => {
    if (usuarioAtual?.perfil !== 'coordenador') return;
    const base = gerarMonitoresIniciais();
    setMonitores(base);
    registrarLog('MONITOR_EDITADO', 'Lista de 57 monitores originais da LAQI e Externos restaurada.');
  };

  const forcarSincronizacao = async () => {
    await processarFilaSincronizacao();
  };

  return (
    <AppContext.Provider
      value={{
        monitores,
        presencas,
        logs,
        syncStatus,
        isOnline,
        pendentesSyncCount,
        filaSync,
        modoOfflineSimulado,
        modalSyncAberto,
        setModalSyncAberto,
        alternarModoOfflineSimulado,
        mensagemSyncToast,
        setMensagemSyncToast,
        tourAberto,
        setTourAberto,
        abrirTour,
        fecharTour,
        diaAtivo,
        turnoAtivo,
        setDiaAtivo,
        setTurnoAtivo,
        tema,
        setTema,
        temaEfetivo,
        marcarPresenca,
        desmarcarPresenca,
        registrarPresencaRetroativa,
        adicionarMonitor,
        editarMonitor,
        alternarStatusMonitor,
        restaurarMonitoresOriginais,
        isPresencaRegistrada,
        obterDetalhesPresenca,
        obterPresencasDoMonitor,
        forcarSincronizacao,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser usado dentro de AppProvider');
  }
  return context;
};
