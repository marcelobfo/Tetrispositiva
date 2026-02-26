-- Tabela de Diagnósticos (Modelos)
CREATE TABLE IF NOT EXISTS diagnosticos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    descricao TEXT,
    slug TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Perguntas
CREATE TABLE IF NOT EXISTS perguntas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diagnostico_id UUID REFERENCES diagnosticos(id) ON DELETE CASCADE,
    texto TEXT NOT NULL,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Opções de Resposta
CREATE TABLE IF NOT EXISTS opcoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pergunta_id UUID REFERENCES perguntas(id) ON DELETE CASCADE,
    texto TEXT NOT NULL,
    pontos INTEGER NOT NULL,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Perfis de Resultado
CREATE TABLE IF NOT EXISTS perfis_resultado (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diagnostico_id UUID REFERENCES diagnosticos(id) ON DELETE CASCADE,
    perfil TEXT NOT NULL,
    pontuacao_min INTEGER NOT NULL,
    pontuacao_max INTEGER NOT NULL,
    nivel INTEGER NOT NULL,
    descricao TEXT,
    risco_principal TEXT,
    solucao_recomendada TEXT,
    sinais JSONB DEFAULT '[]',
    plano_evolucao JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Atualizar a tabela de leads para suportar múltiplos diagnósticos
ALTER TABLE leads_diagnostico ADD COLUMN IF NOT EXISTS diagnostico_id UUID REFERENCES diagnosticos(id);
