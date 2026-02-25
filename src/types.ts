export interface Opcao {
  texto: string;
  pontos: number;
}

export interface Pergunta {
  pergunta: string;
  opcoes: Opcao[];
}

export interface LeadData {
  nome: string;
  email: string;
  whatsapp: string;
}

export interface QuizResult {
  pontuacaoTotal: number;
  perfil: string;
  descricao: string;
  nivel: number; // 1 to 4
}

export type Step = 'welcome' | 'questions' | 'lead' | 'result' | 'admin';
