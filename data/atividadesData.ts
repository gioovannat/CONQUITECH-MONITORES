import { DiaIndex, Turno } from '../rules';

export type PublicoAlvoAtividade = 'TODOS' | 'LAQI_E_MANHA' | 'LAQI_E_TARDE';

export interface AtividadeCongresso {
  id: string;
  dia: DiaIndex;
  turno: Turno;
  titulo: string;
  categoria: 'Credenciamento' | 'Palestra' | 'Minicurso' | 'Mesa-Redonda' | 'Sessão Técnica' | 'Encerramento';
  local: string;
  horarioInicio: string; // HH:MM
  horarioFim: string;    // HH:MM
  descricao: string;
  abertoParaRegistro: boolean;
  publicoAlvo: PublicoAlvoAtividade;
}

export interface NotificacaoItem {
  id: string;
  atividadeId: string;
  titulo: string;
  mensagem: string;
  dia: DiaIndex;
  turno: Turno;
  publicoAlvo: PublicoAlvoAtividade;
  timestamp: number;
  lida: boolean;
  disparadaEm: string;
}

export const ATIVIDADES_INICIAIS: AtividadeCongresso[] = [
  // DIA 0: 30/11 (Segunda-feira)
  {
    id: 'ativ_0_1',
    dia: 0,
    turno: 'MANHA',
    titulo: 'Credenciamento Geral & Boas-Vindas aos Participantes',
    categoria: 'Credenciamento',
    local: 'Hall do Centro de Convenções UFMA',
    horarioInicio: '07:30',
    horarioFim: '09:00',
    descricao: 'Recepção dos congressistas, entrega de crachás, pastas institucionais e conferência de inscrições.',
    abertoParaRegistro: true, // Inicialmente aberto para demonstração imediata
    publicoAlvo: 'LAQI_E_MANHA',
  },
  {
    id: 'ativ_0_2',
    dia: 0,
    turno: 'MANHA',
    titulo: 'Palestra Magna: Química Verde e Inovação na Indústria Brasileira',
    categoria: 'Palestra',
    local: 'Auditório Central Paulo Freire',
    horarioInicio: '09:30',
    horarioFim: '12:00',
    descricao: 'Conferência inaugural com especialistas da indústria química e docentes da UFMA.',
    abertoParaRegistro: true,
    publicoAlvo: 'LAQI_E_MANHA',
  },
  {
    id: 'ativ_0_3',
    dia: 0,
    turno: 'TARDE',
    titulo: 'Mesa-Redonda: Transição Energética e Sustentabilidade no Maranhão',
    categoria: 'Mesa-Redonda',
    local: 'Auditório Setorial de Química',
    horarioInicio: '14:00',
    horarioFim: '18:00',
    descricao: 'Debate sobre o polo industrial de São Luís, hidrogênio verde e descarbonização.',
    abertoParaRegistro: false,
    publicoAlvo: 'LAQI_E_TARDE',
  },

  // DIA 1: 01/12 (Terça-feira)
  {
    id: 'ativ_1_1',
    dia: 1,
    turno: 'MANHA',
    titulo: 'Minicurso 1: Espectrometria de Massas e Aplicações Industriais',
    categoria: 'Minicurso',
    local: 'Laboratório Central de Análise Instrumental',
    horarioInicio: '08:00',
    horarioFim: '12:00',
    descricao: 'Treinamento prático e teórico para estudantes e profissionais da química.',
    abertoParaRegistro: false,
    publicoAlvo: 'LAQI_E_MANHA',
  },
  {
    id: 'ativ_1_2',
    dia: 1,
    turno: 'TARDE',
    titulo: 'Sessão Técnica Oral: Química dos Materiais e Nanotecnologia',
    categoria: 'Sessão Técnica',
    local: 'Salas Temáticas A e B',
    horarioInicio: '14:00',
    horarioFim: '18:00',
    descricao: 'Apresentação oral de artigos submetidos e avaliados pelo comitê científico.',
    abertoParaRegistro: false,
    publicoAlvo: 'LAQI_E_TARDE',
  },

  // DIA 2: 02/12 (Quarta-feira)
  {
    id: 'ativ_2_1',
    dia: 2,
    turno: 'MANHA',
    titulo: 'Workshop de Segurança de Processos Químicos e Biossegurança',
    categoria: 'Minicurso',
    local: 'Auditório Central Paulo Freire',
    horarioInicio: '08:00',
    horarioFim: '12:00',
    descricao: 'Normas regulamentadoras, gestão de resíduos e prevenção de acidentes industriais.',
    abertoParaRegistro: false,
    publicoAlvo: 'LAQI_E_MANHA',
  },
  {
    id: 'ativ_2_2',
    dia: 2,
    turno: 'TARDE',
    titulo: 'Mostra de Pôsteres Científicos & Rodada de Parcerias',
    categoria: 'Sessão Técnica',
    local: 'Espaço Multiuso do Congresso',
    horarioInicio: '14:00',
    horarioFim: '18:00',
    descricao: 'Exposição dos trabalhos aprovados com estandes de empresas parceiras do evento.',
    abertoParaRegistro: false,
    publicoAlvo: 'LAQI_E_TARDE',
  },

  // DIA 3: 03/12 (Quinta-feira)
  {
    id: 'ativ_3_1',
    dia: 3,
    turno: 'MANHA',
    titulo: 'Minicurso 2: Formulação e Controle de Qualidade de Cosméticos',
    categoria: 'Minicurso',
    local: 'Laboratório de Tecnologia Farmacêutica',
    horarioInicio: '08:00',
    horarioFim: '12:00',
    descricao: 'Estudo de matérias-primas da biodiversidade maranhense na cosmética moderna.',
    abertoParaRegistro: false,
    publicoAlvo: 'LAQI_E_MANHA',
  },
  {
    id: 'ativ_3_2',
    dia: 3,
    turno: 'TARDE',
    titulo: 'Painel: O Futuro da Química Industrial no Maranhão',
    categoria: 'Mesa-Redonda',
    local: 'Auditório Central Paulo Freire',
    horarioInicio: '14:00',
    horarioFim: '18:00',
    descricao: 'Encontro com executivos das principais indústrias instaladas no estado.',
    abertoParaRegistro: false,
    publicoAlvo: 'LAQI_E_TARDE',
  },

  // DIA 4: 04/12 (Sexta-feira)
  {
    id: 'ativ_4_1',
    dia: 4,
    turno: 'MANHA',
    titulo: 'Sessão Plenária de Encerramento e Premiação de Destaques',
    categoria: 'Encerramento',
    local: 'Auditório Central Paulo Freire',
    horarioInicio: '08:30',
    horarioFim: '12:00',
    descricao: 'Cerimônia oficial de encerramento do CONQUITECH-MA, entrega de menções honrosas e sorteios.',
    abertoParaRegistro: false,
    publicoAlvo: 'LAQI_E_MANHA',
  },
];
