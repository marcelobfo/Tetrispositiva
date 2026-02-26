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
  TrendingUp, 
  Zap,
  Phone,
  Mail,
  User,
  Loader2,
  RotateCcw,
  Clock,
  AlertTriangle,
  Target
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
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.step || 'welcome';
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

  // Load diagnostic data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingDiag(true);
        const path = window.location.pathname;
        let slug = 'diagnostico-financeiro'; // Default slug

        if (path.startsWith('/d/')) {
          slug = path.split('/d/')[1];
        }

        const data = await getDiagnosticBySlug(slug);
        
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

  // Handle routing for /dashboard
  useEffect(() => {
    if (window.location.pathname === '/dashboard') {
      setStep('admin');
    }
  }, []);

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

    if (currentQuestionIndex < totalQuestions - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
      }, 300);
    } else {
      setTimeout(() => {
        setStep('lead');
      }, 300);
    }
  }, [currentQuestionIndex, respostas, totalQuestions]);

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else {
      setStep('welcome');
    }
  };

  const calculateResult = (total: number): QuizResult => {
    if (!diagnostico || !diagnostico.perfis) {
      // Fallback to static logic if something goes wrong
      const getResultForRange = (t: number) => {
        if (t <= 31) return { perfil: "OPERADOR", nivel: 1, desc: "Seu foco está na sobrevivência imediata." };
        if (t <= 46) return { perfil: "TÁTICO", nivel: 2, desc: "Você já possui organização básica." };
        if (t <= 60) return { perfil: "ESTRATÉGICO", nivel: 3, desc: "Sua gestão é sustentável." };
        return { perfil: "DECISOR", nivel: 4, desc: "Você atingiu o nível de Lucro Livre." };
      };
      const base = getResultForRange(total);
      return {
        pontuacaoTotal: total,
        perfil: base.perfil,
        descricao: base.desc,
        nivel: base.nivel,
        sinais: [],
        riscoPrincipal: "",
        planoEvolucao: [],
        solucaoRecomendada: ""
      };
    }

    const perfilEncontrado = diagnostico.perfis.find(p => total >= p.pontuacaoMin && total <= p.pontuacaoMax);
    
    if (!perfilEncontrado) {
      // If not found, use the closest one
      const sortedPerfis = [...diagnostico.perfis].sort((a, b) => a.pontuacaoMin - b.pontuacaoMin);
      const fallback = total < sortedPerfis[0].pontuacaoMin ? sortedPerfis[0] : sortedPerfis[sortedPerfis.length - 1];
      return {
        pontuacaoTotal: total,
        perfil: fallback.perfil,
        descricao: fallback.descricao,
        nivel: fallback.nivel,
        sinais: fallback.sinais,
        riscoPrincipal: fallback.riscoPrincipal,
        planoEvolucao: fallback.planoEvolucao,
        solucaoRecomendada: fallback.solucaoRecomendada
      };
    }

    return {
      pontuacaoTotal: total,
      perfil: perfilEncontrado.perfil,
      descricao: perfilEncontrado.descricao,
      nivel: perfilEncontrado.nivel,
      sinais: perfilEncontrado.sinais,
      riscoPrincipal: perfilEncontrado.riscoPrincipal,
      planoEvolucao: perfilEncontrado.planoEvolucao,
      solucaoRecomendada: perfilEncontrado.solucaoRecomendada
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

  // Safety check for empty questions
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

  if (!diagnostico) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-12 h-12 mx-auto text-red-500" />
          <h2 className="text-2xl font-bold text-olive-950">Nenhum diagnóstico encontrado</h2>
          <p className="text-olive-600">Por favor, configure um diagnóstico no painel administrativo.</p>
          <button onClick={() => setStep('admin')} className="px-6 py-2 bg-olive-900 text-white rounded-xl">Ir para Admin</button>
        </div>
      </div>
    );
  }

  if (step === 'admin') {
    if (!isAdminAuthenticated) {
      return <Login onLogin={handleAdminLogin} />;
    }
    return <AdminDashboard onBack={handleAdminLogout} />;
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
          <div className="flex items-center space-x-4">
            <div className="text-[10px] sm:text-xs font-bold text-olive-600 tracking-widest uppercase bg-olive-50 px-3 py-1 rounded-full">
              {currentQuestionIndex + 1} / {totalQuestions}
            </div>
            <button 
              onClick={handleReset}
              className="p-2 text-olive-400 hover:text-olive-600 transition-colors"
              title="Reiniciar"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
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
              className="text-center space-y-10 my-auto"
            >
              <div className="space-y-6">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-olive-50 text-olive-700 text-[10px] font-bold tracking-widest uppercase"
                >
                  <Clock className="w-3 h-3" />
                  <span>Tempo médio: 5-10 minutos</span>
                </motion.div>
                
                <h1 className="text-4xl sm:text-7xl font-bold text-olive-950 leading-[1.1] tracking-tight">
                  {diagnostico.titulo}
                </h1>
                
                <p className="text-lg sm:text-xl text-olive-700 max-w-lg mx-auto leading-relaxed font-light">
                  {diagnostico.descricao}
                </p>
              </div>

              <div className="flex flex-col items-center space-y-4">
                <button
                  onClick={handleStart}
                  className="group relative inline-flex items-center justify-center px-10 py-5 font-bold text-white transition-all duration-300 bg-olive-600 rounded-full hover:bg-olive-700 hover:shadow-xl hover:shadow-olive-600/20 active:scale-95 focus:outline-none"
                >
                  Começar Diagnóstico
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
                
                {respostas.length > 0 && (
                  <button 
                    onClick={() => setStep('questions')}
                    className="text-sm text-olive-500 hover:text-olive-700 underline underline-offset-4 transition-colors"
                  >
                    Continuar de onde parei
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {step === 'questions' && (
            <motion.div
              key={`q-${currentQuestionIndex}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-10 my-auto"
            >
              {/* Progress Bar */}
              <div className="fixed top-0 left-0 w-full h-1.5 bg-olive-50 z-[60]">
                <motion.div 
                  className="bg-olive-600 h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ type: "spring", stiffness: 50, damping: 20 }}
                />
              </div>

              <div className="space-y-8">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-olive-400 uppercase tracking-widest">Pergunta {currentQuestionIndex + 1}</span>
                  <h2 className="text-2xl sm:text-4xl font-medium text-olive-950 leading-tight tracking-tight">
                    {diagnostico.perguntas[currentQuestionIndex].pergunta}
                  </h2>
                </div>

                <div className="grid gap-4">
                  {diagnostico.perguntas[currentQuestionIndex].opcoes.map((opcao, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(opcao.pontos)}
                      className={cn(
                        "flex items-center text-left p-6 rounded-2xl border-2 transition-all duration-300 group relative overflow-hidden",
                        respostas[currentQuestionIndex] === opcao.pontos
                          ? "border-olive-600 bg-olive-50 shadow-md"
                          : "border-olive-100 hover:border-olive-300 bg-white hover:bg-olive-50/30"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl border flex items-center justify-center mr-5 shrink-0 transition-all duration-300 font-bold",
                        respostas[currentQuestionIndex] === opcao.pontos
                          ? "bg-olive-600 border-olive-600 text-white scale-110"
                          : "border-olive-200 group-hover:border-olive-400 text-olive-400"
                      )}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="text-lg text-olive-800 font-medium leading-tight">{opcao.texto}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-olive-50">
                <button
                  onClick={handleBack}
                  className="flex items-center text-olive-400 hover:text-olive-700 font-bold text-sm transition-colors group"
                >
                  <ChevronLeft className="w-5 h-5 mr-1 transition-transform group-hover:-translate-x-1" />
                  VOLTAR
                </button>
                
                <div className="text-[10px] font-bold text-olive-300 uppercase tracking-widest">
                  Selecione uma opção para avançar
                </div>
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
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full max-w-4xl mx-auto space-y-12 pb-20"
            >
              {/* Hero Result Section */}
              <section className="bg-white p-10 sm:p-20 rounded-[4rem] border border-olive-100 shadow-2xl shadow-olive-900/5 text-center space-y-10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-olive-200 via-olive-600 to-olive-200" />
                
                <div className="space-y-8 relative z-10">
                  <motion.div 
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 12, delay: 0.2 }}
                    className="inline-flex items-center justify-center w-28 h-28 bg-olive-600 rounded-[2.5rem] text-white shadow-2xl shadow-olive-600/40 mb-4"
                  >
                    {result.nivel === 1 && <Zap className="w-14 h-14" />}
                    {result.nivel === 2 && <BarChart3 className="w-14 h-14" />}
                    {result.nivel === 3 && <ShieldCheck className="w-14 h-14" />}
                    {result.nivel === 4 && <TrendingUp className="w-14 h-14" />}
                  </motion.div>
                  
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-olive-500 uppercase tracking-[0.5em]">Diagnóstico Concluído</p>
                    <h2 className="text-6xl sm:text-8xl font-bold text-olive-950 tracking-tighter leading-none">
                      Perfil <span className="text-olive-600">{result.perfil}</span>
                    </h2>
                  </div>
                  
                  <p className="text-2xl text-olive-700 leading-relaxed max-w-2xl mx-auto font-light">
                    {result.descricao}
                  </p>
                </div>

                {/* Level Progress */}
                <div className="space-y-6 max-w-xl mx-auto pt-4">
                  <div className="flex justify-between items-end">
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-olive-400 uppercase tracking-widest mb-1">Status Atual</p>
                      <p className="text-lg font-bold text-olive-900">Maturidade Nível {result.nivel}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-olive-400 uppercase tracking-widest mb-1">Pontuação</p>
                      <p className="text-lg font-bold text-olive-600">{result.pontuacaoTotal} <span className="text-sm text-olive-300">/ 72</span></p>
                    </div>
                  </div>
                  <div className="h-4 bg-olive-50 rounded-full overflow-hidden p-1 border border-olive-100 shadow-inner">
                    <motion.div 
                      className="bg-olive-600 h-full rounded-full shadow-lg"
                      initial={{ width: 0 }}
                      animate={{ width: `${(result.pontuacaoTotal / 72) * 100}%` }}
                      transition={{ duration: 2, ease: "circOut" }}
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-[10px] font-bold text-olive-300 uppercase tracking-widest">
                    <div className={cn("transition-colors duration-500", result.nivel >= 1 ? "text-olive-600" : "")}>Operador</div>
                    <div className={cn("transition-colors duration-500", result.nivel >= 2 ? "text-olive-600" : "")}>Tático</div>
                    <div className={cn("transition-colors duration-500", result.nivel >= 3 ? "text-olive-600" : "")}>Estratégico</div>
                    <div className={cn("transition-colors duration-500", result.nivel >= 4 ? "text-olive-600" : "")}>Decisor</div>
                  </div>
                </div>
              </section>

              {/* Detailed Insights Section */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* Sinais e Riscos */}
                <div className="space-y-8">
                  <div className="bg-white p-10 rounded-[3rem] border border-olive-100 shadow-xl shadow-olive-900/5 space-y-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-olive-50 rounded-lg text-olive-600">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-olive-900 uppercase tracking-wider">⚠️ Sinais Identificados</h3>
                    </div>
                    <div className="space-y-3">
                      {result.sinais.map((sinal, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + (i * 0.1) }}
                          className="flex items-start space-x-3 bg-olive-50/30 p-4 rounded-2xl border border-olive-100/50"
                        >
                          <CheckCircle2 className="w-5 h-5 text-olive-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-olive-800 font-medium leading-tight">{sinal}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-red-50 p-10 rounded-[3rem] border border-red-100 shadow-xl shadow-red-900/5 space-y-4">
                    <div className="flex items-center space-x-3 text-red-600">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Zap className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold uppercase tracking-wider">🚨 Risco Principal</h3>
                    </div>
                    <p className="text-lg text-red-900 font-medium leading-relaxed">
                      {result.riscoPrincipal}
                    </p>
                  </div>
                </div>

                {/* Plano e Solução */}
                <div className="space-y-8">
                  <div className="bg-white p-10 rounded-[3rem] border border-olive-100 shadow-xl shadow-olive-900/5 space-y-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-olive-50 rounded-lg text-olive-600">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-olive-900 uppercase tracking-wider">✅ Plano de Evolução</h3>
                    </div>
                    <div className="space-y-3">
                      {result.planoEvolucao.map((passo, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + (i * 0.1) }}
                          className="flex items-center space-x-4 bg-white p-4 rounded-2xl border border-olive-50 shadow-sm hover:border-olive-200 transition-colors"
                        >
                          <span className="w-8 h-8 rounded-full bg-olive-100 text-olive-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                          <span className="text-sm text-olive-900 font-medium leading-tight">{passo}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-olive-900 p-10 rounded-[3rem] text-white space-y-6 shadow-2xl shadow-olive-900/30 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                    <div className="flex items-center space-x-3 text-olive-300">
                      <div className="p-2 bg-white/10 rounded-lg">
                        <Target className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold uppercase tracking-wider">🎯 Solução Recomendada</h3>
                    </div>
                    <div className="space-y-4">
                      <p className="text-3xl font-bold tracking-tight leading-tight">
                        {result.solucaoRecomendada}
                      </p>
                      <div className="h-1 w-12 bg-olive-500 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Call to Action Section */}
              <section className="bg-white p-10 sm:p-16 rounded-[4rem] border border-olive-100 shadow-2xl shadow-olive-900/5 text-center space-y-8">
                <div className="space-y-4">
                  <h3 className="text-3xl font-bold text-olive-950">Pronto para o próximo nível?</h3>
                  <p className="text-olive-600 max-w-xl mx-auto text-lg font-light">
                    Agende uma conversa estratégica gratuita para entendermos como aplicar esse plano de evolução no seu negócio hoje.
                  </p>
                </div>
                
                <div className="flex flex-col items-center space-y-6">
                  <a 
                    href="https://wa.me/553197396474" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-12 py-6 bg-olive-950 text-white font-bold text-xl rounded-2xl hover:bg-black transition-all group shadow-2xl active:scale-[0.98]"
                  >
                    Falar com Especialista no WhatsApp
                    <ArrowRight className="ml-3 w-6 h-6 transition-transform group-hover:translate-x-2" />
                  </a>
                  
                  <button 
                    onClick={handleReset}
                    className="text-olive-400 hover:text-olive-700 text-xs font-bold uppercase tracking-[0.3em] transition-colors flex items-center"
                  >
                    <RotateCcw className="w-3 h-3 mr-2" />
                    Refazer Diagnóstico Completo
                  </button>
                </div>
              </section>
            </motion.div>
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
