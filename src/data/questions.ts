import { Pergunta } from '../types';

export const perguntas: Pergunta[] = [
  {
    pergunta: "Você sabe, sem precisar consultar ninguém, quanto sua empresa faturou no mês passado?",
    opcoes: [
      { texto: "Não sei com precisão — tenho uma ideia aproximada, mas não sei o número exato.", pontos: 1 },
      { texto: "Sei o faturamento, mas não sei se tive lucro ou prejuízo.", pontos: 2 },
      { texto: "Sei o faturamento e tenho uma noção da margem, mas não analiso os detalhes.", pontos: 3 },
      { texto: "Sei exatamente: faturamento, custo, margem, lucro líquido e comparativo com o mês anterior.", pontos: 4 }
    ]
  },
  {
    pergunta: "Com que frequência você abre os relatórios financeiros da sua empresa?",
    opcoes: [
      { texto: "Raramente ou nunca — só vejo quando tem algum problema urgente.", pontos: 1 },
      { texto: "Uma vez por mês, quando o financeiro entrega o relatório.", pontos: 2 },
      { texto: "Semanalmente, analiso os principais indicadores.", pontos: 3 },
      { texto: "Diariamente — tenho um painel que acompanho toda manhã.", pontos: 4 }
    ]
  },
  {
    pergunta: "O que você sente quando precisa analisar os números da sua empresa?",
    opcoes: [
      { texto: "Evito ao máximo — não me sinto à vontade com planilhas e relatórios.", pontos: 1 },
      { texto: "Aceito como uma obrigação, mas não gosto muito.", pontos: 2 },
      { texto: "Me sinto bem, é parte da rotina de gestão.", pontos: 3 },
      { texto: "É uma das partes mais importantes para mim na empresa.", pontos: 4 }
    ]
  },
  {
    pergunta: "Hoje, o controle financeiro da sua empresa está:",
    opcoes: [
      { texto: "Inexistente ou totalmente desorganizado.", pontos: 1 },
      { texto: "Minimamente organizado em planilhas.", pontos: 2 },
      { texto: "Organizado com relatórios periódicos.", pontos: 3 },
      { texto: "Automatizado com indicadores claros e atualizados.", pontos: 4 }
    ]
  },
  {
    pergunta: "Como você define o seu pró-labore?",
    opcoes: [
      { texto: "Retiro dinheiro quando sobra.", pontos: 1 },
      { texto: "Tenho um valor, mas nem sempre consigo respeitar.", pontos: 2 },
      { texto: "Tenho um valor fixo definido.", pontos: 3 },
      { texto: "Tenho um valor estratégico baseado no lucro.", pontos: 4 }
    ]
  },
  {
    pergunta: "Você separa finanças pessoais das empresariais?",
    opcoes: [
      { texto: "Não separo.", pontos: 1 },
      { texto: "Separo às vezes.", pontos: 2 },
      { texto: "Separo corretamente.", pontos: 3 },
      { texto: "Totalmente separado com gestão individual.", pontos: 4 }
    ]
  },
  {
    pergunta: "Quando a empresa fatura mais:",
    opcoes: [
      { texto: "O dinheiro some e não sei onde foi parar.", pontos: 1 },
      { texto: "Pago contas atrasadas.", pontos: 2 },
      { texto: "Guardo uma parte.", pontos: 3 },
      { texto: "Invisto com estratégia.", pontos: 4 }
    ]
  },
  {
    pergunta: "Sua empresa possui reserva financeira?",
    opcoes: [
      { texto: "Não possui.", pontos: 1 },
      { texto: "Muito pequena.", pontos: 2 },
      { texto: "Sim, para alguns meses.", pontos: 3 },
      { texto: "Sim, com planejamento de uso.", pontos: 4 }
    ]
  },
  {
    pergunta: "Você sabe qual é o custo fixo mensal da sua empresa?",
    opcoes: [
      { texto: "Não sei.", pontos: 1 },
      { texto: "Tenho uma ideia.", pontos: 2 },
      { texto: "Sei o valor aproximado.", pontos: 3 },
      { texto: "Sei exatamente e acompanho.", pontos: 4 }
    ]
  },
  {
    pergunta: "Você precifica seus produtos/serviços com base em:",
    opcoes: [
      { texto: "No preço da concorrência.", pontos: 1 },
      { texto: "No quanto acho que vale.", pontos: 2 },
      { texto: "Nos meus custos.", pontos: 3 },
      { texto: "Custos + margem + estratégia.", pontos: 4 }
    ]
  },
  {
    pergunta: "Quando precisa tomar decisões financeiras:",
    opcoes: [
      { texto: "Decido no feeling.", pontos: 1 },
      { texto: "Peço opinião para alguém.", pontos: 2 },
      { texto: "Analiso alguns números.", pontos: 3 },
      { texto: "Uso indicadores e metas.", pontos: 4 }
    ]
  },
  {
    pergunta: "Você acompanha indicadores como:",
    opcoes: [
      { texto: "Não acompanho.", pontos: 1 },
      { texto: "Só faturamento.", pontos: 2 },
      { texto: "Faturamento e lucro.", pontos: 3 },
      { texto: "DRE completa e indicadores.", pontos: 4 }
    ]
  },
  {
    pergunta: "Sua empresa dá lucro com frequência?",
    opcoes: [
      { texto: "Não sei.", pontos: 1 },
      { texto: "Raramente.", pontos: 2 },
      { texto: "Na maioria dos meses.", pontos: 3 },
      { texto: "Consistentemente e crescente.", pontos: 4 }
    ]
  },
  {
    pergunta: "Quando surge um imprevisto financeiro:",
    opcoes: [
      { texto: "Entro em desespero.", pontos: 1 },
      { texto: "Dou um jeito com dívidas.", pontos: 2 },
      { texto: "Uso a reserva.", pontos: 3 },
      { texto: "Já está previsto no planejamento.", pontos: 4 }
    ]
  },
  {
    pergunta: "Seu financeiro hoje é:",
    opcoes: [
      { texto: "Um problema.", pontos: 1 },
      { texto: "Uma obrigação.", pontos: 2 },
      { texto: "Uma área importante.", pontos: 3 },
      { texto: "O coração estratégico do negócio.", pontos: 4 }
    ]
  },
  {
    pergunta: "Você tem metas financeiras claras?",
    opcoes: [
      { texto: "Não tenho.", pontos: 1 },
      { texto: "Tenho na cabeça.", pontos: 2 },
      { texto: "Tenho anotadas.", pontos: 3 },
      { texto: "Tenho metas com indicadores.", pontos: 4 }
    ]
  },
  {
    pergunta: "Você analisa o resultado mensal da empresa?",
    opcoes: [
      { texto: "Não analiso.", pontos: 1 },
      { texto: "Só quando dá problema.", pontos: 2 },
      { texto: "Analiso superficialmente.", pontos: 3 },
      { texto: "Faço análise completa.", pontos: 4 }
    ]
  },
  {
    pergunta: "Hoje você sente que sua empresa é:",
    opcoes: [
      { texto: "Sobrevivente.", pontos: 1 },
      { texto: "Organizada.", pontos: 2 },
      { texto: "Lucrativa.", pontos: 3 },
      { texto: "Escalável e previsível.", pontos: 4 }
    ]
  }
];
