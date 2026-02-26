export interface PerfilInfo {
  sinais: string[];
  riscoPrincipal: string;
  planoEvolucao: string[];
  solucaoRecomendada: string;
}

export const PERFIL_DATA: Record<string, PerfilInfo> = {
  "OPERADOR": {
    sinais: [
      "Finanças pessoais e empresariais ainda se misturam",
      "Sem previsão de caixa — as surpresas são frequentes",
      "Decisões financeiras baseadas em intuição, não em dados",
      "A empresa depende de você para tudo que envolve dinheiro",
      "Não sabe exatamente quais produtos/serviços dão mais lucro"
    ],
    riscoPrincipal: "Falta de controle financeiro que pode gerar prejuízo sem perceber e travar o crescimento da empresa.",
    planoEvolucao: [
      "Separar imediatamente as finanças pessoais e empresariais",
      "Implantar um controle básico de contas a pagar e a receber",
      "Ter um fluxo de caixa mínimo atualizado semanalmente",
      "Definir processos claros de registro financeiro",
      "Contratar suporte especializado (BPO ou implantação de processos)"
    ],
    solucaoRecomendada: "Implantação de Processos Financeiros + BPO Financeiro"
  },
  "TÁTICO": {
    sinais: [
      "Acompanha o faturamento, mas a margem real ainda é nebulosa",
      "Tem algum controle, mas as previsões de caixa são imprecisas",
      "Toma decisões com dados parciais — falta informação estruturada",
      "O financeiro ainda depende de você para funcionar bem",
      "Planeja o mês, mas não o trimestre ou o ano"
    ],
    riscoPrincipal: "Crescer faturamento sem crescer lucro (crescimento desorganizado).",
    planoEvolucao: [
      "Implantar projeção de caixa para 60–90 dias",
      "Calcular o ponto de equilíbrio e monitorar mensalmente",
      "Implantar análise de margem por produto/serviço",
      "Estruturar o financeiro para funcionar sem depender de você",
      "Criar um budget anual com revisão trimestral"
    ],
    solucaoRecomendada: "BPO Financeiro ou Gestão Financeira Empresarial (GFE)"
  },
  "ESTRATÉGICO": {
    sinais: [
      "Tem controle real do caixa e previsibilidade financeira",
      "Toma decisões com base em dados e análises",
      "O financeiro já está em boa parte estruturado",
      "Entende margem, custos e rentabilidade por linha",
      "Falta dar o próximo passo: planejamento estratégico financeiro"
    ],
    riscoPrincipal: "Ficar operacional demais e não usar o financeiro como motor de crescimento.",
    planoEvolucao: [
      "Implementar modelagem financeira (cenários e simulações)",
      "Criar estrutura formal de indicadores (KPIs financeiros mensais)",
      "Separar financeiro operacional de financeiro estratégico",
      "Conectar finanças à estratégia de crescimento do negócio",
      "Considerar CFO externo ou gestão financeira avançada"
    ],
    solucaoRecomendada: "Gestão Financeira Empresarial (GFE) — nível estratégico"
  },
  "DECISOR": {
    sinais: [
      "Tem visão clara de passado, presente e futuro financeiro da empresa",
      "Usa o financeiro como ferramenta de alavancagem e crescimento",
      "Processos financeiros funcionam sem depender de você",
      "Decisões de investimento baseadas em ROI e análise de risco",
      "Consegue planejar e executar crescimento sustentável"
    ],
    riscoPrincipal: "Estrutura atual não acompanhar a velocidade do crescimento.",
    planoEvolucao: [
      "Revisar se os processos atuais escalam com o crescimento planejado",
      "Avaliar se a equipe financeira atual suporta o próximo nível",
      "Implementar indicadores preditivos (não apenas históricos)",
      "Conectar financeiro com gestão de talentos e operações",
      "Considerar conselho consultivo ou governança corporativa"
    ],
    solucaoRecomendada: "Consultoria Estratégica / CFO as a Service"
  }
};
