import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  ClipboardCheck,
  Award,
  WifiOff,
  Bell,
  CheckCircle2,
  Sparkles,
  Search,
  Calendar,
  Check,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { TabTipo } from './BottomNav';

interface OnboardingTourProps {
  aberto: boolean;
  onFechar: () => void;
  onMudarAba?: (aba: TabTipo) => void;
}

interface PassoTour {
  titulo: string;
  subtitulo: string;
  abaDesejada?: TabTipo;
  badge: string;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  aberto,
  onFechar,
  onMudarAba,
}) => {
  const [passoAtual, setPassoAtual] = useState(0);

  const totalPassos = 4;

  useEffect(() => {
    if (aberto) {
      setPassoAtual(0);
    }
  }, [aberto]);

  if (!aberto) return null;

  const avancar = () => {
    if (passoAtual < totalPassos - 1) {
      const prox = passoAtual + 1;
      setPassoAtual(prox);
      if (prox === 1 && onMudarAba) onMudarAba('registrar');
      if (prox === 2 && onMudarAba) onMudarAba('status');
      if (prox === 3 && onMudarAba) onMudarAba('registrar');
    } else {
      concluir();
    }
  };

  const voltar = () => {
    if (passoAtual > 0) {
      const ant = passoAtual - 1;
      setPassoAtual(ant);
      if (ant === 1 && onMudarAba) onMudarAba('registrar');
      if (ant === 2 && onMudarAba) onMudarAba('status');
      if (ant === 0 && onMudarAba) onMudarAba('registrar');
    }
  };

  const concluir = () => {
    if (onMudarAba) onMudarAba('registrar');
    onFechar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-[32px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-white/80 overflow-hidden flex flex-col text-zinc-900">
        {/* Barra Superior com Indicador de Progresso e Botão Pular */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-zinc-100 bg-gradient-to-r from-teal-50/60 to-emerald-50/60">
          <div className="flex items-center gap-2">
            <span className="flex h-6 px-2.5 items-center justify-center rounded-full bg-[#007a87] text-white text-[11px] font-black tracking-wide">
              {passoAtual + 1} de {totalPassos}
            </span>
            <span className="text-xs font-bold text-zinc-500">
              {passoAtual === 0
                ? 'Boas-vindas'
                : passoAtual === 1
                ? 'Onde Registrar'
                : passoAtual === 2
                ? 'Verificar Status'
                : 'Alertas & Offline'}
            </span>
          </div>

          <button
            type="button"
            onClick={concluir}
            className="text-xs font-bold text-zinc-400 hover:text-zinc-700 px-2.5 py-1 rounded-full hover:bg-zinc-100 transition"
          >
            Pular Tour
          </button>
        </div>

        {/* Linha visual de progresso */}
        <div className="w-full bg-zinc-100 h-1">
          <div
            className="bg-gradient-to-r from-[#007a87] to-teal-400 h-1 transition-all duration-300"
            style={{ width: `${((passoAtual + 1) / totalPassos) * 100}%` }}
          />
        </div>

        {/* Corpo do Passo com Conteúdo Especializado */}
        <div className="p-5 overflow-y-auto max-h-[68vh]">
          {/* PASSO 0: BOAS-VINDAS */}
          {passoAtual === 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="flex items-center justify-center">
                <div className="relative h-20 w-20 rounded-3xl bg-teal-50 border border-teal-200 p-2 shadow-sm flex items-center justify-center">
                  <img
                    src="/assets/aistudio/logo_conquitech_oficial.png"
                    alt="Logo CONQUITECH"
                    className="h-full w-full object-contain"
                  />
                  <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#007a87] text-white shadow-xs">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>

              <div className="text-center space-y-1">
                <span className="inline-block rounded-full bg-teal-500/15 text-[#007a87] px-3 py-0.5 text-[11px] font-black uppercase tracking-wider">
                  Equipe D • LAQI / UFMA
                </span>
                <h3 className="text-xl font-black text-zinc-900 tracking-tight">
                  Bem-vindo ao Presença CONQUITECH!
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed max-w-xs mx-auto">
                  App oficial para controle de frequência e certificação dos monitores no <strong>I Congresso de Química, Indústria e Tecnologia do Maranhão</strong> (30/11 a 04/12/2026).
                </p>
              </div>

              <div className="rounded-2xl bg-teal-50/70 border border-teal-200/80 p-3.5 text-xs space-y-2 text-zinc-700">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#007a87] shrink-0 mt-0.5" />
                  <span><strong>Em menos de 1 minuto:</strong> Veja como registrar sua presença diária e consultar o progresso para emissão do seu certificado.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <WifiOff className="h-4 w-4 text-[#007a87] shrink-0 mt-0.5" />
                  <span><strong>100% Offline:</strong> Funciona mesmo se o sinal de internet cair dentro dos auditórios da universidade.</span>
                </div>
              </div>
            </div>
          )}

          {/* PASSO 1: ONDE E COMO REGISTRAR A PRESENÇA */}
          {passoAtual === 1 && (
            <div className="space-y-3.5 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500/15 text-[#007a87]">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#007a87] block">
                    Passo 1 • Aba Registrar
                  </span>
                  <h3 className="text-base font-black text-zinc-900 leading-tight">
                    Onde e Como Registrar sua Presença
                  </h3>
                </div>
              </div>

              <p className="text-xs text-zinc-600 leading-relaxed">
                O registro é rápido e realizado na aba <strong>"Registrar"</strong> (primeiro botão da barra inferior):
              </p>

              <div className="space-y-2">
                <div className="rounded-2xl p-3 bg-zinc-50 border border-zinc-200 flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#007a87] text-white text-xs font-black">
                    1
                  </span>
                  <div className="text-xs">
                    <strong className="block text-zinc-900 font-bold">Selecione o Dia e o Turno</strong>
                    <span className="text-zinc-600 text-[11px]">
                      Escolha o dia da semana (Seg a Sex) e o turno ativo (<strong>Manhã</strong> ou <strong>Tarde</strong>).
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl p-3 bg-zinc-50 border border-zinc-200 flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#007a87] text-white text-xs font-black">
                    2
                  </span>
                  <div className="text-xs">
                    <strong className="block text-zinc-900 font-bold">Localize seu Nome</strong>
                    <span className="text-zinc-600 text-[11px]">
                      Use o campo de busca digitando as primeiras letras do seu nome ou filtre por grupo (LAQI ou Externos).
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl p-3 bg-emerald-50/80 border border-emerald-200 flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-black">
                    3
                  </span>
                  <div className="text-xs">
                    <strong className="block text-emerald-950 font-bold">Toque no Botão de Check</strong>
                    <span className="text-emerald-800 text-[11px]">
                      Toque no botão circular verde para confirmar a presença. Ela é gravada imediatamente com data, hora e operador.
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-amber-50 p-2.5 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
                <span className="font-black text-amber-700 shrink-0">💡 Dica:</span>
                <span>Se marcar por engano, você pode desfazer o registro rapidamente com confirmação de segurança.</span>
              </div>
            </div>
          )}

          {/* PASSO 2: COMO VERIFICAR SEU STATUS E CERTIFICADO */}
          {passoAtual === 2 && (
            <div className="space-y-3.5 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">
                    Passo 2 • Aba Status
                  </span>
                  <h3 className="text-base font-black text-zinc-900 leading-tight">
                    Como Verificar seu Status e Certificado
                  </h3>
                </div>
              </div>

              <p className="text-xs text-zinc-600 leading-relaxed">
                Na aba <strong>"Status"</strong> (ícone de medalha), você acompanha em tempo real se já cumpriu a carga horária para emissão do certificado:
              </p>

              <div className="space-y-2">
                <div className="rounded-2xl p-3 bg-teal-50/80 border border-teal-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="h-2 w-2 rounded-full bg-[#007a87]" />
                    <strong className="text-xs text-zinc-900 font-black">Monitores LAQI (41 vagas)</strong>
                  </div>
                  <p className="text-[11px] text-zinc-700 leading-relaxed">
                    Exige presença em <strong>no mínimo 4 dos 5 dias</strong> do evento. Se você marcou presença na <em>manhã</em> OU na <em>tarde</em>, aquele dia já conta como cumprido!
                  </p>
                </div>

                <div className="rounded-2xl p-3 bg-blue-50/80 border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="h-2 w-2 rounded-full bg-blue-600" />
                    <strong className="text-xs text-zinc-900 font-black">Monitores Externos</strong>
                  </div>
                  <ul className="text-[11px] text-zinc-700 space-y-1 list-disc list-inside">
                    <li><strong>Turno Manhã:</strong> 5 presenças obrigatórias (segunda a sexta).</li>
                    <li><strong>Turno Tarde:</strong> 4 presenças obrigatórias (segunda a quinta; sexta à tarde não há programação!).</li>
                  </ul>
                </div>

                <div className="rounded-2xl p-2.5 bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-950 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Assim que atingir a meta, o selo verde "Apto ao Certificado" é ativado automaticamente.</span>
                </div>
              </div>
            </div>
          )}

          {/* PASSO 3: ALERTAS E FUNCIONAMENTO OFFLINE */}
          {passoAtual === 3 && (
            <div className="space-y-3.5 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500/15 text-[#007a87]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#007a87] block">
                    Passo 3 • Recursos Extras
                  </span>
                  <h3 className="text-base font-black text-zinc-900 leading-tight">
                    Alertas Locais & Modo Offline
                  </h3>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="rounded-2xl p-3 bg-zinc-50 border border-zinc-200 flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-[#007a87]">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="text-xs">
                    <strong className="block text-zinc-900 font-bold">Alertas de Atividades Abertas</strong>
                    <span className="text-zinc-600 text-[11px] leading-relaxed block mt-0.5">
                      O sininho e a faixa no topo avisam quando o registro de uma atividade específica está aberto para o seu turno (ex: Credenciamento, Palestra Magna, Minicurso).
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl p-3 bg-amber-50/70 border border-amber-200 flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                    <WifiOff className="h-4 w-4" />
                  </div>
                  <div className="text-xs">
                    <strong className="block text-zinc-900 font-bold">Banco Local IndexedDB</strong>
                    <span className="text-zinc-700 text-[11px] leading-relaxed block mt-0.5">
                      Ficou sem Wi-Fi ou dados móveis? Pode continuar registrando normalmente! Tudo fica salvo no aparelho e sincroniza automaticamente assim que a conexão retornar.
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl p-3 bg-teal-50/70 border border-teal-200 flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-[#007a87]">
                    <HelpCircle className="h-4 w-4" />
                  </div>
                  <div className="text-xs">
                    <strong className="block text-zinc-900 font-bold">Quer rever este guia?</strong>
                    <span className="text-zinc-600 text-[11px] leading-relaxed block mt-0.5">
                      Toque no ícone de interrogação <strong>(?)</strong> na barra superior a qualquer momento para abrir este tour novamente.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com Navegação Tátil */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between gap-2">
          {/* Indicadores de bolinhas */}
          <div className="flex items-center gap-1.5 pl-1">
            {Array.from({ length: totalPassos }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPassoAtual(idx);
                  if (idx === 1 && onMudarAba) onMudarAba('registrar');
                  if (idx === 2 && onMudarAba) onMudarAba('status');
                  if ((idx === 0 || idx === 3) && onMudarAba) onMudarAba('registrar');
                }}
                className={`h-2.5 rounded-full transition-all ${
                  passoAtual === idx
                    ? 'w-7 bg-[#007a87]'
                    : 'w-2.5 bg-zinc-300 hover:bg-zinc-400'
                }`}
                aria-label={`Ir para o passo ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {passoAtual > 0 && (
              <button
                type="button"
                onClick={voltar}
                className="min-h-[44px] px-3.5 rounded-2xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-100 active:scale-95 transition flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Voltar</span>
              </button>
            )}

            <button
              type="button"
              onClick={avancar}
              className="min-h-[44px] px-5 rounded-2xl bg-gradient-to-r from-[#007a87] to-teal-600 text-white text-xs font-extrabold shadow-md hover:opacity-95 active:scale-95 transition flex items-center gap-1.5"
            >
              <span>{passoAtual === totalPassos - 1 ? 'Começar a Usar' : 'Próximo'}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
