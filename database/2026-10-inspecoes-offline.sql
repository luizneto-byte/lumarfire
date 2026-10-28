-- Execute no SQL Editor do Neon ANTES de habilitar a sincronização do aplicativo.
-- Não apaga inspeções existentes.
ALTER TABLE public.inspecoes ADD COLUMN IF NOT EXISTS offline_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS inspecoes_offline_id_unique ON public.inspecoes (offline_id);
