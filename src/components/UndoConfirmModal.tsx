import React from 'react';
import { AlertCircle, UserCheck } from 'lucide-react';
import { Monitor, DiaIndex, Turno, DIAS_CONGRESSO, Presenca } from '../rules';

interface UndoConfirmModalProps {
  monitor: Monitor | null;
  dia: DiaIndex;
  turno: Turno;
  presenca?: Presenca | null;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export const UndoConfirmModal: React.FC<UndoConfirmModalProps> = ({
  monitor,
  dia,
  turno,
  presenca,
  onConfirmar,
  onCancelar,
}) => {
  if (!monitor) return null;

  const diaConfig = DIAS_CONGRESSO[dia];
  const horaStr = presenca
    ? new Date(presenca.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-[32px] bg-white/95 p-6 shadow-2xl dark:bg-[#162e30]/95 border border-white/80 dark:border-teal-500/25 text-zinc-900 dark:text-zinc-100 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-black text-base leading-tight">Desfazer Presença?</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Confirme se deseja remover o registro.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-zinc-50/80 p-3.5 text-sm dark:bg-[#112325]/70 border border-zinc-200/60 dark:border-teal-500/15">
          <p className="font-bold text-zinc-800 dark:text-zinc-200">{monitor.nome}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="rounded-full bg-teal-100 px-2.5 py-0.5 font-bold text-[#007a87] dark:bg-teal-950 dark:text-teal-300">
              {monitor.grupo} {monitor.turno ? `• ${monitor.turno}` : ''}
            </span>
            <span>
              {diaConfig.diaSemana} ({diaConfig.diaMes}) • {turno === 'MANHA' ? 'Manhã' : 'Tarde'}
            </span>
          </div>

          {presenca?.registradoPorNome && (
            <div className="mt-2.5 flex items-center gap-1.5 rounded-xl bg-teal-50/80 px-2.5 py-1.5 text-xs text-teal-900 dark:bg-teal-950/50 dark:text-teal-300 border border-teal-200/50 dark:border-teal-800/40">
              <UserCheck className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>
                Marcado por <strong>{presenca.registradoPorNome}</strong>
                {horaStr ? ` às ${horaStr}` : ''}
              </span>
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-2.5">
          <button
            onClick={onCancelar}
            className="flex-1 min-h-[48px] rounded-full border border-zinc-300 bg-white font-bold text-xs text-zinc-700 hover:bg-zinc-50 active:scale-98 transition dark:border-teal-500/20 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            className="flex-1 min-h-[48px] rounded-full bg-red-600 font-bold text-xs text-white shadow-md hover:bg-red-700 active:scale-98 transition"
          >
            Sim, Desfazer
          </button>
        </div>
      </div>
    </div>
  );
};
