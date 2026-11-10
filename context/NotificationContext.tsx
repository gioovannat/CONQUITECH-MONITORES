import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AtividadeCongresso, ATIVIDADES_INICIAIS, NotificacaoItem, PublicoAlvoAtividade } from '../data/atividadesData';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';
import { DiaIndex, Turno } from '../rules';

interface NotificationContextType {
  atividades: AtividadeCongresso[];
  notificacoes: NotificacaoItem[];
  notificacaoAtiva: NotificacaoItem | null;
  permissoesNotificacao: NotificationPermission;
  somHabilitado: boolean;
  modalCentralAberto: boolean;
  naoLidasCount: number;
  atividadesAbertasCount: number;

  solicitarPermissao: () => Promise<NotificationPermission>;
  fecharNotificacaoAtiva: () => void;
  marcarComoLida: (id: string) => void;
  limparTodasNotificacoes: () => void;
  setSomHabilitado: (habilitado: boolean) => void;
  setModalCentralAberto: (aberto: boolean) => void;

  simularAberturaAtividade: (atividadeId: string) => void;
  alternarStatusAtividade: (atividadeId: string, aberto: boolean) => void;
  irParaRegistroAtividade: (atividade: AtividadeCongresso | NotificacaoItem) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Síntese de som tátil suave usando Web Audio API (sem dependência de arquivos externos)
function tocarSinalNotificacao() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880.0, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {}
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuarioAtual } = useAuth();
  const { monitores, setDiaAtivo, setTurnoAtivo } = useApp();

  const [atividades, setAtividades] = useState<AtividadeCongresso[]>(() => {
    try {
      const salvo = localStorage.getItem('conquitech_atividades_agenda');
      if (salvo) {
        const parsed = JSON.parse(salvo);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return ATIVIDADES_INICIAIS;
  });

  const [notificacoes, setNotificacoes] = useState<NotificacaoItem[]>(() => {
    try {
      const salvo = localStorage.getItem('conquitech_notificacoes_locais');
      if (salvo) return JSON.parse(salvo);
    } catch {}
    return [];
  });

  const [notificacaoAtiva, setNotificacaoAtiva] = useState<NotificacaoItem | null>(null);
  const [modalCentralAberto, setModalCentralAberto] = useState(false);
  const [somHabilitado, setSomHabilitadoState] = useState<boolean>(() => {
    try {
      const salvo = localStorage.getItem('conquitech_som_notif');
      return salvo !== 'false';
    } catch {}
    return true;
  });

  const [permissoesNotificacao, setPermissoesNotificacao] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  // Salvar atividades
  useEffect(() => {
    try {
      localStorage.setItem('conquitech_atividades_agenda', JSON.stringify(atividades));
    } catch {}
  }, [atividades]);

  // Salvar notificações
  useEffect(() => {
    try {
      localStorage.setItem('conquitech_notificacoes_locais', JSON.stringify(notificacoes));
    } catch {}
  }, [notificacoes]);

  const setSomHabilitado = (val: boolean) => {
    setSomHabilitadoState(val);
    try {
      localStorage.setItem('conquitech_som_notif', String(val));
    } catch {}
  };

  const solicitarPermissao = async (): Promise<NotificationPermission> => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const resultado = await Notification.requestPermission();
        setPermissoesNotificacao(resultado);
        return resultado;
      } catch {
        return 'denied';
      }
    }
    return 'denied';
  };

  // Verifica se o usuário atual deve receber alerta para a atividade
  // Regra: LAQI recebe ambos os turnos; Externo Manhã só Manhã; Externo Tarde só Tarde; Coordenador recebe tudo
  const usuarioEhElegivel = useCallback(
    (atividade: AtividadeCongresso): boolean => {
      if (!usuarioAtual) return false;
      if (usuarioAtual.perfil === 'coordenador') return true;

      // Se for usuário da equipe, verifica se está associado a um monitor específico
      const monitor = monitores.find((m) => m.id === usuarioAtual.id || m.nome.toLowerCase() === usuarioAtual.nome.toLowerCase());

      if (monitor) {
        if (monitor.grupo === 'LAQI') return true; // LAQI participa de ambos os turnos
        if (monitor.grupo === 'EXTERNO') {
          return monitor.turno === atividade.turno;
        }
      }

      // Por padrão para usuários da Equipe D sem monitor vinculado específico, notifica se o turno corresponder
      if (atividade.publicoAlvo === 'TODOS') return true;
      return true;
    },
    [usuarioAtual, monitores]
  );

  // Disparar uma notificação local (navegador e in-app)
  const dispararNotificacaoLocal = useCallback(
    (atividade: AtividadeCongresso) => {
      const ehElegivel = usuarioEhElegivel(atividade);

      // Só cria alerta se for elegível para o usuário atual
      if (!ehElegivel) return;

      const publicoTexto =
        atividade.publicoAlvo === 'LAQI_E_MANHA'
          ? 'Turno da Manhã e Membros da LAQI'
          : atividade.publicoAlvo === 'LAQI_E_TARDE'
          ? 'Turno da Tarde e Membros da LAQI'
          : 'Todos os Monitores';

      const novaNotif: NotificacaoItem = {
        id: `notif_${Date.now()}_${atividade.id}`,
        atividadeId: atividade.id,
        titulo: `Registro Aberto: ${atividade.titulo}`,
        mensagem: `Atenção: ${publicoTexto}. O registro de presença para a atividade de ${atividade.turno === 'MANHA' ? 'Manhã' : 'Tarde'} (${atividade.horarioInicio} - ${atividade.horarioFim}) foi aberto no ${atividade.local}.`,
        dia: atividade.dia,
        turno: atividade.turno,
        publicoAlvo: atividade.publicoAlvo,
        timestamp: Date.now(),
        lida: false,
        disparadaEm: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };

      setNotificacoes((prev) => [novaNotif, ...prev.slice(0, 49)]);
      setNotificacaoAtiva(novaNotif);

      if (somHabilitado) {
        tocarSinalNotificacao();
      }

      // Notificação nativa do navegador
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(novaNotif.titulo, {
            body: novaNotif.mensagem,
            icon: '/assets/aistudio/logo_conquitech_oficial.png',
            tag: novaNotif.id,
          });
        } catch {}
      }
    },
    [usuarioEhElegivel, somHabilitado]
  );

  // Simulação / Abertura imediata de registro de uma atividade
  const simularAberturaAtividade = (atividadeId: string) => {
    setAtividades((prev) =>
      prev.map((a) => {
        if (a.id === atividadeId) {
          const atualizada = { ...a, abertoParaRegistro: true };
          dispararNotificacaoLocal(atualizada);
          return atualizada;
        }
        return a;
      })
    );
  };

  const alternarStatusAtividade = (atividadeId: string, aberto: boolean) => {
    setAtividades((prev) =>
      prev.map((a) => {
        if (a.id === atividadeId) {
          const atualizada = { ...a, abertoParaRegistro: aberto };
          if (aberto) {
            dispararNotificacaoLocal(atualizada);
          }
          return atualizada;
        }
        return a;
      })
    );
  };

  const marcarComoLida = (id: string) => {
    setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)));
  };

  const limparTodasNotificacoes = () => {
    setNotificacoes([]);
    setNotificacaoAtiva(null);
  };

  const fecharNotificacaoAtiva = () => {
    if (notificacaoAtiva) {
      marcarComoLida(notificacaoAtiva.id);
    }
    setNotificacaoAtiva(null);
  };

  const irParaRegistroAtividade = (item: AtividadeCongresso | NotificacaoItem) => {
    setDiaAtivo(item.dia);
    setTurnoAtivo(item.turno);
    fecharNotificacaoAtiva();
    setModalCentralAberto(false);
  };

  const naoLidasCount = notificacoes.filter((n) => !n.lida).length;
  const atividadesAbertasCount = atividades.filter((a) => a.abertoParaRegistro).length;

  return (
    <NotificationContext.Provider
      value={{
        atividades,
        notificacoes,
        notificacaoAtiva,
        permissoesNotificacao,
        somHabilitado,
        modalCentralAberto,
        naoLidasCount,
        atividadesAbertasCount,
        solicitarPermissao,
        fecharNotificacaoAtiva,
        marcarComoLida,
        limparTodasNotificacoes,
        setSomHabilitado,
        setModalCentralAberto,
        simularAberturaAtividade,
        alternarStatusAtividade,
        irParaRegistroAtividade,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotification(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification deve ser usado dentro de um NotificationProvider');
  }
  return context;
}
