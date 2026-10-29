-- Executar uma vez no Neon SQL Editor ANTES de publicar esta versão.
CREATE TABLE IF NOT EXISTS public.manutencoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  extintor_id uuid REFERENCES public.extintores(id) ON DELETE CASCADE,
  mangueira_id uuid REFERENCES public.mangueiras(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  descricao text,
  responsavel text,
  fornecedor text,
  previsao date,
  conclusao date,
  criado_em timestamp NOT NULL DEFAULT now(),
  atualizado_em timestamp NOT NULL DEFAULT now(),
  CONSTRAINT manutencao_equipamento_exclusivo CHECK ((extintor_id IS NOT NULL) <> (mangueira_id IS NOT NULL)),
  CONSTRAINT manutencao_status_valido CHECK (status IN ('pendente','andamento','concluida','cancelada'))
);
CREATE INDEX IF NOT EXISTS manutencoes_empresa_status_idx ON public.manutencoes (empresa_id, status);
CREATE INDEX IF NOT EXISTS manutencoes_extintor_idx ON public.manutencoes (extintor_id);
CREATE INDEX IF NOT EXISTS manutencoes_mangueira_idx ON public.manutencoes (mangueira_id);
-- Apenas se a aplicação já utiliza RLS com app.empresa_id definido por transação:
-- ALTER TABLE public.manutencoes ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY isolamento_empresa ON public.manutencoes FOR ALL
--   USING (empresa_id = app.empresa_atual()) WITH CHECK (empresa_id = app.empresa_atual());
