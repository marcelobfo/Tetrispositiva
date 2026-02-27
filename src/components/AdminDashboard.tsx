import { useState, useEffect, useMemo, MouseEvent } from 'react';
import { 
  Users, 
  LayoutDashboard, 
  Kanban as KanbanIcon, 
  BarChart3, 
  X, 
  Mail, 
  Phone, 
  Calendar, 
  TrendingUp,
  Search,
  Filter,
  ChevronRight,
  ArrowLeft,
  Info,
  CheckCircle2,
  AlertTriangle,
  Target,
  Settings,
  Trash2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PERFIL_DATA } from '../constants';
import { DiagnosticEditor } from './DiagnosticEditor';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Lead {
  id: string;
  nome: string;
  email: string;
  whatsapp: string;
  perfil: string;
  pontuacao_total: number;
  created_at: string;
  respostas: number[];
}

const PERFIS = ["CAOS FINANCEIRO", "NEGÓCIO EM CONSTRUÇÃO", "ESTRUTURA SUSTENTÁVEL", "LUCRO LIVRE"];
const COLORS = ['#ef4444', '#f97316', '#3b82f6', '#10b981']; // Matching profile colors

export default function AdminDashboard({ onBack }: { onBack: () => void }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'kanban' | 'analytics' | 'diagnostics'>('kanban');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchLeads = () => {
    fetch('/api/leads')
      .then(res => res.json())
      .then(data => {
        setLeads(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleDeleteLead = async (e: MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir este lead?')) return;
    
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLeads(prev => prev.filter(l => l.id !== id));
        if (selectedLead?.id === id) setSelectedLead(null);
      } else {
        alert('Erro ao excluir lead');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir lead');
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(l => 
      l.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
      l.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [leads, searchTerm]);

  const stats = useMemo(() => {
    const counts = PERFIS.map(p => ({
      name: p,
      value: leads.filter(l => l.perfil === p).length
    }));
    
    const avgScore = leads.length > 0 
      ? Math.round(leads.reduce((acc, l) => acc + Number(l.pontuacao_total || 0), 0) / leads.length)
      : 0;

    return { counts, avgScore, total: leads.length };
  }, [leads]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-olive-950 font-sans">
      {/* Sidebar / Top Nav */}
      <nav className="bg-white border-b border-olive-100 px-8 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center space-x-8">
          <button onClick={onBack} className="p-2 hover:bg-olive-50 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-olive-600" />
          </button>
          <h1 className="text-xl font-bold tracking-tight text-olive-900">Dashboard Interno</h1>
          
          <div className="flex bg-olive-50 p-1 rounded-xl">
            <button 
              onClick={() => setView('kanban')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center",
                view === 'kanban' ? "bg-white text-olive-900 shadow-sm" : "text-olive-400 hover:text-olive-600"
              )}
            >
              <KanbanIcon className="w-4 h-4 mr-2" />
              Kanban
            </button>
            <button 
              onClick={() => setView('analytics')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center",
                view === 'analytics' ? "bg-white text-olive-900 shadow-sm" : "text-olive-400 hover:text-olive-600"
              )}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </button>
            <button 
              onClick={() => setView('diagnostics')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center",
                view === 'diagnostics' ? "bg-white text-olive-900 shadow-sm" : "text-olive-400 hover:text-olive-600"
              )}
            >
              <Settings className="w-4 h-4 mr-2" />
              Diagnósticos
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden lg:flex items-center px-4 py-2 bg-olive-50 rounded-xl border border-olive-100">
            <div className="mr-3">
              <p className="text-[9px] font-bold text-olive-400 uppercase tracking-wider">Média Geral</p>
              <p className="text-sm font-bold text-olive-900 leading-none">{stats.avgScore} <span className="text-[10px] text-olive-400 font-normal">pts</span></p>
            </div>
            <div className="group relative">
              <Info className="w-3 h-3 text-olive-300 cursor-help" />
              <div className="absolute top-full right-0 mt-2 w-48 p-2 bg-olive-900 text-white text-[9px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                Média aritmética de todos os diagnósticos realizados.
              </div>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-olive-300" />
            <input 
              type="text" 
              placeholder="Buscar lead..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-olive-50 border-transparent focus:bg-white focus:border-olive-200 rounded-xl text-sm outline-none transition-all w-64"
            />
          </div>
          <button 
            onClick={onBack}
            className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors"
          >
            Sair
          </button>
        </div>
      </nav>

      <main className="p-8">
        <AnimatePresence mode="wait">
          {view === 'kanban' ? (
            <motion.div 
              key="kanban"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start"
            >
              {PERFIS.map((perfil, idx) => (
                <div key={perfil} className="flex flex-col">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                      <h3 className="font-bold text-xs uppercase tracking-widest text-olive-500">{perfil}</h3>
                    </div>
                    <span className="text-[10px] font-bold bg-olive-100 text-olive-600 px-2 py-0.5 rounded-full">
                      {filteredLeads.filter(l => l.perfil === perfil).length}
                    </span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar max-h-[520px] pb-4">
                    {filteredLeads.filter(l => l.perfil === perfil).map(lead => (
                      <motion.div
                        layoutId={lead.id}
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className="bg-white p-5 rounded-2xl border border-olive-100 hover:border-olive-300 hover:shadow-lg hover:shadow-olive-900/5 transition-all cursor-pointer group"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-olive-900 group-hover:text-olive-600 transition-colors">{lead.nome}</h4>
                            <div className="flex flex-col items-end space-y-2">
                              <span className="text-[10px] font-bold text-olive-400">{lead.pontuacao_total} pts</span>
                              <button
                                onClick={(e) => handleDeleteLead(e, lead.id)}
                                disabled={isDeleting === lead.id}
                                className="p-1.5 text-olive-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center text-xs text-olive-500">
                            <Mail className="w-3 h-3 mr-2" />
                            <span className="truncate">{lead.email}</span>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-olive-50">
                            <span className="text-[10px] text-olive-300 uppercase font-bold">
                              {new Date(lead.created_at).toLocaleDateString()}
                            </span>
                            <ChevronRight className="w-4 h-4 text-olive-200 group-hover:text-olive-400 transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          ) : view === 'analytics' ? (
            <motion.div 
              key="analytics"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-3xl border border-olive-100 shadow-sm">
                  <p className="text-xs font-bold text-olive-400 uppercase tracking-widest mb-2">Total de Leads</p>
                  <div className="flex items-end space-x-2">
                    <span className="text-4xl font-bold text-olive-950">{stats.total}</span>
                    <span className="text-olive-500 text-sm mb-1 font-medium">diagnósticos</span>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-olive-100 shadow-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <p className="text-xs font-bold text-olive-400 uppercase tracking-widest">Média de Pontuação</p>
                    <div className="group relative">
                      <Info className="w-3.5 h-3.5 text-olive-300 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-olive-900 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl leading-relaxed">
                        <p className="font-bold mb-1">Como é calculado?</p>
                        A média é a soma de todas as pontuações individuais dividida pelo número total de leads. 
                        Cada diagnóstico varia de 18 a 72 pontos, onde quanto maior a pontuação, mais madura é a gestão financeira.
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-olive-900" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-end space-x-2">
                    <span className="text-4xl font-bold text-olive-950">{stats.avgScore}</span>
                    <span className="text-olive-500 text-sm mb-1 font-medium">/ 100 pontos</span>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-olive-100 shadow-sm">
                  <p className="text-xs font-bold text-olive-400 uppercase tracking-widest mb-2">Perfil Dominante</p>
                  <div className="flex items-end space-x-2">
                    <span className="text-2xl font-bold text-olive-950">
                      {stats.counts.sort((a,b) => b.value - a.value)[0]?.name || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-olive-100 shadow-sm">
                  <h3 className="text-lg font-bold text-olive-900 mb-8">Distribuição de Perfis</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.counts}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {stats.counts.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center space-x-6 mt-4">
                    {PERFIS.map((p, i) => (
                      <div key={p} className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                        <span className="text-[10px] font-bold text-olive-500 uppercase">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-olive-100 shadow-sm">
                  <h3 className="text-lg font-bold text-olive-900 mb-8">Volume por Perfil</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.counts}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0E8" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#A3A375', fontSize: 10, fontWeight: 700 }} 
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A3A375', fontSize: 10 }} />
                        <Tooltip 
                          cursor={{ fill: '#F9F9F7' }}
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="value" fill="#7A7A52" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="diagnostics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <DiagnosticEditor />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Lead Detail Modal */}
      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLead(null)}
              className="absolute inset-0 bg-olive-950/40 backdrop-blur-md"
            />
            <motion.div
              layoutId={selectedLead.id}
              className="bg-[#F9F9F7] w-full h-full sm:h-[90vh] sm:max-w-5xl sm:rounded-[3rem] shadow-2xl relative z-10 overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-white px-8 py-6 sm:px-12 sm:py-8 flex justify-between items-center border-b border-olive-100 flex-shrink-0">
                <div className="flex items-center space-x-6">
                  <div className="w-12 h-12 bg-olive-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-olive-400 uppercase tracking-widest">Dossiê do Lead</span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-olive-950">{selectedLead.nome}</h2>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => handleDeleteLead(e, selectedLead.id)}
                    disabled={isDeleting === selectedLead.id}
                    className="p-3 text-red-400 hover:bg-red-50 rounded-full transition-colors group"
                    title="Excluir Lead"
                  >
                    <Trash2 className="w-6 h-6 group-hover:text-red-600 transition-colors" />
                  </button>
                  <button 
                    onClick={() => setSelectedLead(null)}
                    className="p-3 hover:bg-olive-50 rounded-full transition-colors group"
                  >
                    <X className="w-6 h-6 text-olive-400 group-hover:text-olive-900 transition-colors" />
                  </button>
                </div>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-8 sm:p-12 space-y-12">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-8 rounded-3xl border border-olive-100 shadow-sm space-y-1">
                    <p className="text-[10px] font-bold text-olive-400 uppercase tracking-widest">Perfil Identificado</p>
                    <p className="text-2xl font-bold text-olive-900">{selectedLead.perfil}</p>
                  </div>
                  <div className="bg-white p-8 rounded-3xl border border-olive-100 shadow-sm space-y-1">
                    <p className="text-[10px] font-bold text-olive-400 uppercase tracking-widest">Pontuação Total</p>
                    <div className="flex items-baseline space-x-1">
                      <p className="text-2xl font-bold text-olive-900">{selectedLead.pontuacao_total}</p>
                      <p className="text-sm text-olive-300 font-bold">/ 100</p>
                    </div>
                  </div>
                  <div className="bg-white p-8 rounded-3xl border border-olive-100 shadow-sm space-y-1">
                    <p className="text-[10px] font-bold text-olive-400 uppercase tracking-widest">Nível de Maturidade</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4].map(n => (
                          <div 
                            key={n} 
                            className={cn(
                              "w-3 h-3 rounded-full",
                              n <= (selectedLead.pontuacao_total <= 31 ? 1 : selectedLead.pontuacao_total <= 46 ? 2 : selectedLead.pontuacao_total <= 60 ? 3 : 4) 
                                ? "bg-olive-600" : "bg-olive-100"
                            )} 
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-olive-600 ml-2">
                        {selectedLead.pontuacao_total <= 24 ? 'Caos Financeiro' : selectedLead.pontuacao_total <= 52 ? 'Negócio em Construção' : selectedLead.pontuacao_total <= 78 ? 'Estrutura Sustentável' : 'Lucro Livre'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                  {/* Contact Info */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-olive-900 border-b border-olive-100 pb-4">Informações de Contato</h3>
                    <div className="space-y-4">
                      <div className="flex items-center p-5 bg-white border border-olive-100 rounded-2xl shadow-sm">
                        <Mail className="w-5 h-5 text-olive-400 mr-4" />
                        <div>
                          <p className="text-[10px] font-bold text-olive-300 uppercase">E-mail Corporativo</p>
                          <p className="text-olive-800 font-medium">{selectedLead.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center p-5 bg-white border border-olive-100 rounded-2xl shadow-sm">
                        <Phone className="w-5 h-5 text-olive-400 mr-4" />
                        <div>
                          <p className="text-[10px] font-bold text-olive-300 uppercase">WhatsApp</p>
                          <p className="text-olive-800 font-medium">{selectedLead.whatsapp}</p>
                        </div>
                      </div>
                      <div className="flex items-center p-5 bg-white border border-olive-100 rounded-2xl shadow-sm">
                        <Calendar className="w-5 h-5 text-olive-400 mr-4" />
                        <div>
                          <p className="text-[10px] font-bold text-olive-300 uppercase">Data do Diagnóstico</p>
                          <p className="text-olive-800 font-medium">
                            {new Date(selectedLead.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      {(() => {
                        const cleanPhone = selectedLead.whatsapp.replace(/\D/g, '');
                        const finalPhone = cleanPhone.startsWith('0') 
                          ? '55' + cleanPhone.substring(1) 
                          : cleanPhone.startsWith('55') 
                            ? cleanPhone 
                            : '55' + cleanPhone;
                        return (
                          <a 
                            href={`https://wa.me/${finalPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-5 bg-olive-900 text-white font-bold rounded-2xl hover:bg-black transition-all flex items-center justify-center shadow-xl shadow-olive-900/20"
                          >
                            <Phone className="w-5 h-5 mr-3" />
                            Iniciar Conversa no WhatsApp
                          </a>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Diagnosis Details */}
                  <div className="space-y-8">
                    <h3 className="text-lg font-bold text-olive-900 border-b border-olive-100 pb-4">Análise Estratégica</h3>
                    
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-olive-400 uppercase tracking-widest">⚠️ Sinais Identificados</p>
                        <div className="grid grid-cols-1 gap-2">
                          {(PERFIL_DATA[selectedLead.perfil]?.sinais || []).map((sinal, i) => (
                            <div key={i} className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-olive-100 shadow-sm">
                              <CheckCircle2 className="w-4 h-4 text-olive-600 flex-shrink-0" />
                              <span className="text-xs text-olive-800 font-medium">{sinal}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-red-50 p-6 rounded-2xl border border-red-100 space-y-2">
                        <div className="flex items-center space-x-2 text-red-600">
                          <AlertTriangle className="w-4 h-4" />
                          <p className="text-[10px] font-bold uppercase tracking-widest">🚨 Risco Principal</p>
                        </div>
                        <p className="text-sm text-red-900 font-medium">
                          {PERFIL_DATA[selectedLead.perfil]?.riscoPrincipal}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-olive-400 uppercase tracking-widest">✅ Plano de Evolução Recomendado</p>
                        <div className="space-y-2">
                          {(PERFIL_DATA[selectedLead.perfil]?.planoEvolucao || []).map((passo, i) => (
                            <div key={i} className="flex items-center space-x-4 bg-white p-4 rounded-xl border border-olive-50 shadow-sm">
                              <span className="w-6 h-6 rounded-full bg-olive-100 text-olive-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                              <span className="text-xs text-olive-900 font-medium">{passo}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-olive-900 p-8 rounded-3xl text-white space-y-3 shadow-xl">
                        <div className="flex items-center space-x-2 text-olive-300">
                          <Target className="w-4 h-4" />
                          <p className="text-[10px] font-bold uppercase tracking-widest">🎯 Solução Recomendada</p>
                        </div>
                        <p className="text-lg font-bold">
                          {PERFIL_DATA[selectedLead.perfil]?.solucaoRecomendada}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
