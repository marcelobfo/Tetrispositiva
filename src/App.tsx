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
  Clock
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { perguntas } from './data/questions';
import { Step, LeadData, QuizResult } from './types';
import { saveLead } from './services/supabase';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';

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

  const totalQuestions = perguntas.length;
  const progress = useMemo(() => ((currentQuestionIndex + 1) / totalQuestions) * 100, [currentQuestionIndex, totalQuestions]);

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
    if (total <= 31) return {
      pontuacaoTotal: total,
      perfil: "OPERADOR",
      descricao: "Seu foco está na sobrevivência imediata. Você apaga incêndios diariamente e a gestão financeira ainda é um desafio reativo.",
      nivel: 1
    };
    if (total <= 46) return {
      pontuacaoTotal: total,
      perfil: "TÁTICO",
      descricao: "Você já possui organização básica, mas ainda falta visão estratégica para que o financeiro impulsione o crescimento real.",
      nivel: 2
    };
    if (total <= 60) return {
      pontuacaoTotal: total,
      perfil: "ESTRATÉGICO",
      descricao: "Sua gestão é sustentável. Você usa os números para planejar e manter a saúde do negócio com segurança.",
      nivel: 3
    };
    return {
      pontuacaoTotal: total,
      perfil: "DECISOR",
      descricao: "Você atingiu o nível de Lucro Livre. Suas decisões são baseadas em dados precisos e sua empresa é altamente escalável.",
      nivel: 4
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
  if (!perguntas || perguntas.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-olive-600" />
          <p className="text-olive-600 font-medium">Carregando diagnóstico...</p>
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
                  Diagnóstico de Perfil <br />
                  <span className="text-olive-500 italic font-serif font-light">Financeiro</span>
                </h1>
                
                <p className="text-lg sm:text-xl text-olive-700 max-w-lg mx-auto leading-relaxed font-light">
                  Descubra como sua gestão está impactando o lucro e a escala do seu negócio hoje.
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
                    {perguntas[currentQuestionIndex].pergunta}
                  </h2>
                </div>

                <div className="grid gap-4">
                  {perguntas[currentQuestionIndex].opcoes.map((opcao, idx) => (
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
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-10 my-auto"
            >
              <div className="bg-white p-10 sm:p-16 rounded-[3.5rem] border border-olive-100 shadow-2xl shadow-olive-900/10 text-center space-y-10 relative overflow-hidden">
                <div className="space-y-6 relative z-10">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12 }}
                    className="inline-flex items-center justify-center w-24 h-24 bg-olive-600 rounded-[2rem] text-white shadow-xl shadow-olive-600/30 mb-4"
                  >
                    {result.nivel === 1 && <Zap className="w-12 h-12" />}
                    {result.nivel === 2 && <BarChart3 className="w-12 h-12" />}
                    {result.nivel === 3 && <ShieldCheck className="w-12 h-12" />}
                    {result.nivel === 4 && <TrendingUp className="w-12 h-12" />}
                  </motion.div>
                  
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-olive-500 uppercase tracking-[0.4em]">Seu Perfil Comportamental</p>
                    <h2 className="text-5xl sm:text-7xl font-bold text-olive-950 tracking-tighter">{result.perfil}</h2>
                  </div>
                  
                  <p className="text-xl text-olive-700 leading-relaxed max-w-lg mx-auto font-light">
                    {result.descricao}
                  </p>
                </div>

                {/* Level Bar */}
                <div className="space-y-4 max-w-md mx-auto">
                  <div className="flex justify-between text-[10px] font-bold text-olive-400 uppercase tracking-widest">
                    <span>Maturidade Financeira</span>
                    <span className="text-olive-600">{result.pontuacaoTotal} / 72 Pontos</span>
                  </div>
                  <div className="h-5 bg-olive-50 rounded-full overflow-hidden p-1.5 border border-olive-100">
                    <motion.div 
                      className="bg-olive-600 h-full rounded-full shadow-sm"
                      initial={{ width: 0 }}
                      animate={{ width: `${(result.pontuacaoTotal / 72) * 100}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-[9px] font-bold text-olive-300 uppercase tracking-tighter">
                    <span className={cn(result.nivel >= 1 ? "text-olive-600" : "")}>Operador</span>
                    <span className={cn(result.nivel >= 2 ? "text-olive-600" : "")}>Tático</span>
                    <span className={cn(result.nivel >= 3 ? "text-olive-600" : "")}>Estratégico</span>
                    <span className={cn(result.nivel >= 4 ? "text-olive-600" : "")}>Decisor</span>
                  </div>
                </div>

                <div className="pt-6">
                  <a 
                    href="https://wa.me/553197396474" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full py-6 bg-olive-950 text-white font-bold text-xl rounded-2xl hover:bg-black transition-all flex items-center justify-center group shadow-xl active:scale-[0.98]"
                  >
                    Agendar Consultoria Estratégica
                    <ArrowRight className="ml-2 w-6 h-6 transition-transform group-hover:translate-x-2" />
                  </a>
                  <p className="mt-5 text-sm text-olive-400 font-medium">
                    Receba um plano de ação personalizado para escalar seu negócio.
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-white p-8 rounded-[2.5rem] border border-olive-100 flex items-start space-x-5"
                >
                  <div className="p-4 bg-olive-50 rounded-2xl text-olive-600">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-olive-950 text-lg">Guia Completo</h4>
                    <p className="text-olive-600 font-light leading-snug">Enviamos um PDF detalhado sobre o perfil {result.perfil} para seu e-mail.</p>
                  </div>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 }}
                  className="bg-white p-8 rounded-[2.5rem] border border-olive-100 flex items-start space-x-5"
                >
                  <div className="p-4 bg-olive-50 rounded-2xl text-olive-600">
                    <Mail className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-olive-950 text-lg">Suporte Direto</h4>
                    <p className="text-olive-600 font-light leading-snug">Ficou com alguma dúvida? Nossa equipe está pronta para te ajudar no WhatsApp.</p>
                  </div>
                </motion.div>
              </div>
              
              <div className="text-center pb-10">
                <button 
                  onClick={handleReset}
                  className="text-olive-400 hover:text-olive-700 text-xs font-bold uppercase tracking-widest transition-colors flex items-center mx-auto"
                >
                  <RotateCcw className="w-3 h-3 mr-2" />
                  Refazer Diagnóstico
                </button>
              </div>
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
