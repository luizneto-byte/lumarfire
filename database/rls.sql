-- Lumar Fire: preparação das políticas RLS (PostgreSQL / Neon)
-- IMPORTANTE: não executar em produção antes de migrar o runtime para
-- transações com SET LOCAL app.empresa_id e credenciais sem BYPASSRLS.
-- O Neon HTTP usado atualmente não mantém SET LOCAL entre requisições.
BEGIN;
CREATE SCHEMA IF NOT EXISTS app;
CREATE OR REPLACE FUNCTION app.empresa_atual() RETURNS uuid
LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('app.empresa_id', true), '')::uuid $$;
CREATE OR REPLACE FUNCTION app.usuario_atual() RETURNS uuid
LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('app.usuario_id', true), '')::uuid $$;
DO $$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['empresas','usuarios','clientes','locais','extintores','mangueiras','inspecoes','plantas','manutencoes'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('DROP POLICY IF EXISTS isolamento_empresa ON public.%I',t);
  IF t='empresas' THEN
   EXECUTE format('CREATE POLICY isolamento_empresa ON public.%I FOR ALL USING (id = app.empresa_atual()) WITH CHECK (id = app.empresa_atual())',t);
  ELSE
   EXECUTE format('CREATE POLICY isolamento_empresa ON public.%I FOR ALL USING (empresa_id = app.empresa_atual()) WITH CHECK (empresa_id = app.empresa_atual())',t);
  END IF;
 END LOOP;
END $$;
COMMIT;
