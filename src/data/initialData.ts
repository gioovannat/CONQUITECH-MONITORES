import { Monitor } from '../rules';

export const MEMBROS_LAQI_INICIAIS: string[] = [
  'Amanda Lilia Santos Leão',
  'Ana Gabriela Corrêa Reis',
  'Ana Lívia Soares Batista Marques',
  'Anne Beatris Boaes de Melo',
  'Beatriz Barros Mesquita',
  'Carlos Eduardo Machado Rego',
  'Caroline Barros Mesquita',
  'Chrystian Dhyorlan Sousa de Morais',
  'Débora Dení Santana Gosmes',
  'Denise Pinheiro Martins',
  'Diego Domingos Garcia Campos',
  'Dion Wesley Silva Costa',
  'Douglas da Silva e Silva',
  'Douglas Henrique Sousa Morais',
  'Emanuele Queiroz Rosa',
  'Emilly Rocha Cunha',
  'Giovanna Sabrine da Silva Teixeira',
  'Hellen Maria Pinto Pinheiro',
  'John Wayni Santos Oliveira Junior',
  'Júlia Aisha Lisboa Gomes',
  'Leandro Pereira de Sousa',
  'Leonardo Monteles Castro Pereira',
  'Luanny Ribeiro Ricarte',
  'Luciana Aguiar Bergê',
  'Marcos Vinícius Serra Amorim',
  'Maria Fernanda França Silva',
  'Maria Francisca Melo da Conceição',
  'Marirrah Haifa Costa de Almeida Vale Gomes',
  'Mikaelly Pinheiro Gomes',
  'Miryan Karoline Martins Chagas',
  'Pedro Lucas de Jesus Araujo',
  'Ranna Sofya Ferreira Cantanhede',
  'Rawena Kemily Pedrosa Lima',
  'Safira Mendes Pessoa',
  'Sarah Tamires Nunes Cavalcante',
  'Sophia Sousa Oliveira',
  'Tarcienny da Silva Rodrigues',
  'Vitchenzo Henrique Mendes',
  'Vitor Freire Ramos',
  'Vitor Gabriel Sousa Brandão',
  'Wesliane de Sousa Pereira',
];

export function gerarMonitoresIniciais(): Monitor[] {
  const lista: Monitor[] = [];

  // 41 membros LAQI
  MEMBROS_LAQI_INICIAIS.forEach((nome, idx) => {
    lista.push({
      id: `laqi_${String(idx + 1).padStart(2, '0')}`,
      nome: nome.trim(),
      grupo: 'LAQI',
      ativo: true,
      criadoEm: Date.now(),
      atualizadoEm: Date.now(),
    });
  });

  // 16 Monitores Externos: 8 Manhã e 8 Tarde
  for (let i = 1; i <= 16; i++) {
    const numStr = String(i).padStart(2, '0');
    const turno = i <= 8 ? 'MANHA' : 'TARDE';
    lista.push({
      id: `externo_${numStr}`,
      nome: `Monitor externo ${numStr}`,
      grupo: 'EXTERNO',
      turno,
      ativo: true,
      criadoEm: Date.now(),
      atualizadoEm: Date.now(),
    });
  }

  return lista;
}
