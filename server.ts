import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
  } else {
    // Serve static files in production
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
