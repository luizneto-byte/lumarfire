-- Execute uma vez no Neon SQL Editor ANTES de publicar esta versão.
-- Não apaga nada: apenas adiciona as colunas novas.
ALTER TABLE public.manutencoes ADD COLUMN IF NOT EXISTS data_inicio date;
ALTER TABLE public.manutencoes ADD COLUMN IF NOT EXISTS custo numeric(12,2);
