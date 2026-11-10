/**
 * Regras de Negócio e Configuração do Congresso CONQUITECH-MA
 * Equipe D - I Congresso de Química, Indústria e Tecnologia do Maranhão (UFMA / LAQI)
 * Período: 30/11/2026 a 04/12/2026
 */

export type Grupo = 'LAQI' | 'EXTERNO';
export type Turno = 'MANHA' | 'TARDE';
export type DiaIndex = 0 | 1 | 2 | 3 | 4;

export interface DiaConfig {
  index: DiaIndex;
  codigo: string;
  diaSemana: string;
  diaMes: string;
  dataCompleta: string; // YYYY-MM-DD
  descricao: string;
  temManha: boolean;
  temTarde: boolean;
  avisoTarde?: string;
}

export const DIAS_CONGRESSO: DiaConfig[] = [
  {
    index: 0,
    codigo: 'SEG',
    diaSemana: 'Seg',
    diaMes: '30/11',
    dataCompleta: '2026-11-30',
    descricao: 'Segunda-feira, 30 de Novembro de 2026',
    temManha: true,
    temTarde: true,
  },
  {
    index: 1,
    codigo: 'TER',
    diaSemana: 'Ter',
    diaMes: '01/12',
    dataCompleta: '2026-12-01',
    descricao: 'Terça-feira, 01 de Dezembro de 2026',
    temManha: true,
    temTarde: true,
  },
  {
    index: 2,
    codigo: 'QUA',
    diaSemana: 'Qua',
    diaMes: '02/12',
    dataCompleta: '2026-12-02',
    descricao: 'Quarta-feira, 02 de Dezembro de 2026',
    temManha: true,
    temTarde: true,
  },
  {
    index: 3,
    codigo: 'QUI',
    diaSemana: 'Qui',
    diaMes: '03/12',
    dataCompleta: '2026-12-03',
    descricao: 'Quinta-feira, 03 de Dezembro de 2026',
    temManha: true,
    temTarde: true,
  },
  {
    index: 4,
    codigo: 'SEX',
    diaSemana: 'Sex',
    diaMes: '04/12',
    dataCompleta: '2026-12-04',
    descricao: 'Sexta-feira, 04 de Dezembro de 2026 (Encerramento pela manhã)',
    temManha: true,
    temTarde: false, // Na sexta à tarde não há programação
    avisoTarde: 'Sem programação na tarde de sexta-feira (04/12). Registros bloqueados.',
  },
];

export interface Monitor {
  id: string;
  nome: string;
  grupo: Grupo;
  turno?: Turno; // Requerido para EXTERNO: 'MANHA' ou 'TARDE'
  ativo: boolean;
  criadoEm?: number;
  atualizadoEm?: number;
}

export interface Presenca {
  id: string; // formato: `${monitorId}_${dia}_${turno}`
  monitorId: string;
  dia: DiaIndex;
  turno: Turno;
  registradoPor: string; // uid ou email do operador
  registradoPorNome?: string;
  registradoPorEmail?: string;
  registradoPorPerfil?: string;
  timestamp: number;
}

export interface AcaoLog {
  id: string;
  timestamp: number;
  usuarioId: string;
  usuarioNome: string;
  tipo:
    | 'PRESENCA_MARCADA'
    | 'PRESENCA_DESFEITA'
    | 'REGISTRO_RETROATIVO'
    | 'SINCRONIZACAO_OFFLINE'
    | 'MONITOR_CRIADO'
    | 'MONITOR_EDITADO'
    | 'MONITOR_EXCLUIDO'
    | 'USUARIO_CRIADO'
    | 'USUARIO_STATUS';
  detalhes: string;
}

export interface ResultadoAptidao {
  isApto: boolean;
  diasPresentes: number;
  diasExigidos: number;
  progressoPercent: number;
  texto: string;
  detalhes: string;
  diasComPresenca: number[]; // índices dos dias com presença válida
  turnosPresentesCount: number;
}

/**
 * REGRAS DE APTIDÃO AO CERTIFICADO:
 * - LAQI: APTO se tiver presença em pelo menos 4 dos 5 dias, contando o dia se houve presença na manhã OU na tarde.
 * - EXTERNO: APTO se tiver presença em todos os dias exigidos do seu turno:
 *     - Manhã: os 5 dias (segunda a sexta).
 *     - Tarde: 4 dias (segunda a quinta, pois sexta não tem programação à tarde).
 */
export const REGRAS_CERTIFICADO = {
  LAQI: {
    diasExigidos: 4,
    diasTotais: 5,
    criterioDescricao: 'Presença em no mínimo 4 dos 5 dias do congresso (em qualquer turno: manhã ou tarde).',
  },
  EXTERNO_MANHA: {
    diasExigidos: 5,
    diasTotais: 5,
    criterioDescricao: 'Presença em todos os 5 dias no turno da manhã (segunda a sexta).',
  },
  EXTERNO_TARDE: {
    diasExigidos: 4,
    diasTotais: 4,
    criterioDescricao: 'Presença em todos os 4 dias com atividades no turno da tarde (segunda a quinta).',
  },
};

/**
 * Calcula em tempo real a aptidão de um monitor com base no histórico de presenças
 */
export function calcularAptidao(monitor: Monitor, todasPresencas: Presenca[]): ResultadoAptidao {
  const presencasDoMonitor = todasPresencas.filter((p) => p.monitorId === monitor.id);

  if (monitor.grupo === 'LAQI') {
    // LAQI: conta dias distintos com presença em MANHA OU TARDE
    const diasSet = new Set<number>();
    presencasDoMonitor.forEach((p) => diasSet.add(p.dia));
    const diasPresentes = diasSet.size;
    const diasExigidos = REGRAS_CERTIFICADO.LAQI.diasExigidos;
    const isApto = diasPresentes >= diasExigidos;
    const progressoPercent = Math.min(100, Math.round((diasPresentes / diasExigidos) * 100));

    return {
      isApto,
      diasPresentes,
      diasExigidos,
      progressoPercent,
      texto: `${diasPresentes} de ${diasExigidos} dias`,
      detalhes: `${diasPresentes}/5 dias com presença (exigido mín. ${diasExigidos})`,
      diasComPresenca: Array.from(diasSet).sort((a, b) => a - b),
      turnosPresentesCount: presencasDoMonitor.length,
    };
  }

  // EXTERNO
  const turno = monitor.turno || 'MANHA';
  if (turno === 'MANHA') {
    // Conta presenças no turno da MANHA
    const diasManhaSet = new Set<number>();
    presencasDoMonitor
      .filter((p) => p.turno === 'MANHA')
      .forEach((p) => diasManhaSet.add(p.dia));
    const diasPresentes = diasManhaSet.size;
    const diasExigidos = REGRAS_CERTIFICADO.EXTERNO_MANHA.diasExigidos;
    const isApto = diasPresentes >= diasExigidos;
    const progressoPercent = Math.min(100, Math.round((diasPresentes / diasExigidos) * 100));

    return {
      isApto,
      diasPresentes,
      diasExigidos,
      progressoPercent,
      texto: `${diasPresentes} de ${diasExigidos} dias`,
      detalhes: `Manhã: ${diasPresentes}/${diasExigidos} dias cumpridos`,
      diasComPresenca: Array.from(diasManhaSet).sort((a, b) => a - b),
      turnosPresentesCount: diasManhaSet.size,
    };
  } else {
    // EXTERNO TARDE: dias 0 a 3 (segunda a quinta)
    const diasTardeSet = new Set<number>();
    presencasDoMonitor
      .filter((p) => p.turno === 'TARDE' && p.dia < 4)
      .forEach((p) => diasTardeSet.add(p.dia));
    const diasPresentes = diasTardeSet.size;
    const diasExigidos = REGRAS_CERTIFICADO.EXTERNO_TARDE.diasExigidos;
    const isApto = diasPresentes >= diasExigidos;
    const progressoPercent = Math.min(100, Math.round((diasPresentes / diasExigidos) * 100));

    return {
      isApto,
      diasPresentes,
      diasExigidos,
      progressoPercent,
      texto: `${diasPresentes} de ${diasExigidos} dias`,
      detalhes: `Tarde: ${diasPresentes}/${diasExigidos} dias cumpridos (Sex s/ prog.)`,
      diasComPresenca: Array.from(diasTardeSet).sort((a, b) => a - b),
      turnosPresentesCount: diasTardeSet.size,
    };
  }
}

/**
 * Detecta automaticamente o dia do congresso com base na data atual
 * Se estiver antes de 30/11/2026, retorna 0 (primeiro dia)
 * Se estiver depois de 04/12/2026, retorna 4 (último dia)
 */
export function detectarDiaAtual(): DiaIndex {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = agora.getMonth() + 1; // 1-12
  const dia = agora.getDate();

  // Se estiver no ano de 2026 e mês 11 ou 12
  if (ano === 2026) {
    if (mes === 11 && dia === 30) return 0;
    if (mes === 12) {
      if (dia === 1) return 1;
      if (dia === 2) return 2;
      if (dia === 3) return 3;
      if (dia >= 4) return 4;
    }
  }

  // Padrão amigável para testes/antecipação: primeiro dia (0=30/11)
  return 0;
}

/**
 * Detecta o turno padrão pelo horário atual
 * Antes das 13h = Manhã; a partir das 13h = Tarde
 */
export function detectarTurnoAtual(): Turno {
  const horas = new Date().getHours();
  return horas < 13 ? 'MANHA' : 'TARDE';
}
