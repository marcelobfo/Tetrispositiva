import { useState, useEffect, useMemo } from 'react';
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
  ArrowLeft
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

const PERFIS = ["OPERADOR", "TÁTICO", "ESTRATÉGICO", "DECISOR"];
const COLORS = ['#A3A375', '#7A7A52', '#525237', '#29291C']; // Olive shades

export default function AdminDashboard({ onBack }: { onBack: () => void }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'kanban' | 'analytics'>('kanban');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
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
  }, []);

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
      ? (leads.reduce((acc, l) => acc + l.pontuacao_total, 0) / leads.length).toFixed(1)
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
          </div>
        </div>

        <div className="flex items-center space-x-4">
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
              className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-180px)]"
            >
              {PERFIS.map((perfil, idx) => (
                <div key={perfil} className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                      <h3 className="font-bold text-xs uppercase tracking-widest text-olive-500">{perfil}</h3>
                    </div>
                    <span className="text-[10px] font-bold bg-olive-100 text-olive-600 px-2 py-0.5 rounded-full">
                      {filteredLeads.filter(l => l.perfil === perfil).length}
                    </span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
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
                            <span className="text-[10px] font-bold text-olive-400">{lead.pontuacao_total} pts</span>
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
          ) : (
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
                  <p className="text-xs font-bold text-olive-400 uppercase tracking-widest mb-2">Média de Pontuação</p>
                  <div className="flex items-end space-x-2">
                    <span className="text-4xl font-bold text-olive-950">{stats.avgScore}</span>
                    <span className="text-olive-500 text-sm mb-1 font-medium">/ 72 pontos</span>
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
          )}
        </AnimatePresence>
      </main>

      {/* Lead Detail Modal */}
      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLead(null)}
              className="absolute inset-0 bg-olive-950/20 backdrop-blur-sm"
            />
            <motion.div
              layoutId={selectedLead.id}
              className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-8 sm:p-12 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-olive-500 uppercase tracking-widest">Detalhes do Lead</span>
                    <h2 className="text-3xl font-bold text-olive-950">{selectedLead.nome}</h2>
                  </div>
                  <button 
                    onClick={() => setSelectedLead(null)}
                    className="p-2 hover:bg-olive-50 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-olive-400" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-olive-50 p-6 rounded-2xl space-y-1">
                    <p className="text-[10px] font-bold text-olive-400 uppercase tracking-widest">Perfil</p>
                    <p className="text-xl font-bold text-olive-900">{selectedLead.perfil}</p>
                  </div>
                  <div className="bg-olive-50 p-6 rounded-2xl space-y-1">
                    <p className="text-[10px] font-bold text-olive-400 uppercase tracking-widest">Pontuação</p>
                    <p className="text-xl font-bold text-olive-900">{selectedLead.pontuacao_total} / 72</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center p-4 border border-olive-100 rounded-2xl">
                    <Mail className="w-5 h-5 text-olive-400 mr-4" />
                    <div>
                      <p className="text-[10px] font-bold text-olive-300 uppercase">E-mail</p>
                      <p className="text-olive-800 font-medium">{selectedLead.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 border border-olive-100 rounded-2xl">
                    <Phone className="w-5 h-5 text-olive-400 mr-4" />
                    <div>
                      <p className="text-[10px] font-bold text-olive-300 uppercase">WhatsApp</p>
                      <p className="text-olive-800 font-medium">{selectedLead.whatsapp}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 border border-olive-100 rounded-2xl">
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
                  <a 
                    href={`https://wa.me/${selectedLead.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-5 bg-olive-600 text-white font-bold rounded-2xl hover:bg-olive-700 transition-all flex items-center justify-center shadow-lg shadow-olive-600/20"
                  >
                    Entrar em contato via WhatsApp
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
