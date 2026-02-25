import React, { useState } from 'react';
import { Lock, User, Loader2, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('admin_token', data.token);
        onLogin();
      } else {
        setError(data.error || 'Erro ao fazer login');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 sm:p-12 rounded-[3rem] shadow-2xl shadow-olive-900/10 border border-olive-100"
      >
        <div className="text-center space-y-4 mb-10">
          <div className="w-16 h-16 bg-olive-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-olive-600/20">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-olive-950 tracking-tight">Acesso Restrito</h2>
          <p className="text-olive-400 text-sm font-medium uppercase tracking-widest">Dashboard Administrativo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-olive-400 uppercase tracking-[0.2em] ml-1">Usuário</label>
            <div className="relative group">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-olive-300 group-focus-within:text-olive-600 transition-colors" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Seu usuário"
                className="w-full pl-14 pr-6 py-4 bg-olive-50/50 border-2 border-transparent focus:border-olive-600 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-olive-400 uppercase tracking-[0.2em] ml-1">Senha</label>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-olive-300 group-focus-within:text-olive-600 transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-14 pr-6 py-4 bg-olive-50/50 border-2 border-transparent focus:border-olive-600 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                required
              />
            </div>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs text-red-500 font-bold text-center bg-red-50 py-3 rounded-xl border border-red-100"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-olive-950 text-white font-bold text-lg rounded-2xl hover:bg-black transition-all flex items-center justify-center disabled:opacity-70 shadow-xl active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                Entrar no Dashboard
                <ChevronRight className="ml-2 w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
