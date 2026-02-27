/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  ArrowRight, 
  BarChart3, 
  ShieldCheck, 
  RotateCcw,
  Clock,
  AlertTriangle,
  Target,
  ChevronDown,
  Loader2,
  TrendingUp,
  Zap,
  Phone,
  Mail,
  User
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { Step, LeadData, QuizResult, Diagnostico } from './types';
import { saveLead, getDiagnostics, getDiagnosticBySlug } from './services/supabase';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import { PERFIL_DATA } from './constants';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const leadSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  whatsapp: z.string().min(10, 'WhatsApp inválido (ex: 11999999999)'),
});

const LOGO_URL = "https://tetrispositiva.com.br/wp-content/uploads/2026/01/Ale-Photoroom.png";
const STORAGE_KEY = 'diagnostico_financeiro_state';

export default function App() {
  const [diagnostico, setDiagnostico] = useState<Diagnostico | null>(null);
  const [loadingDiag, setLoadingDiag] = useState(true);

  // State initialization with localStorage recovery
  const [step, setStep] = useState<Step>(() => {
    const path = window.location.pathname;
    if (path === '/dashboard') return 'admin';
    
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // If the user was on a question, keep them there, otherwise start at welcome
      if (parsed.step === 'questions' || parsed.step === 'lead') {
        return parsed.step;
      }
    }
    return 'welcome';
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.currentQuestionIndex || 0;
    }
    return 0;
  });

  const [respostas, setRespostas] = useState<number[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.respostas || [];
    }
    return [];
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(!!localStorage.getItem('admin_token'));
  const [showScrollArrow, setShowScrollArrow] = useState(true);

  // Handle scroll to hide arrow
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowScrollArrow(false);
      } else {
        setShowScrollArrow(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load diagnostic data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingDiag(true);
        const path = window.location.pathname;
        let slug = 'diagnostico-financeiro'; // Default slug

        // Se não for a home e não for o dashboard, o caminho é o slug
        if (path !== '/' && path !== '/dashboard') {
          // Suporta tanto /d/slug quanto /slug
          slug = path.startsWith('/d/') ? path.substring(3) : path.substring(1);
          
          // Remover barra final se existir
          if (slug.endsWith('/')) slug = slug.slice(0, -1);
        }

        const response = await fetch(slug === 'diagnostico-financeiro' ? '/api/diagnosticos/diagnostico-financeiro' : `/api/diagnosticos/${slug}`);
        
        const contentType = response.headers.get("content-type");
        if (!response.ok || !contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          if (text.includes("<!doctype html>") || text.includes("<html")) {
            throw new Error("O servidor retornou HTML em vez de JSON. Verifique se as rotas de API estão acessíveis.");
          }
          throw new Error(`Erro na API: ${response.status}`);
        }

        const data = await response.json();
        
        // Map database structure to our frontend interface
        const mappedDiag: Diagnostico = {
          ...data,
          perguntas: (data.perguntas || []).map((p: any) => ({
            id: p.id,
            pergunta: p.texto,
            opcoes: (p.opcoes || []).map((o: any) => ({
              id: o.id,
              texto: o.texto,
              pontos: o.pontos
            }))
          })),
          perfis: (data.perfis_resultado || []).map((p: any) => ({
            id: p.id,
            perfil: p.perfil,
            pontuacaoMin: p.pontuacao_min,
            pontuacaoMax: p.pontuacao_max,
            nivel: p.nivel,
            descricao: p.descricao,
            riscoPrincipal: p.risco_principal,
            solucaoRecomendada: p.solucao_recomendada,
            sinais: Array.isArray(p.sinais) ? p.sinais : [],
            planoEvolucao: Array.isArray(p.plano_evolucao) ? p.plano_evolucao : []
          }))
        };
        
        setDiagnostico(mappedDiag);
      } catch (err) {
        console.error("Erro ao carregar diagnóstico:", err);
        // Fallback to first active diagnostic if slug not found
        try {
          const all = await getDiagnostics();
          if (all.length > 0) {
            const first = await getDiagnosticBySlug(all[0].slug);
            // Map again... (should probably refactor this into a mapper function)
            setDiagnostico({
              ...first,
              perguntas: (first.perguntas || []).map((p: any) => ({
                id: p.id,
                pergunta: p.texto,
                opcoes: (p.opcoes || []).map((o: any) => ({
                  id: o.id,
                  texto: o.texto,
                  pontos: o.pontos
                }))
              })),
              perfis: (first.perfis_resultado || []).map((p: any) => ({
                id: p.id,
                perfil: p.perfil,
                pontuacaoMin: p.pontuacao_min,
                pontuacaoMax: p.pontuacao_max,
                nivel: p.nivel,
                descricao: p.descricao,
                riscoPrincipal: p.risco_principal,
                solucaoRecomendada: p.solucao_recomendada,
                sinais: Array.isArray(p.sinais) ? p.sinais : [],
                planoEvolucao: Array.isArray(p.plano_evolucao) ? p.plano_evolucao : []
              }))
            });
          }
        } catch (innerErr) {
          console.error("Erro fatal ao carregar diagnósticos:", innerErr);
        }
      } finally {
        setLoadingDiag(false);
      }
    };

    loadData();
  }, []);

  // Handle routing for /dashboard and diagnostic slugs
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/dashboard') {
      setStep('admin');
    } else if (step === 'admin') {
      // Se o estado estiver como admin mas o caminho não for /dashboard,
      // reseta para o início (welcome) para permitir ver o diagnóstico
      setStep('welcome');
    }
  }, [step]); // Re-check when step changes or on mount

  const handleAdminLogin = () => {
    setIsAdminAuthenticated(true);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAdminAuthenticated(false);
    setStep('welcome');
    window.history.pushState({}, '', '/');
  };

  const { register, handleSubmit, formState: { errors } } = useForm<LeadData>({
    resolver: zodResolver(leadSchema),
  });

  const totalQuestions = diagnostico?.perguntas?.length || 0;
  const progress = useMemo(() => {
    if (totalQuestions === 0) return 0;
    return ((currentQuestionIndex + 1) / totalQuestions) * 100;
  }, [currentQuestionIndex, totalQuestions]);

  // Persist state to localStorage
  useEffect(() => {
    if (step !== 'result') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        step,
        currentQuestionIndex,
        respostas
      }));
    }
  }, [step, currentQuestionIndex, respostas]);

  const handleStart = () => setStep('questions');

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setStep('welcome');
    setCurrentQuestionIndex(0);
    setRespostas([]);
    setResult(null);
  };

  const handleAnswer = useCallback((pontos: number) => {
    const novasRespostas = [...respostas];
    novasRespostas[currentQuestionIndex] = pontos;
    setRespostas(novasRespostas);

    setStep('loading');

    setTimeout(() => {
      if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setStep('questions');
      } else {
        setStep('lead');
      }
    }, 500); // 0.5s as requested
  }, [currentQuestionIndex, respostas, totalQuestions]);

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else {
      setStep('welcome');
    }
  };

  const calculateResult = (total: number): QuizResult => {
    // Formula: score = Math.round(((pontuacao_total - 18) / 54) * 100)
    const score = Math.round(((total - 18) / 54) * 100);
    const clampedScore = Math.max(0, Math.min(100, score));

    if (!diagnostico || !diagnostico.perfis) {
      const getResultForRange = (s: number) => {
        if (s <= 25) return { perfil: "OPERADOR", nivel: 1, desc: "Caos Financeiro - Seu foco está na sobrevivência imediata." };
        if (s <= 50) return { perfil: "TÁTICO", nivel: 2, desc: "Negócio em Construção - Você já possui organização básica." };
        if (s <= 75) return { perfil: "ESTRATÉGICO", nivel: 3, desc: "Estrutura Sustentável - Sua gestão é sustentável." };
        return { perfil: "DECISOR", nivel: 4, desc: "Lucro Livre - Você atingiu o nível de Lucro Livre." };
      };
      const base = getResultForRange(clampedScore);
      return {
        pontuacaoTotal: clampedScore,
        perfil: base.perfil,
        descricao: base.desc,
        nivel: base.nivel,
        sinais: [],
        riscoPrincipal: "",
        planoEvolucao: [],
        solucaoRecomendada: ""
      };
    }

    const perfilEncontrado = diagnostico.perfis.find(p => clampedScore >= p.pontuacaoMin && clampedScore <= p.pontuacaoMax);
    
    if (!perfilEncontrado) {
      const sortedPerfis = [...diagnostico.perfis].sort((a, b) => a.pontuacaoMin - b.pontuacaoMin);
      const fallback = clampedScore < sortedPerfis[0].pontuacaoMin ? sortedPerfis[0] : sortedPerfis[sortedPerfis.length - 1];
      return {
        ...fallback,
        pontuacaoTotal: clampedScore
      };
    }

    return {
      ...perfilEncontrado,
      pontuacaoTotal: clampedScore
    };
  };

  const onSubmitLead = async (data: LeadData) => {
    setIsSubmitting(true);
    
    // 1. Calculate result immediately
    const total = respostas.reduce((acc, curr) => acc + (curr || 0), 0);
    const calculatedResult = calculateResult(total);

    const payload = {
      ...data,
      respostas,
      pontuacao_total: total,
      perfil: calculatedResult.perfil,
      diagnostico_id: diagnostico?.id,
      created_at: new Date().toISOString(),
    };

    // 2. Transition UI immediately to avoid "hanging" feel
    setResult(calculatedResult);
    setStep('result');
    localStorage.removeItem(STORAGE_KEY);
    setIsSubmitting(false);

    // 3. Fire integrations in the background
    console.log("Iniciando salvamento em background...");
    
    // Webhook
    const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL;
    if (WEBHOOK_URL) {
      fetch(WEBHOOK_URL, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload) 
      }).catch(err => console.error("Erro no Webhook (background):", err));
    }

    // Supabase (via local API)
    saveLead(payload)
      .then(() => console.log("Lead salvo com sucesso no Supabase"))
      .catch(err => console.error("Erro no Supabase (background):", err));
  };

  if (loadingDiag) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-olive-600" />
          <p className="text-olive-600 font-medium">Carregando diagnóstico...</p>
        </div>
      </div>
    );
  }

  // PRIORIDADE: Se o usuário estiver tentando acessar o admin, mostre o admin independente dos dados
  if (step === 'admin') {
    if (!isAdminAuthenticated) {
      return <Login onLogin={handleAdminLogin} />;
    }
    return <AdminDashboard onBack={handleAdminLogout} />;
  }

  if (!diagnostico) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="p-4 bg-red-50 rounded-full w-fit mx-auto">
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-olive-950">Configuração Necessária</h2>
            <p className="text-olive-600">O banco de dados está pronto, mas você ainda não criou nenhum modelo de diagnóstico.</p>
          </div>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setStep('admin')} 
              className="w-full px-6 py-4 bg-olive-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-olive-900/20"
            >
              Acessar Painel Administrativo
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="text-olive-400 hover:text-olive-600 text-sm font-bold uppercase tracking-widest"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-start p-4 sm:p-8 overflow-x-hidden">
      {/* Header / Logo */}
      <header className="fixed top-0 left-0 w-full p-6 flex justify-between items-center z-50 bg-white/80 backdrop-blur-sm border-b border-olive-50">
        <img 
          src={LOGO_URL} 
          alt="Logo" 
          className="h-14 sm:h-20 w-auto object-contain brightness-0 contrast-125 transition-all" 
          referrerPolicy="no-referrer" 
        />
        {step === 'questions' && (
          <div className="fixed top-0 left-0 w-full h-1 bg-olive-100 z-[60]">
            <motion.div 
              className="bg-olive-600 h-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
            <div className="absolute top-2 right-4 text-[10px] font-bold text-olive-400 uppercase tracking-widest">
              {currentQuestionIndex + 1} / {totalQuestions}
            </div>
          </div>
        )}
      </header>

      <main className="w-full max-w-2xl pt-36 sm:pt-52 pb-24 flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-10 my-auto flex flex-col items-center"
            >
              <div className="space-y-6">
                <h1 className="text-4xl sm:text-6xl font-black text-olive-950 leading-tight tracking-tighter">
                  Score Lucro Livre
                </h1>
                <h2 className="text-xl sm:text-2xl font-bold text-olive-600 max-w-lg mx-auto leading-tight">
                  Sua empresa realmente gera lucro ou está apenas faturando?
                </h2>
                <p className="text-olive-700 text-lg font-light leading-relaxed max-w-xl mx-auto">
                  O Score Lucro Livre é o índice que avalia, de 0 a 100, a capacidade do seu negócio de gerar lucro com previsibilidade, manter caixa saudável e permitir distribuição para os sócios com estratégia.
                </p>
              </div>

              <button
                onClick={() => setStep('concept')}
                className="group relative inline-flex items-center justify-center px-12 py-6 font-bold text-white transition-all duration-300 bg-olive-950 rounded-2xl hover:bg-black hover:shadow-2xl active:scale-95 focus:outline-none text-xl uppercase tracking-widest"
              >
                DESCOBRIR MEU SCORE
                <ArrowRight className="ml-2 w-6 h-6 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>
          )}

          {step === 'concept' && (
            <motion.div
              key="concept"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-8 my-auto"
            >
              <div className="space-y-4 text-center">
                <h2 className="text-3xl font-bold text-olive-950 tracking-tight">Como Funciona o Score Lucro Livre</h2>
                <p className="text-olive-700 font-light leading-relaxed">
                  O diagnóstico avalia os principais fundamentos que determinam se sua empresa está estruturada para gerar Lucro Livre com previsibilidade, distribuídos nas 4 alavancas do Método Tetris Positiva:
                </p>
              </div>

              <div className="grid gap-4">
                <div className="bg-white p-6 rounded-3xl border border-olive-100 shadow-sm space-y-1">
                  <h3 className="font-bold text-olive-900 flex items-center text-lg">
                    <span className="w-6 h-6 bg-olive-100 text-olive-600 rounded-full flex items-center justify-center text-xs mr-2 shrink-0">1</span>
                    Estrutura
                  </h3>
                  <p className="text-sm text-olive-600 ml-8">Clareza de números, fluxo de caixa, DRE financeira.</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-olive-100 shadow-sm space-y-1">
                  <h3 className="font-bold text-olive-900 flex items-center text-lg">
                    <span className="w-6 h-6 bg-olive-100 text-olive-600 rounded-full flex items-center justify-center text-xs mr-2 shrink-0">2</span>
                    Receita
                  </h3>
                  <p className="text-sm text-olive-600 ml-8">Previsibilidade, RMN (Recebimento mínimo necessário) e Cash Collect x vendas.</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-olive-100 shadow-sm space-y-1">
                  <h3 className="font-bold text-olive-900 flex items-center text-lg">
                    <span className="w-6 h-6 bg-olive-100 text-olive-600 rounded-full flex items-center justify-center text-xs mr-2 shrink-0">3</span>
                    Liberdade do Empresário
                  </h3>
                  <p className="text-sm text-olive-600 ml-8">pró-labore, salário do sócio.</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-olive-100 shadow-sm space-y-1">
                  <h3 className="font-bold text-olive-900 flex items-center text-lg">
                    <span className="w-6 h-6 bg-olive-100 text-olive-600 rounded-full flex items-center justify-center text-xs mr-2 shrink-0">4</span>
                    Lucro Livre
                  </h3>
                  <p className="text-sm text-olive-600 ml-8">Distribuição saudável, reservas estratégicas (Open Doors e Capital de Giro), reinvestimento consciente e crescimento sustentável.</p>
                </div>
              </div>

              <div className="bg-olive-50 p-6 rounded-3xl border border-olive-100 text-center">
                <p className="text-sm text-olive-700 leading-relaxed">
                  Após o diagnóstico, você poderá realizar um Raio-X Financeiro personalizado com nossa equipe.
                  Uma análise técnica e aprofundada da sua estrutura, margens e capacidade real de gerar Lucro Livre.
                </p>
              </div>

              <button
                onClick={() => setStep('questions')}
                className="w-full py-6 bg-olive-950 text-white font-bold text-xl rounded-2xl hover:bg-black transition-all shadow-xl uppercase tracking-widest"
              >
                COMEÇAR DIAGNÓSTICO
              </button>
            </motion.div>
          )}

          {step === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center space-y-6 my-auto"
            >
              <Loader2 className="w-12 h-12 text-olive-600 animate-spin" />
              <p className="text-olive-600 font-bold uppercase tracking-[0.3em] text-xs">Analisando resposta...</p>
            </motion.div>
          )}

          {step === 'questions' && (
            <motion.div
              key={`q-${currentQuestionIndex}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md mx-auto bg-white p-8 sm:p-10 rounded-[2.5rem] border border-olive-100 shadow-xl shadow-olive-900/5 space-y-8 my-auto flex flex-col justify-center"
            >
              <div className="space-y-6">
                <h2 className="text-xl sm:text-2xl font-bold text-olive-950 leading-tight tracking-tight text-center">
                  {diagnostico.perguntas[currentQuestionIndex].pergunta}
                </h2>

                <div className="grid gap-3 w-full">
                  {diagnostico.perguntas[currentQuestionIndex].opcoes.map((opcao, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(opcao.pontos)}
                      className={cn(
                        "flex items-center text-left p-5 rounded-2xl border-2 transition-all duration-300 group relative overflow-hidden w-full active:scale-[0.98]",
                        respostas[currentQuestionIndex] === opcao.pontos
                          ? "border-olive-600 bg-olive-50 shadow-md"
                          : "border-olive-100 hover:border-olive-300 bg-white hover:bg-olive-50/30"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg border flex items-center justify-center mr-4 shrink-0 transition-all duration-300 font-bold text-xs",
                        respostas[currentQuestionIndex] === opcao.pontos
                          ? "bg-olive-600 border-olive-600 text-white"
                          : "border-olive-200 group-hover:border-olive-400 text-olive-400"
                      )}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="text-sm sm:text-base font-bold text-olive-800 leading-tight">
                        {opcao.texto}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <button
                  onClick={handleBack}
                  className="flex items-center text-olive-300 hover:text-olive-500 font-bold text-[10px] transition-colors group tracking-[0.2em]"
                >
                  <ChevronLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
                  VOLTAR
                </button>
              </div>
            </motion.div>
          )}

          {step === 'lead' && (
            <motion.div
              key="lead"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 sm:p-14 rounded-[3rem] border border-olive-100 shadow-2xl shadow-olive-900/5 space-y-10 my-auto"
            >
              <div className="text-center space-y-3">
                <div className="inline-flex p-3 bg-olive-50 rounded-2xl text-olive-600 mb-2">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-olive-950 tracking-tight">Diagnóstico Concluído!</h2>
                <p className="text-olive-600 text-lg font-light">Preencha seus dados para liberar o acesso ao seu perfil e pontuação.</p>
              </div>

              <form onSubmit={handleSubmit(onSubmitLead)} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-olive-400 uppercase tracking-[0.2em] ml-1">Nome Completo</label>
                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-olive-300 group-focus-within:text-olive-600 transition-colors" />
                    <input
                      {...register('nome')}
                      placeholder="Seu nome"
                      className={cn(
                        "w-full pl-14 pr-6 py-5 bg-olive-50/50 border-2 rounded-2xl outline-none transition-all text-lg",
                        errors.nome ? "border-red-200 focus:border-red-400" : "border-transparent focus:border-olive-600 focus:bg-white"
                      )}
                    />
                  </div>
                  {errors.nome && <p className="text-xs text-red-500 ml-1 font-medium">{errors.nome.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-olive-400 uppercase tracking-[0.2em] ml-1">E-mail Corporativo</label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-olive-300 group-focus-within:text-olive-600 transition-colors" />
                    <input
                      {...register('email')}
                      placeholder="seu@email.com"
                      className={cn(
                        "w-full pl-14 pr-6 py-5 bg-olive-50/50 border-2 rounded-2xl outline-none transition-all text-lg",
                        errors.email ? "border-red-200 focus:border-red-400" : "border-transparent focus:border-olive-600 focus:bg-white"
                      )}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-500 ml-1 font-medium">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-olive-400 uppercase tracking-[0.2em] ml-1">WhatsApp</label>
                  <div className="relative group">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-olive-300 group-focus-within:text-olive-600 transition-colors" />
                    <input
                      {...register('whatsapp')}
                      placeholder="(00) 00000-0000"
                      className={cn(
                        "w-full pl-14 pr-6 py-5 bg-olive-50/50 border-2 rounded-2xl outline-none transition-all text-lg",
                        errors.whatsapp ? "border-red-200 focus:border-red-400" : "border-transparent focus:border-olive-600 focus:bg-white"
                      )}
                    />
                  </div>
                  {errors.whatsapp && <p className="text-xs text-red-500 ml-1 font-medium">{errors.whatsapp.message}</p>}
                </div>

                <button
                  disabled={isSubmitting}
                  className="w-full py-6 bg-olive-600 text-white font-bold text-xl rounded-2xl hover:bg-olive-700 transition-all flex items-center justify-center disabled:opacity-70 shadow-lg shadow-olive-600/20 active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-7 h-7 animate-spin" />
                  ) : (
                    <>
                      Ver Meu Resultado
                      <ChevronRight className="ml-2 w-6 h-6" />
                    </>
                  )}
                </button>
              </form>
              
              <p className="text-[10px] text-center text-olive-300 uppercase tracking-widest font-medium">
                Sua privacidade é nossa prioridade. Dados 100% protegidos.
              </p>
            </motion.div>
          )}

          {step === 'result' && result && (
            <>
              <AnimatePresence>
                {showScrollArrow && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <span className="text-[10px] font-bold text-olive-400 uppercase tracking-[0.3em] bg-white/80 backdrop-blur px-3 py-1 rounded-full border border-olive-100 shadow-sm">
                        Role para ver mais
                      </span>
                      <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-10 h-10 bg-olive-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-olive-600/30"
                      >
                        <ChevronDown className="w-6 h-6" />
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full max-w-4xl mx-auto space-y-8 pb-20"
              >
                {/* 1. O Score (Topo da Página) */}
                <section className="bg-white p-8 sm:p-12 rounded-[3.5rem] border border-olive-100 shadow-2xl shadow-olive-900/5 text-center space-y-8 relative overflow-hidden">
                  <div className="space-y-2 mb-4">
                    <div className="inline-flex p-3 bg-olive-50 rounded-2xl text-olive-600 mb-2">
                      <BarChart3 className="w-8 h-8" />
                    </div>
                    <p className="text-[10px] font-bold text-olive-400 uppercase tracking-[0.4em]">Diagnóstico Concluído</p>
                  </div>

                  <div className="relative w-72 h-36 mx-auto overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 100 50">
                      <path
                        d="M 10 50 A 40 40 0 0 1 90 50"
                        fill="none"
                        stroke="#f4f5f0"
                        strokeWidth="10"
                        strokeLinecap="round"
                      />
                      <motion.path
                        d="M 10 50 A 40 40 0 0 1 90 50"
                        fill="none"
                        stroke={
                          result.pontuacaoTotal <= 25 ? "#ef4444" :
                          result.pontuacaoTotal <= 50 ? "#f97316" :
                          result.pontuacaoTotal <= 75 ? "#3b82f6" : "#10b981"
                        }
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray="125.6"
                        initial={{ strokeDashoffset: 125.6 }}
                        animate={{ strokeDashoffset: 125.6 - (125.6 * (result.pontuacaoTotal / 100)) }}
                        transition={{ duration: 2.5, ease: "circOut" }}
                      />
                    </svg>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                      <motion.span 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.2 }}
                        className="text-6xl font-black text-olive-950"
                      >
                        {result.pontuacaoTotal}
                      </motion.span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h2 className={cn(
                      "text-2xl sm:text-3xl font-black uppercase tracking-tighter leading-none",
                      result.pontuacaoTotal <= 25 ? "text-red-600" :
                      result.pontuacaoTotal <= 50 ? "text-orange-500" :
                      result.pontuacaoTotal <= 75 ? "text-blue-500" : "text-emerald-600"
                    )}>
                      {result.pontuacaoTotal <= 25 && "CAOS FINANCEIRO"}
                      {result.pontuacaoTotal > 25 && result.pontuacaoTotal <= 50 && "NEGÓCIO EM CONSTRUÇÃO"}
                      {result.pontuacaoTotal > 50 && result.pontuacaoTotal <= 75 && "ESTRUTURA SUSTENTÁVEL"}
                      {result.pontuacaoTotal > 75 && "LUCRO LIVRE"}
                    </h2>
                    <p className="text-lg text-olive-700 font-light leading-relaxed max-w-md mx-auto">
                      {result.descricao}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-olive-50 flex justify-between items-center max-w-xs mx-auto">
                    <div className="text-left">
                      <p className="text-[8px] font-bold text-olive-300 uppercase tracking-widest">Status Atual</p>
                      <p className="text-sm font-bold text-olive-900">Maturidade Nível {result.nivel}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-bold text-olive-300 uppercase tracking-widest">Pontuação</p>
                      <p className="text-sm font-bold text-olive-600">{result.pontuacaoTotal} <span className="text-[10px] text-olive-300">/ 100</span></p>
                    </div>
                  </div>
                </section>

                {/* 2. Card de Texto Final (Conteúdo Persuasivo) */}
                <section className="bg-olive-50 p-10 sm:p-14 rounded-[3.5rem] border border-olive-100 space-y-8 shadow-xl shadow-olive-900/5">
                  <div className="space-y-6">
                    <h3 className="text-2xl sm:text-3xl font-bold text-olive-950 leading-tight">
                      Seu resultado mostra potencial, mas o tempo ainda joga contra você.
                    </h3>
                    <p className="text-olive-700 text-lg font-light leading-relaxed">
                      Seu score é só o começo. O próximo passo é um Raio-X Financeiro personalizado feito por especialistas para analisar, com profundidade técnica, sua estrutura, caixa, margens e capacidade real de gerar Lucro Livre com constância.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-olive-200/50">
                    <p className="text-sm font-bold text-olive-500 uppercase tracking-[0.3em]">
                      Preparado para o próximo nível?
                    </p>
                  </div>
                </section>

                {/* Detailed Sections (Sinais, Plano, Risco, Solução) */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-8">
                    <div className="bg-white p-10 rounded-[3rem] border border-olive-100 shadow-lg space-y-6">
                      <h4 className="text-xs font-bold text-olive-400 uppercase tracking-[0.3em] flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2" /> Sinais Identificados
                      </h4>
                      <div className="space-y-3">
                        {result.sinais.map((sinal, i) => (
                          <div key={i} className="flex items-start space-x-3 text-sm text-olive-700">
                            <CheckCircle2 className="w-4 h-4 text-olive-400 mt-0.5 shrink-0" />
                            <span>{sinal}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-red-50 p-10 rounded-[3rem] border border-red-100 space-y-4">
                      <h4 className="text-xs font-bold text-red-400 uppercase tracking-[0.3em] flex items-center">
                        <Zap className="w-4 h-4 mr-2" /> Risco Principal
                      </h4>
                      <p className="text-red-900 font-medium">{result.riscoPrincipal}</p>
                    </div>
                  </div>
                  <div className="space-y-8">
                    <div className="bg-white p-10 rounded-[3rem] border border-olive-100 shadow-lg space-y-6">
                      <h4 className="text-xs font-bold text-olive-400 uppercase tracking-[0.3em] flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2" /> Plano de Evolução
                      </h4>
                      <div className="space-y-4">
                        {result.planoEvolucao.map((passo, i) => (
                          <div key={i} className="flex items-center space-x-3">
                            <span className="w-6 h-6 rounded-full bg-olive-100 text-olive-600 text-[10px] font-bold flex items-center justify-center shrink-0">{i+1}</span>
                            <span className="text-sm text-olive-800">{passo}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-olive-900 p-10 rounded-[3rem] text-white space-y-4 shadow-2xl">
                      <h4 className="text-xs font-bold text-olive-400 uppercase tracking-[0.3em] flex items-center">
                        <Target className="w-4 h-4 mr-2" /> Solução Recomendada
                      </h4>
                      <p className="text-xl font-bold">{result.solucaoRecomendada}</p>
                    </div>
                  </div>
                </div>

                {/* 3. Botão de Chamada para Ação (CTA) */}
                <div className="flex flex-col items-center pt-8">
                  <a 
                    href="https://wa.me/553197396474" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center px-12 py-7 bg-olive-950 text-white font-bold text-xl rounded-3xl hover:bg-black transition-all group shadow-2xl active:scale-[0.98] border-b-4 border-black"
                  >
                    Descobrir Meu Score / Agendar Raio-X
                    <ArrowRight className="ml-3 w-6 h-6 transition-transform group-hover:translate-x-2" />
                  </a>
                  
                  <button 
                    onClick={handleReset}
                    className="mt-10 text-olive-300 hover:text-olive-600 text-[10px] font-bold uppercase tracking-[0.4em] transition-colors flex items-center"
                  >
                    <RotateCcw className="w-3 h-3 mr-2" />
                    Refazer Diagnóstico
                  </button>
                </div>
              </motion.div>
            </>
          )}
      </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-8 text-center relative">
        <p className="text-[10px] font-bold text-olive-300 uppercase tracking-[0.3em]">
          Tetris Positiva • Gestão Financeira com Inteligência
        </p>
      </footer>
    </div>
  );
}
