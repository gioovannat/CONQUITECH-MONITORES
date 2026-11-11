import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  History,
  CalendarCheck,
  Plus,
  Edit2,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
  Shield,
  ShieldAlert,
  UserCheck,
  Bell,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth, PerfilUsuario, Usuario } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Monitor, DiaIndex, Turno, Grupo, DIAS_CONGRESSO } from '../rules';
import { HistoricoPresencasModal } from './HistoricoPresencasModal';

export const TabAdmin: React.FC = () => {
  const { setModalCentralAberto, atividadesAbertasCount } = useNotification();
  const {
    monitores,
    presencas,
    logs,
    adicionarMonitor,
    editarMonitor,
    alternarStatusMonitor,
    restaurarMonitoresOriginais,
    registrarPresencaRetroativa,
    isPresencaRegistrada,
  } = useApp();

  const { usuarios, usuarioAtual, convidarUsuario, alternarStatusUsuario } = useAuth();

  const [secaoAtiva, setSecaoAtiva] = useState<'monitores' | 'usuarios' | 'retroativo' | 'logs'>('monitores');
  const [historicoAberto, setHistoricoAberto] = useState(false);

  // Estado para CRUD de Monitor
  const [modalMonitorAberto, setModalMonitorAberto] = useState(false);
  const [monitorEmEdicao, setMonitorEmEdicao] = useState<Monitor | null>(null);
  const [formNomeMonitor, setFormNomeMonitor] = useState('');
  const [formGrupoMonitor, setFormGrupoMonitor] = useState<Grupo>('LAQI');
  const [formTurnoMonitor, setFormTurnoMonitor] = useState<Turno>('MANHA');
  const [formAtivoMonitor, setFormAtivoMonitor] = useState(true);

  // Estado para Criação de Usuário
  const [modalUsuarioAberto, setModalUsuarioAberto] = useState(false);
  const [formNomeUsuario, setFormNomeUsuario] = useState('');
  const [formEmailUsuario, setFormEmailUsuario] = useState('');
  const [formPerfilUsuario, setFormPerfilUsuario] = useState<PerfilUsuario>('equipe');

  // Estado para Registro Retroativo
  const [retroMonitorId, setRetroMonitorId] = useState<string>(monitores[0]?.id || '');
  const [retroDia, setRetroDia] = useState<DiaIndex>(0);
  const [retroTurno, setRetroTurno] = useState<Turno>('MANHA');
  const [retroAcao, setRetroAcao] = useState<'MARCAR' | 'DESMARCAR'>('MARCAR');
  const [retroJustificativa, setRetroJustificativa] = useState('');

  // Feedback geral
  const [alerta, setAlerta] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const exibirAlerta = (tipo: 'sucesso' | 'erro', texto: string) => {
    setAlerta({ tipo, texto });
    setTimeout(() => setAlerta(null), 3500);
  };

  // Funções de Monitor
  const abrirModalNovoMonitor = () => {
    setMonitorEmEdicao(null);
    setFormNomeMonitor('');
    setFormGrupoMonitor('LAQI');
    setFormTurnoMonitor('MANHA');
    setFormAtivoMonitor(true);
    setModalMonitorAberto(true);
  };

  const abrirModalEditarMonitor = (m: Monitor) => {
    setMonitorEmEdicao(m);
    setFormNomeMonitor(m.nome);
    setFormGrupoMonitor(m.grupo);
    setFormTurnoMonitor(m.turno || 'MANHA');
    setFormAtivoMonitor(m.ativo);
    setModalMonitorAberto(true);
  };

  const salvarMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNomeMonitor.trim()) {
      exibirAlerta('erro', 'Por favor, informe o nome do monitor.');
      return;
    }

    if (monitorEmEdicao) {
      const res = await editarMonitor(monitorEmEdicao.id, {
        nome: formNomeMonitor,
        grupo: formGrupoMonitor,
        turno: formGrupoMonitor === 'EXTERNO' ? formTurnoMonitor : undefined,
        ativo: formAtivoMonitor,
      });
      if (res.sucesso) {
        exibirAlerta('sucesso', 'Monitor atualizado com sucesso.');
        setModalMonitorAberto(false);
      } else {
        exibirAlerta('erro', res.mensagem || 'Erro ao salvar.');
      }
    } else {
      const res = await adicionarMonitor({
        nome: formNomeMonitor,
        grupo: formGrupoMonitor,
        turno: formGrupoMonitor === 'EXTERNO' ? formTurnoMonitor : undefined,
      });
      if (res.sucesso) {
        exibirAlerta('sucesso', 'Monitor adicionado com sucesso.');
        setModalMonitorAberto(false);
      } else {
        exibirAlerta('erro', res.mensagem || 'Erro ao adicionar.');
      }
    }
  };

  // Funções de Usuário
  const salvarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    const redirectTo =
      import.meta.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
      `${window.location.origin}/auth/callback`;
    const res = await convidarUsuario({
      nome: formNomeUsuario,
      email: formEmailUsuario,
      perfil: formPerfilUsuario,
      redirectTo,
    });

    if (res.sucesso) {
      exibirAlerta('sucesso', 'Convite enviado. O novo membro poderá definir a própria senha pelo link recebido.');
      setModalUsuarioAberto(false);
      setFormNomeUsuario('');
      setFormEmailUsuario('');
      setFormPerfilUsuario('equipe');
    } else {
      exibirAlerta('erro', res.mensagem || 'Não foi possível enviar o convite.');
    }
  };

  // Função de Registro Retroativo
  const executarRegistroRetroativo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!retroMonitorId) {
      exibirAlerta('erro', 'Selecione um monitor.');
      return;
    }

    const res = await registrarPresencaRetroativa(
      retroMonitorId,
      retroDia,
      retroTurno,
      retroAcao,
      retroJustificativa
    );

    if (res.sucesso) {
      exibirAlerta('sucesso', `Ajuste retroativo de presença realizado com sucesso.`);
      setRetroJustificativa('');
    } else {
      exibirAlerta('erro', res.mensagem || 'Falha ao processar ajuste retroativo.');
    }
  };

  return (
    <div className="pb-32 pt-2 px-3 sm:px-4 max-w-md mx-auto animate-in fade-in duration-200">
      {/* Alerta de Feedback */}
      {alerta && (
        <div
          className={`mb-3.5 rounded-2xl p-3 text-xs font-bold text-white shadow-lg flex items-center justify-between ${
            alerta.tipo === 'sucesso' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          <span>{alerta.texto}</span>
          <button onClick={() => setAlerta(null)} className="font-bold ml-2">✕</button>
        </div>
      )}

      {/* Card Rápido de Gestão de Atividades e Notificações */}
      <div className="mb-4 rounded-[26px] bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 p-4 border border-teal-200/90 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#007a87] text-white shadow-xs">
            <Bell className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-black text-xs sm:text-sm text-zinc-900 truncate">
                Agenda de Atividades & Alertas
              </h3>
              {atividadesAbertasCount > 0 && (
                <span className="rounded-full bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.2">
                  {atividadesAbertasCount} aberta(s)
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-600 truncate mt-0.5">
              Abra o registro de atividades e dispare alertas para os monitores da Equipe D.
            </p>
          </div>
        </div>
        <button
          onClick={() => setModalCentralAberto(true)}
          className="min-h-[42px] px-3.5 rounded-full bg-[#007a87] hover:bg-teal-700 text-white text-xs font-black transition active:scale-95 shadow-xs shrink-0"
        >
          Gerenciar
        </button>
      </div>

      {/* Navegação Secundária do Admin (Pill Segmented Switch) */}
      <div className="grid grid-cols-4 gap-1 bg-white/70 p-1.5 rounded-full mb-4 dark:bg-[#132729]/80 backdrop-blur-xl border border-white/60 dark:border-teal-500/20 shadow-xs">
        <button
          onClick={() => setSecaoAtiva('monitores')}
          className={`min-h-[42px] rounded-full text-xs font-black transition-all flex flex-col items-center justify-center gap-0.5 active:scale-95 ${
            secaoAtiva === 'monitores'
              ? 'bg-gradient-to-r from-[#007a87] to-[#0d9488] text-white shadow-md'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span className="text-[10px]">Monitores</span>
        </button>

        <button
          onClick={() => setSecaoAtiva('usuarios')}
          className={`min-h-[42px] rounded-full text-xs font-black transition-all flex flex-col items-center justify-center gap-0.5 active:scale-95 ${
            secaoAtiva === 'usuarios'
              ? 'bg-gradient-to-r from-[#007a87] to-[#0d9488] text-white shadow-md'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
          }`}
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span className="text-[10px]">Equipe D</span>
        </button>

        <button
          onClick={() => setSecaoAtiva('retroativo')}
          className={`min-h-[42px] rounded-full text-xs font-black transition-all flex flex-col items-center justify-center gap-0.5 active:scale-95 ${
            secaoAtiva === 'retroativo'
              ? 'bg-gradient-to-r from-[#007a87] to-[#0d9488] text-white shadow-md'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
          }`}
        >
          <CalendarCheck className="h-3.5 w-3.5" />
          <span className="text-[10px]">Retroativo</span>
        </button>

        <button
          onClick={() => setSecaoAtiva('logs')}
          className={`min-h-[42px] rounded-full text-xs font-black transition-all flex flex-col items-center justify-center gap-0.5 active:scale-95 ${
            secaoAtiva === 'logs'
              ? 'bg-gradient-to-r from-[#007a87] to-[#0d9488] text-white shadow-md'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
          }`}
        >
          <History className="h-3.5 w-3.5" />
          <span className="text-[10px]">Logs</span>
        </button>
      </div>

      {/* SEÇÃO 1: CRUD DE MONITORES */}
      {secaoAtiva === 'monitores' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                Cadastro de Monitores ({monitores.length})
              </h3>
              <p className="text-[11px] text-zinc-500">
                41 membros LAQI + 16 monitores externos
              </p>
            </div>
            <button
              onClick={abrirModalNovoMonitor}
              className="min-h-[40px] rounded-xl bg-teal-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-600 active:scale-95 transition flex items-center gap-1 shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Novo Monitor</span>
            </button>
          </div>

          {/* Lista de monitores */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-0.5">
            {monitores.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-xl bg-white p-3 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 text-xs"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-zinc-900 dark:text-white truncate">
                      {m.nome}
                    </span>
                    {!m.ativo && (
                      <span className="rounded bg-red-100 text-red-700 px-1.5 py-0.2 text-[9px] font-bold">
                        Inativo
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-zinc-500">
                    <span className="font-semibold text-teal-700 dark:text-teal-400">
                      {m.grupo}
                    </span>
                    {m.turno && <span>• Turno {m.turno}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => abrirModalEditarMonitor(m)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                    title="Editar monitor"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => alternarStatusMonitor(m.id)}
                    className={`rounded-lg px-2 py-1.5 text-[10px] font-bold transition ${
                      m.ativo
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {m.ativo ? 'Desativar' : 'Reativar'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Botão de Restauração de Emergência */}
          <div className="pt-2">
            <button
              onClick={() => {
                if (window.confirm('Deseja restaurar a lista original com os 41 membros da LAQI e 16 externos?')) {
                  restaurarMonitoresOriginais();
                  exibirAlerta('sucesso', 'Lista original restaurada!');
                }
              }}
              className="w-full min-h-[44px] rounded-xl border border-dashed border-zinc-300 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 transition flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restaurar Lista Original dos 57 Monitores</span>
            </button>
          </div>
        </div>
      )}

      {/* SEÇÃO 2: USUÁRIOS DA EQUIPE D */}
      {secaoAtiva === 'usuarios' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                Usuários Autorizados ({usuarios.length})
              </h3>
              <p className="text-[11px] text-zinc-500">
                Apenas coordenadores podem criar acessos
              </p>
            </div>
            <button
              onClick={() => setModalUsuarioAberto(true)}
              className="min-h-[40px] rounded-xl bg-teal-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-600 active:scale-95 transition flex items-center gap-1 shadow-xs"
            >
              <UserPlus className="h-4 w-4" />
              <span>Criar Conta</span>
            </button>
          </div>

          <div className="space-y-2">
            {usuarios.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-xl bg-white p-3 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 text-xs"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-zinc-900 dark:text-white truncate">
                      {u.nome}
                    </span>
                    {u.id === usuarioAtual?.id && (
                      <span className="rounded bg-teal-100 text-teal-800 px-1.5 py-0.2 text-[9px] font-bold dark:bg-teal-950 dark:text-teal-300">
                        Você
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-500 truncate">{u.email}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span
                      className={`font-semibold uppercase text-[10px] ${
                        u.perfil === 'coordenador' ? 'text-amber-600 dark:text-amber-400' : 'text-teal-600'
                      }`}
                    >
                      {u.perfil}
                    </span>
                    <span className="text-zinc-400">•</span>
                    <span className={u.ativo ? 'text-emerald-600' : 'text-red-500'}>
                      {u.ativo ? 'Ativo' : 'Desativado'}
                    </span>
                  </div>
                </div>

                {u.id !== usuarioAtual?.id && (
                  <button
                    onClick={() => alternarStatusUsuario(u.id)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition shrink-0 ${
                      u.ativo
                        ? 'bg-zinc-100 text-zinc-700 hover:bg-red-50 hover:text-red-700 dark:bg-zinc-800 dark:text-zinc-300'
                        : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                    }`}
                  >
                    {u.ativo ? 'Desativar' : 'Reativar'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEÇÃO 3: REGISTRO RETROATIVO */}
      {secaoAtiva === 'retroativo' && (
        <form onSubmit={executarRegistroRetroativo} className="space-y-3">
          <div className="rounded-2xl bg-teal-50 p-3.5 border border-teal-200 text-xs text-teal-900 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300">
            <h4 className="font-bold text-teal-950 dark:text-teal-300 mb-1 flex items-center gap-1.5">
              <Shield className="h-4 w-4" /> Correção Manual de Esquecimento
            </h4>
            Permite ao coordenador atribuir ou remover presença retroativa para qualquer monitor em qualquer dia e turno do congresso.
          </div>

          {/* Selecionar Monitor */}
          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
              Monitor
            </label>
            <select
              value={retroMonitorId}
              onChange={(e) => setRetroMonitorId(e.target.value)}
              className="w-full min-h-[46px] rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 focus:border-teal-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {monitores.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome} ({m.grupo}{m.turno ? ` - ${m.turno}` : ''})
                </option>
              ))}
            </select>
          </div>

          {/* Selecionar Dia */}
          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
              Dia do Congresso
            </label>
            <select
              value={retroDia}
              onChange={(e) => setRetroDia(Number(e.target.value) as DiaIndex)}
              className="w-full min-h-[46px] rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 focus:border-teal-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {DIAS_CONGRESSO.map((d) => (
                <option key={d.index} value={d.index}>
                  {d.diaSemana} ({d.diaMes}) - {d.descricao}
                </option>
              ))}
            </select>
          </div>

          {/* Selecionar Turno */}
          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
              Turno
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRetroTurno('MANHA')}
                className={`min-h-[44px] rounded-xl font-bold text-xs border transition ${
                  retroTurno === 'MANHA'
                    ? 'bg-teal-700 text-white border-teal-600'
                    : 'bg-white text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800'
                }`}
              >
                Manhã
              </button>
              <button
                type="button"
                onClick={() => setRetroTurno('TARDE')}
                className={`min-h-[44px] rounded-xl font-bold text-xs border transition ${
                  retroTurno === 'TARDE'
                    ? 'bg-teal-700 text-white border-teal-600'
                    : 'bg-white text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800'
                }`}
              >
                Tarde
              </button>
            </div>
          </div>

          {/* Ação: Atribuir ou Remover */}
          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
              Ação Desejada
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRetroAcao('MARCAR')}
                className={`min-h-[44px] rounded-xl font-bold text-xs border transition ${
                  retroAcao === 'MARCAR'
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-white text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800'
                }`}
              >
                + Atribuir Presença
              </button>
              <button
                type="button"
                onClick={() => setRetroAcao('DESMARCAR')}
                className={`min-h-[44px] rounded-xl font-bold text-xs border transition ${
                  retroAcao === 'DESMARCAR'
                    ? 'bg-red-600 text-white border-red-500'
                    : 'bg-white text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800'
                }`}
              >
                - Remover Presença
              </button>
            </div>
          </div>

          {/* Justificativa */}
          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
              Justificativa do Ajuste
            </label>
            <input
              type="text"
              value={retroJustificativa}
              onChange={(e) => setRetroJustificativa(e.target.value)}
              placeholder="Ex: Monitor atuou na recepção e esqueceu de marcar"
              className="w-full min-h-[46px] rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-900 focus:border-teal-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>

          <button
            type="submit"
            className="w-full min-h-[48px] rounded-xl bg-teal-800 font-bold text-white hover:bg-teal-700 active:scale-98 transition shadow-sm"
          >
            Confirmar e Salvar Ajuste
          </button>
        </form>
      )}

      {/* SEÇÃO 4: LOG DAS ÚLTIMAS 50 AÇÕES */}
      {secaoAtiva === 'logs' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                Histórico de Auditoria
              </h3>
              <p className="text-[11px] text-zinc-500">Últimas 50 ações gerais do sistema</p>
            </div>
            <button
              onClick={() => setHistoricoAberto(true)}
              className="flex items-center gap-1.5 rounded-xl bg-teal-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-700 active:scale-95 transition shadow-xs dark:bg-teal-700"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Auditoria de Presenças</span>
            </button>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-0.5">
            {logs.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-6">Nenhuma ação registrada ainda.</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl bg-white p-3 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 text-xs"
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">
                      {log.usuarioNome}
                    </span>
                    <span>
                      {new Date(log.timestamp).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })} • {new Date(log.timestamp).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-zinc-800 dark:text-zinc-200 leading-snug">
                    {log.detalhes}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL EDITAR / CRIAR MONITOR */}
      {modalMonitorAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold text-base">
                {monitorEmEdicao ? 'Editar Monitor' : 'Novo Monitor'}
              </h3>
              <button
                onClick={() => setModalMonitorAberto(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={salvarMonitor} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold block mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={formNomeMonitor}
                  onChange={(e) => setFormNomeMonitor(e.target.value)}
                  placeholder="Nome do monitor"
                  className="w-full min-h-[46px] rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-900 focus:border-teal-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Grupo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormGrupoMonitor('LAQI')}
                    className={`min-h-[44px] rounded-xl font-bold text-xs border ${
                      formGrupoMonitor === 'LAQI'
                        ? 'bg-teal-700 text-white border-teal-600'
                        : 'bg-white text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    LAQI (41)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormGrupoMonitor('EXTERNO')}
                    className={`min-h-[44px] rounded-xl font-bold text-xs border ${
                      formGrupoMonitor === 'EXTERNO'
                        ? 'bg-teal-700 text-white border-teal-600'
                        : 'bg-white text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    Externo (16)
                  </button>
                </div>
              </div>

              {formGrupoMonitor === 'EXTERNO' && (
                <div>
                  <label className="text-xs font-bold block mb-1">Turno Exigido (Externo)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormTurnoMonitor('MANHA')}
                      className={`min-h-[44px] rounded-xl font-bold text-xs border ${
                        formTurnoMonitor === 'MANHA'
                          ? 'bg-sky-700 text-white border-sky-600'
                          : 'bg-white text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}
                    >
                      Manhã
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormTurnoMonitor('TARDE')}
                      className={`min-h-[44px] rounded-xl font-bold text-xs border ${
                        formTurnoMonitor === 'TARDE'
                          ? 'bg-sky-700 text-white border-sky-600'
                          : 'bg-white text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}
                    >
                      Tarde
                    </button>
                  </div>
                </div>
              )}

              {monitorEmEdicao && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="chkAtivo"
                    checked={formAtivoMonitor}
                    onChange={(e) => setFormAtivoMonitor(e.target.checked)}
                    className="h-4 w-4 rounded accent-teal-600"
                  />
                  <label htmlFor="chkAtivo" className="text-xs font-medium cursor-pointer">
                    Monitor Ativo
                  </label>
                </div>
              )}

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalMonitorAberto(false)}
                  className="flex-1 min-h-[48px] rounded-xl border border-zinc-300 font-medium text-xs text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[48px] rounded-xl bg-teal-700 font-bold text-xs text-white hover:bg-teal-600"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CRIAR USUÁRIO */}
      {modalUsuarioAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold text-base">Convidar membro da Equipe D</h3>
              <button
                onClick={() => setModalUsuarioAberto(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={salvarUsuario} className="mt-4 space-y-3">
              <p className="text-xs leading-relaxed text-zinc-500">
                Enviaremos um link de convite para o endereço informado. A pessoa definirá a própria senha no primeiro acesso.
              </p>
              <div>
                <label className="text-xs font-bold block mb-1">Nome</label>
                <input
                  type="text"
                  required
                  value={formNomeUsuario}
                  onChange={(e) => setFormNomeUsuario(e.target.value)}
                  placeholder="Nome do operador"
                  className="w-full min-h-[46px] rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-900 focus:border-teal-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  value={formEmailUsuario}
                  onChange={(e) => setFormEmailUsuario(e.target.value)}
                  placeholder="email@conquitech.ufma.br"
                  className="w-full min-h-[46px] rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-900 focus:border-teal-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Perfil de Acesso</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormPerfilUsuario('equipe')}
                    className={`min-h-[44px] rounded-xl font-bold text-xs border ${
                      formPerfilUsuario === 'equipe'
                        ? 'bg-teal-700 text-white border-teal-600'
                        : 'bg-white text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    Equipe (Registrar)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormPerfilUsuario('coordenador')}
                    className={`min-h-[44px] rounded-xl font-bold text-xs border ${
                      formPerfilUsuario === 'coordenador'
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-white text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    Coordenador (Total)
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalUsuarioAberto(false)}
                  className="flex-1 min-h-[48px] rounded-xl border border-zinc-300 font-medium text-xs text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[48px] rounded-xl bg-teal-700 font-bold text-xs text-white hover:bg-teal-600"
                >
                  Enviar convite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Auditoria de Presenças dos Coordenadores */}
      <HistoricoPresencasModal
        aberto={historicoAberto}
        onFechar={() => setHistoricoAberto(false)}
      />
    </div>
  );
};
