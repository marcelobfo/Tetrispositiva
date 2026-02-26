import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Save, ChevronRight, ChevronDown, 
  Settings, HelpCircle, Target, AlertTriangle, 
  CheckCircle2, List, Layout, X, Edit3, Copy
} from 'lucide-react';
import { Diagnostico, Pergunta, PerfilResultado, Opcao } from '../types';
import { getDiagnostics, saveDiagnostic, deleteDiagnostic, getDiagnosticBySlug } from '../services/supabase';
import { cn } from '../lib/utils';

export function DiagnosticEditor() {
  const [diagnostics, setDiagnostics] = useState<Diagnostico[]>([]);
  const [editingDiag, setEditingDiag] = useState<Partial<Diagnostico> | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'questions' | 'results'>('info');

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const loadDiagnostics = async () => {
    try {
      const data = await getDiagnostics();
      setDiagnostics(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = async (diag: Diagnostico) => {
    try {
      setLoading(true);
      const fullDiag = await getDiagnosticBySlug(diag.slug);
      // Map database structure to our frontend interface
      const mappedDiag: Partial<Diagnostico> = {
        ...fullDiag,
        perguntas: (fullDiag.perguntas || []).map((p: any) => ({
          id: p.id,
          pergunta: p.texto,
          opcoes: (p.opcoes || []).map((o: any) => ({
            id: o.id,
            texto: o.texto,
            pontos: o.pontos
          }))
        })),
        perfis: (fullDiag.perfis_resultado || []).map((p: any) => ({
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
      setEditingDiag(mappedDiag);
      setActiveTab('info');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingDiag({
      titulo: 'Novo Diagnóstico',
      slug: 'novo-diagnostico',
      isActive: true,
      perguntas: [],
      perfis: []
    });
    setActiveTab('info');
  };

  const handleSave = async () => {
    if (!editingDiag) return;
    try {
      setLoading(true);
      await saveDiagnostic(editingDiag);
      setEditingDiag(null);
      loadDiagnostics();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar diagnóstico');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este diagnóstico?')) return;
    try {
      await deleteDiagnostic(id);
      loadDiagnostics();
    } catch (err) {
      console.error(err);
    }
  };

  if (editingDiag) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setEditingDiag(null)}
              className="p-2 hover:bg-olive-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-olive-600" />
            </button>
            <h2 className="text-2xl font-bold text-olive-950">{editingDiag.titulo}</h2>
          </div>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex items-center px-6 py-2 bg-olive-900 text-white rounded-xl hover:bg-black transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar Diagnóstico'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-olive-50 p-1 rounded-2xl w-fit">
          <button 
            onClick={() => setActiveTab('info')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all",
              activeTab === 'info' ? "bg-white text-olive-900 shadow-sm" : "text-olive-400 hover:text-olive-600"
            )}
          >
            Informações
          </button>
          <button 
            onClick={() => setActiveTab('questions')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all",
              activeTab === 'questions' ? "bg-white text-olive-900 shadow-sm" : "text-olive-400 hover:text-olive-600"
            )}
          >
            Perguntas
          </button>
          <button 
            onClick={() => setActiveTab('results')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all",
              activeTab === 'results' ? "bg-white text-olive-900 shadow-sm" : "text-olive-400 hover:text-olive-600"
            )}
          >
            Resultados (Perfis)
          </button>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-olive-100 shadow-sm">
          {activeTab === 'info' && (
            <div className="space-y-6 max-w-2xl">
              <div className="space-y-2">
                <label className="text-xs font-bold text-olive-400 uppercase tracking-widest">Título do Diagnóstico</label>
                <input 
                  type="text" 
                  value={editingDiag.titulo}
                  onChange={e => setEditingDiag({...editingDiag, titulo: e.target.value})}
                  className="w-full p-4 bg-olive-50 border border-olive-100 rounded-2xl focus:ring-2 focus:ring-olive-900 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-olive-400 uppercase tracking-widest">Descrição (Welcome Page)</label>
                <textarea 
                  value={editingDiag.descricao}
                  onChange={e => setEditingDiag({...editingDiag, descricao: e.target.value})}
                  rows={4}
                  className="w-full p-4 bg-olive-50 border border-olive-100 rounded-2xl focus:ring-2 focus:ring-olive-900 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-olive-400 uppercase tracking-widest">URL Slug (Identificador)</label>
                <input 
                  type="text" 
                  value={editingDiag.slug}
                  onChange={e => setEditingDiag({...editingDiag, slug: e.target.value})}
                  className="w-full p-4 bg-olive-50 border border-olive-100 rounded-2xl focus:ring-2 focus:ring-olive-900 outline-none"
                />
              </div>
              <div className="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  checked={editingDiag.isActive}
                  onChange={e => setEditingDiag({...editingDiag, isActive: e.target.checked})}
                  className="w-5 h-5 rounded border-olive-300 text-olive-900 focus:ring-olive-900"
                />
                <label className="text-sm font-bold text-olive-700">Diagnóstico Ativo</label>
              </div>
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-olive-900">Gerenciar Perguntas</h3>
                <button 
                  onClick={() => {
                    const newPerguntas = [...(editingDiag.perguntas || []), { pergunta: 'Nova Pergunta', opcoes: [] }];
                    setEditingDiag({...editingDiag, perguntas: newPerguntas});
                  }}
                  className="flex items-center px-4 py-2 bg-olive-50 text-olive-900 rounded-xl hover:bg-olive-100 transition-all font-bold text-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Pergunta
                </button>
              </div>

              <div className="space-y-6">
                {(editingDiag.perguntas || []).map((p, pIdx) => (
                  <div key={pIdx} className="p-6 bg-olive-50/50 border border-olive-100 rounded-[2rem] space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-bold text-olive-400 uppercase tracking-widest">Pergunta {pIdx + 1}</label>
                        <input 
                          type="text" 
                          value={p.pergunta}
                          onChange={e => {
                            const newPerguntas = [...(editingDiag.perguntas || [])];
                            newPerguntas[pIdx].pergunta = e.target.value;
                            setEditingDiag({...editingDiag, perguntas: newPerguntas});
                          }}
                          className="w-full p-3 bg-white border border-olive-100 rounded-xl focus:ring-2 focus:ring-olive-900 outline-none font-medium"
                        />
                      </div>
                      <button 
                        onClick={() => {
                          const newPerguntas = (editingDiag.perguntas || []).filter((_, i) => i !== pIdx);
                          setEditingDiag({...editingDiag, perguntas: newPerguntas});
                        }}
                        className="ml-4 p-2 text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-olive-400 uppercase tracking-widest">Opções de Resposta</label>
                        <button 
                          onClick={() => {
                            const newPerguntas = [...(editingDiag.perguntas || [])];
                            newPerguntas[pIdx].opcoes.push({ texto: 'Nova Opção', pontos: 0 });
                            setEditingDiag({...editingDiag, perguntas: newPerguntas});
                          }}
                          className="text-[10px] font-bold text-olive-600 hover:underline"
                        >
                          + Adicionar Opção
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {p.opcoes.map((o, oIdx) => (
                          <div key={oIdx} className="flex items-center space-x-3">
                            <input 
                              type="text" 
                              value={o.texto}
                              onChange={e => {
                                const newPerguntas = [...(editingDiag.perguntas || [])];
                                newPerguntas[pIdx].opcoes[oIdx].texto = e.target.value;
                                setEditingDiag({...editingDiag, perguntas: newPerguntas});
                              }}
                              placeholder="Texto da opção"
                              className="flex-1 p-2 bg-white border border-olive-100 rounded-lg text-sm outline-none"
                            />
                            <input 
                              type="number" 
                              value={o.pontos}
                              onChange={e => {
                                const newPerguntas = [...(editingDiag.perguntas || [])];
                                newPerguntas[pIdx].opcoes[oIdx].pontos = parseInt(e.target.value) || 0;
                                setEditingDiag({...editingDiag, perguntas: newPerguntas});
                              }}
                              placeholder="Pts"
                              className="w-20 p-2 bg-white border border-olive-100 rounded-lg text-sm outline-none text-center"
                            />
                            <button 
                              onClick={() => {
                                const newPerguntas = [...(editingDiag.perguntas || [])];
                                newPerguntas[pIdx].opcoes = newPerguntas[pIdx].opcoes.filter((_, i) => i !== oIdx);
                                setEditingDiag({...editingDiag, perguntas: newPerguntas});
                              }}
                              className="p-2 text-olive-300 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-olive-900">Configurar Perfis de Resultado</h3>
                <button 
                  onClick={() => {
                    const newPerfis = [...(editingDiag.perfis || []), { 
                      perfil: 'Novo Perfil', 
                      pontuacaoMin: 0, 
                      pontuacaoMax: 0, 
                      nivel: 1,
                      descricao: '',
                      riscoPrincipal: '',
                      solucaoRecomendada: '',
                      sinais: [],
                      planoEvolucao: []
                    }];
                    setEditingDiag({...editingDiag, perfis: newPerfis});
                  }}
                  className="flex items-center px-4 py-2 bg-olive-50 text-olive-900 rounded-xl hover:bg-olive-100 transition-all font-bold text-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Perfil
                </button>
              </div>

              <div className="space-y-12">
                {(editingDiag.perfis || []).map((p, pIdx) => (
                  <div key={pIdx} className="p-8 bg-olive-50/30 border border-olive-100 rounded-[3rem] space-y-6 relative">
                    <button 
                      onClick={() => {
                        const newPerfis = (editingDiag.perfis || []).filter((_, i) => i !== pIdx);
                        setEditingDiag({...editingDiag, perfis: newPerfis});
                      }}
                      className="absolute top-6 right-6 p-2 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-bold text-olive-400 uppercase tracking-widest">Nome do Perfil</label>
                        <input 
                          type="text" 
                          value={p.perfil}
                          onChange={e => {
                            const newPerfis = [...(editingDiag.perfis || [])];
                            newPerfis[pIdx].perfil = e.target.value;
                            setEditingDiag({...editingDiag, perfis: newPerfis});
                          }}
                          className="w-full p-3 bg-white border border-olive-100 rounded-xl outline-none font-bold text-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-olive-400 uppercase tracking-widest">Faixa de Pontos</label>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="number" 
                            value={p.pontuacaoMin}
                            onChange={e => {
                              const newPerfis = [...(editingDiag.perfis || [])];
                              newPerfis[pIdx].pontuacaoMin = parseInt(e.target.value) || 0;
                              setEditingDiag({...editingDiag, perfis: newPerfis});
                            }}
                            className="w-full p-3 bg-white border border-olive-100 rounded-xl text-center"
                          />
                          <span className="text-olive-300">-</span>
                          <input 
                            type="number" 
                            value={p.pontuacaoMax}
                            onChange={e => {
                              const newPerfis = [...(editingDiag.perfis || [])];
                              newPerfis[pIdx].pontuacaoMax = parseInt(e.target.value) || 0;
                              setEditingDiag({...editingDiag, perfis: newPerfis});
                            }}
                            className="w-full p-3 bg-white border border-olive-100 rounded-xl text-center"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-olive-400 uppercase tracking-widest">Nível (1-4)</label>
                        <input 
                          type="number" 
                          min="1" max="4"
                          value={p.nivel}
                          onChange={e => {
                            const newPerfis = [...(editingDiag.perfis || [])];
                            newPerfis[pIdx].nivel = parseInt(e.target.value) || 1;
                            setEditingDiag({...editingDiag, perfis: newPerfis});
                          }}
                          className="w-full p-3 bg-white border border-olive-100 rounded-xl text-center"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-olive-400 uppercase tracking-widest">Descrição do Perfil</label>
                        <textarea 
                          value={p.descricao}
                          onChange={e => {
                            const newPerfis = [...(editingDiag.perfis || [])];
                            newPerfis[pIdx].descricao = e.target.value;
                            setEditingDiag({...editingDiag, perfis: newPerfis});
                          }}
                          rows={3}
                          className="w-full p-4 bg-white border border-olive-100 rounded-2xl outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-olive-400 uppercase tracking-widest">🚨 Risco Principal</label>
                        <input 
                          type="text" 
                          value={p.riscoPrincipal}
                          onChange={e => {
                            const newPerfis = [...(editingDiag.perfis || [])];
                            newPerfis[pIdx].riscoPrincipal = e.target.value;
                            setEditingDiag({...editingDiag, perfis: newPerfis});
                          }}
                          className="w-full p-3 bg-white border border-olive-100 rounded-xl outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-olive-400 uppercase tracking-widest">🎯 Solução Recomendada</label>
                        <input 
                          type="text" 
                          value={p.solucaoRecomendada}
                          onChange={e => {
                            const newPerfis = [...(editingDiag.perfis || [])];
                            newPerfis[pIdx].solucaoRecomendada = e.target.value;
                            setEditingDiag({...editingDiag, perfis: newPerfis});
                          }}
                          className="w-full p-3 bg-white border border-olive-100 rounded-xl outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold text-olive-400 uppercase tracking-widest">⚠️ Sinais Identificados</label>
                          <button 
                            onClick={() => {
                              const newPerfis = [...(editingDiag.perfis || [])];
                              newPerfis[pIdx].sinais.push('Novo sinal');
                              setEditingDiag({...editingDiag, perfis: newPerfis});
                            }}
                            className="text-[10px] font-bold text-olive-600 hover:underline"
                          >
                            + Adicionar
                          </button>
                        </div>
                        <div className="space-y-2">
                          {p.sinais.map((s, sIdx) => (
                            <div key={sIdx} className="flex items-center space-x-2">
                              <input 
                                type="text" 
                                value={s}
                                onChange={e => {
                                  const newPerfis = [...(editingDiag.perfis || [])];
                                  newPerfis[pIdx].sinais[sIdx] = e.target.value;
                                  setEditingDiag({...editingDiag, perfis: newPerfis});
                                }}
                                className="flex-1 p-2 bg-white border border-olive-100 rounded-lg text-xs"
                              />
                              <button 
                                onClick={() => {
                                  const newPerfis = [...(editingDiag.perfis || [])];
                                  newPerfis[pIdx].sinais = newPerfis[pIdx].sinais.filter((_, i) => i !== sIdx);
                                  setEditingDiag({...editingDiag, perfis: newPerfis});
                                }}
                                className="text-olive-300 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold text-olive-400 uppercase tracking-widest">✅ Plano de Evolução</label>
                          <button 
                            onClick={() => {
                              const newPerfis = [...(editingDiag.perfis || [])];
                              newPerfis[pIdx].planoEvolucao.push('Novo passo');
                              setEditingDiag({...editingDiag, perfis: newPerfis});
                            }}
                            className="text-[10px] font-bold text-olive-600 hover:underline"
                          >
                            + Adicionar
                          </button>
                        </div>
                        <div className="space-y-2">
                          {p.planoEvolucao.map((step, sIdx) => (
                            <div key={sIdx} className="flex items-center space-x-2">
                              <input 
                                type="text" 
                                value={step}
                                onChange={e => {
                                  const newPerfis = [...(editingDiag.perfis || [])];
                                  newPerfis[pIdx].planoEvolucao[sIdx] = e.target.value;
                                  setEditingDiag({...editingDiag, perfis: newPerfis});
                                }}
                                className="flex-1 p-2 bg-white border border-olive-100 rounded-lg text-xs"
                              />
                              <button 
                                onClick={() => {
                                  const newPerfis = [...(editingDiag.perfis || [])];
                                  newPerfis[pIdx].planoEvolucao = newPerfis[pIdx].planoEvolucao.filter((_, i) => i !== sIdx);
                                  setEditingDiag({...editingDiag, perfis: newPerfis});
                                }}
                                className="text-olive-300 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-olive-950">Modelos de Diagnóstico</h2>
          <p className="text-olive-500">Crie e gerencie diferentes tipos de diagnósticos para seus leads.</p>
        </div>
        <button 
          onClick={handleCreate}
          className="flex items-center px-6 py-3 bg-olive-900 text-white rounded-2xl hover:bg-black transition-all shadow-xl shadow-olive-900/20 font-bold"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Diagnóstico
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {diagnostics.map(diag => (
          <motion.div 
            key={diag.id}
            layoutId={diag.id}
            className="bg-white p-8 rounded-[2.5rem] border border-olive-100 shadow-sm hover:shadow-xl hover:shadow-olive-900/5 transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-olive-50 rounded-2xl text-olive-600 group-hover:bg-olive-900 group-hover:text-white transition-colors">
                <Layout className="w-6 h-6" />
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleEdit(diag)}
                  className="p-2 text-olive-400 hover:text-olive-900 transition-colors"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleDelete(diag.id)}
                  className="p-2 text-olive-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-olive-950">{diag.titulo}</h3>
                <p className="text-sm text-olive-500 line-clamp-2 mt-1">{diag.descricao}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-olive-50">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                  diag.isActive ? "bg-emerald-50 text-emerald-600" : "bg-olive-50 text-olive-400"
                )}>
                  {diag.isActive ? 'Ativo' : 'Inativo'}
                </span>
                <span className="text-[10px] font-bold text-olive-300 uppercase tracking-widest">
                  /{diag.slug}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
