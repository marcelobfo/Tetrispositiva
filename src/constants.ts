export interface PerfilInfo {
  sinais: string[];
  riscoPrincipal: string;
  planoEvolucao: string[];
  solucaoRecomendada: string;
}

export const PERFIL_DATA: Record<string, PerfilInfo> = {
  "CAOS FINANCEIRO": {
    sinais: [
      "Mistura contas pessoais com empresariais",
      "Não possui reserva financeira",
      "Não existe controle de fluxo de caixa",
      "Falta clareza sobre lucro ou prejuízo",
      "Decisões tomadas pelo saldo bancário"
    ],
    riscoPrincipal: "Quebra de caixa iminente.",
    planoEvolucao: [
      "Separar contas pessoais e empresariais",
      "Listar todos os custos fixos e variáveis",
      "Implantar controle de fluxo de caixa",
      "Definir pró-labore",
      "Criar reserva mínima de segurança"
    ],
    solucaoRecomendada: "BPO Financeiro Imediato"
  },
  "NEGÓCIO EM CONSTRUÇÃO": {
    sinais: [
      "Controles financeiros básicos",
      "Análise financeira esporádica",
      "Dependência do dono nas decisões",
      "Precificação sem base estratégica",
      "Crescimento sem previsibilidade"
    ],
    riscoPrincipal: "Crescer sem lucro.",
    planoEvolucao: [
      "Implantar rotina semanal de análise financeira",
      "Estruturar DRE gerencial",
      "Criar orçamento anual",
      "Definir metas de margem de lucro",
      "Organizar retirada de pró-labore"
    ],
    solucaoRecomendada: "BPO Financeiro e Planejamento Financeiro"
  },
  "ESTRUTURA SUSTENTÁVEL": {
    sinais: [
      "Controle financeiro organizado",
      "Indicadores claros para tomada de decisão",
      "Previsibilidade de caixa",
      "Separação total entre PF e PJ",
      "Precificação com base em margem"
    ],
    riscoPrincipal: "Estagnar por falta de estratégia de crescimento.",
    planoEvolucao: [
      "Otimizar margens de lucro",
      "Analisar ROI dos investimentos",
      "Criar planejamento de expansão",
      "Definir metas financeiras de longo prazo",
      "Estruturar reserva para crescimento"
    ],
    solucaoRecomendada: "Gestão Financeira Estratégica"
  },
  "LUCRO LIVRE": {
    sinais: [
      "Empresa independente do dono",
      "Caixa previsível e saudável",
      "Decisões baseadas em indicadores",
      "Distribuição de lucros recorrente",
      "Visão de longo prazo"
    ],
    riscoPrincipal: "Perder oportunidades de alavancagem por falta de estrutura de capital.",
    planoEvolucao: [
      "Estruturar governança financeira",
      "Realizar valuation da empresa",
      "Planejar expansão ou novas unidades",
      "Criar estratégia de investimentos",
      "Otimizar estrutura de capital"
    ],
    solucaoRecomendada: "Consultoria Estratégica Financeira / CFO as a Service"
  }
};
