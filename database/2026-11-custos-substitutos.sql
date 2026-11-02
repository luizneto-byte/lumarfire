-- Execute uma vez no Neon SQL Editor ANTES de publicar o código atualizado.
ALTER TABLE public.manutencoes ADD COLUMN IF NOT EXISTS custo_centavos integer;
ALTER TABLE public.manutencoes ADD COLUMN IF NOT EXISTS substituto_id uuid REFERENCES public.extintores(id) ON DELETE SET NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'manutencoes_custo_positivo') THEN
    ALTER TABLE public.manutencoes ADD CONSTRAINT manutencoes_custo_positivo CHECK (custo_centavos IS NULL OR custo_centavos >= 0);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS manutencoes_substituto_idx ON public.manutencoes (substituto_id);
