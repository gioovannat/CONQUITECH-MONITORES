import React from 'react';
import { ClipboardCheck, Award, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type TabTipo = 'registrar' | 'status' | 'admin';

interface BottomNavProps {
  abaAtiva: TabTipo;
  onSelecionarAba: (aba: TabTipo) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ abaAtiva, onSelecionarAba }) => {
  const { usuarioAtual } = useAuth();
  const ehCoordenador = usuarioAtual?.perfil === 'coordenador';

  return (
    <nav className="fixed bottom-3 left-0 right-0 z-40 px-4 pointer-events-none">
      <div className="mx-auto max-w-[360px] pointer-events-auto">
        {/* Floating Capsule Dock inspirado no layout do anexo */}
        <div className="flex items-center justify-around gap-1 rounded-full bg-[#112426]/95 backdrop-blur-2xl p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.3)] border border-white/20">
          {/* Aba 1: Registrar */}
          <button
            onClick={() => onSelecionarAba('registrar')}
            className={`min-h-[46px] transition-all duration-200 flex items-center justify-center ${
              abaAtiva === 'registrar'
                ? 'rounded-full bg-white text-[#007a87] px-4 py-2 shadow-md font-black text-xs gap-1.5'
                : 'h-11 w-11 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95'
            }`}
            aria-label="Registrar Presença"
          >
            <ClipboardCheck className={`h-5 w-5 ${abaAtiva === 'registrar' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            {abaAtiva === 'registrar' && <span>Registrar</span>}
          </button>

          {/* Aba 2: Status */}
          <button
            onClick={() => onSelecionarAba('status')}
            className={`min-h-[46px] transition-all duration-200 flex items-center justify-center ${
              abaAtiva === 'status'
                ? 'rounded-full bg-white text-[#007a87] px-4 py-2 shadow-md font-black text-xs gap-1.5'
                : 'h-11 w-11 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95'
            }`}
            aria-label="Status e Certificados"
          >
            <Award className={`h-5 w-5 ${abaAtiva === 'status' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            {abaAtiva === 'status' && <span>Status</span>}
          </button>

          {/* Aba 3: Admin (Visível apenas ao coordenador) */}
          {ehCoordenador && (
            <button
              onClick={() => onSelecionarAba('admin')}
              className={`min-h-[46px] transition-all duration-200 flex items-center justify-center ${
                abaAtiva === 'admin'
                  ? 'rounded-full bg-white text-[#007a87] px-4 py-2 shadow-md font-black text-xs gap-1.5'
                  : 'h-11 w-11 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95'
              }`}
              aria-label="Painel Administrativo"
            >
              <Shield className={`h-5 w-5 ${abaAtiva === 'admin' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              {abaAtiva === 'admin' && <span>Admin</span>}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
