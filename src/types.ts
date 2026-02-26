export interface Opcao {
  id?: string;
  texto: string;
  pontos: number;
}

export interface Pergunta {
  id?: string;
  pergunta: string;
  opcoes: Opcao[];
}

export interface PerfilResultado {
  id?: string;
  perfil: string;
  pontuacaoMin: number;
  pontuacaoMax: number;
  nivel: number;
  descricao: string;
  riscoPrincipal: string;
  planoEvolucao: string[];
  solucaoRecomendada: string;
  sinais: string[];
}

export interface Diagnostico {
  id: string;
  titulo: string;
  descricao: string;
  slug: string;
  isActive: boolean;
  perguntas: Pergunta[];
  perfis: PerfilResultado[];
}

export interface LeadData {
  nome: string;
  email: string;
  whatsapp: string;
  diagnostico_id?: string;
}

export interface QuizResult {
  pontuacaoTotal: number;
  perfil: string;
  descricao: string;
  nivel: number;
  sinais: string[];
  riscoPrincipal: string;
  planoEvolucao: string[];
  solucaoRecomendada: string;
}

export type Step = 'welcome' | 'questions' | 'lead' | 'result' | 'admin';
