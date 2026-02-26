import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Supabase client with service_role key (server-side only)
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // API routes
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD;

    if (!adminPass) {
      return res.status(500).json({ error: "Admin password not configured in environment" });
    }

    if (username === adminUser && password === adminPass) {
      res.json({ success: true, token: "mock-session-token" });
    } else {
      res.status(401).json({ error: "Credenciais inválidas" });
    }
  });

  app.get("/api/leads", async (req, res) => {
    try {
      if (!supabaseUrl || !supabaseServiceKey) {
        return res.status(500).json({ error: "Server configuration error" });
      }

      const { data, error } = await supabase
        .from('leads_diagnostico')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Supabase fetch error:", error);
        return res.status(500).json({ error: error.message });
      }

      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Diagnostics API
  app.get("/api/diagnosticos", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('diagnosticos')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/diagnosticos/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const { data: diagnostico, error: diagError } = await supabase
        .from('diagnosticos')
        .select(`
          *,
          perguntas (
            *,
            opcoes (*)
          ),
          perfis_resultado (*)
        `)
        .eq('slug', slug)
        .single();

      if (diagError) throw diagError;
      res.json(diagnostico);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/diagnosticos", async (req, res) => {
    try {
      const { id, titulo, descricao, slug, isActive, perguntas, perfis } = req.body;
      
      // 1. Save/Update Diagnostic
      const { data: diag, error: diagError } = await supabase
        .from('diagnosticos')
        .upsert({ id, titulo, descricao, slug, is_active: isActive })
        .select()
        .single();
      
      if (diagError) throw diagError;

      // 2. Handle Perguntas and Opcoes (Delete existing and re-insert for simplicity in this demo)
      // In a real app, you'd do more granular updates
      await supabase.from('perguntas').delete().eq('diagnostico_id', diag.id);
      
      for (const p of perguntas) {
        const { data: pergunta, error: pError } = await supabase
          .from('perguntas')
          .insert({ diagnostico_id: diag.id, texto: p.pergunta, ordem: 0 })
          .select()
          .single();
        
        if (pError) throw pError;

        const opcoesToInsert = p.opcoes.map((o: any, idx: number) => ({
          pergunta_id: pergunta.id,
          texto: o.texto,
          pontos: o.pontos,
          ordem: idx
        }));

        const { error: oError } = await supabase.from('opcoes').insert(opcoesToInsert);
        if (oError) throw oError;
      }

      // 3. Handle Perfis
      await supabase.from('perfis_resultado').delete().eq('diagnostico_id', diag.id);
      const perfisToInsert = perfis.map((p: any) => ({
        diagnostico_id: diag.id,
        perfil: p.perfil,
        pontuacao_min: p.pontuacaoMin,
        pontuacao_max: p.pontuacaoMax,
        nivel: p.nivel,
        descricao: p.descricao,
        risco_principal: p.riscoPrincipal,
        solucao_recomendada: p.solucaoRecomendada,
        sinais: p.sinais,
        plano_evolucao: p.planoEvolucao
      }));
      const { error: perfError } = await supabase.from('perfis_resultado').insert(perfisToInsert);
      if (perfError) throw perfError;

      res.json({ success: true, data: diag });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/diagnosticos/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabase.from('diagnosticos').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/leads", async (req, res) => {
    try {
      const payload = req.body;
      console.log("Receiving lead data:", JSON.stringify(payload, null, 2));

      if (!supabaseUrl || !supabaseServiceKey) {
        console.error("CRITICAL: Supabase credentials missing in environment variables!");
        return res.status(500).json({ error: "Server configuration error: Missing Supabase credentials" });
      }

      // Ensure respostas is a string if the DB expects text, or keep as array if jsonb
      // Most users forget to set jsonb, so let's log the attempt clearly
      console.log("Attempting to insert into 'leads_diagnostico'...");
      
      const { data, error } = await supabase
        .from('leads_diagnostico')
        .insert([payload])
        .select();

      if (error) {
        console.error("Supabase Insertion Error:", error);
        return res.status(500).json({ 
          error: error.message, 
          details: error.details,
          hint: error.hint,
          code: error.code
        });
      }

      console.log("Success! Lead saved:", data);
      res.json({ success: true, data });
    } catch (err: any) {
      console.error("Unexpected error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    // Fallback for SPA routing in development if vite doesn't catch it
    app.get("*", async (req, res, next) => {
      if (req.url.startsWith('/api')) return next();
      try {
        const template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
        const html = await vite.transformIndexHtml(req.url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // Serve static files in production
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("index.html", { root: "dist" });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
