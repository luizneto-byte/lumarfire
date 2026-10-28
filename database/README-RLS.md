# RLS — preparação, NÃO pronta para ativar

`rls.sql` contém políticas de isolamento por empresa para as 8 tabelas.
**Não execute ainda**: a aplicação utiliza `drizzle-orm/neon-http`, com 81 operações `db.*` sem contexto transacional. Ativar as políticas agora bloquearia o login e as operações.

## Integração necessária antes de produção
1. Criar papel PostgreSQL de aplicação sem `BYPASSRLS` e sem propriedade das tabelas.
2. Trocar acesso `neon-http` por driver que suporte transações com conexão fixa (ex.: Neon WebSocket/pg ou postgres.js, conforme ambiente).
3. Em cada transação autenticada, definir `SET LOCAL app.empresa_id` a partir da sessão validada no servidor, nunca de input do navegador. Definir `app.usuario_id` também. Executar todas as consultas dessa requisição na MESMA transação.
4. Login/cadastro exigem um fluxo separado e restrito (funções SECURITY DEFINER auditadas ou papel de autenticação com permissões mínimas), pois ainda não existe contexto da empresa no login.
5. Validar referências cruzadas entre empresas (local/cliente, equipamento/local, inspeção/equipamento e inspetor) com triggers ou FKs compostas.
6. Testar acesso A/B com dois tenants, escrita e leitura, autenticação, relatórios, QR, imagens e ações administrativas. Somente depois aplicar RLS no Neon real.

**Nunca configure a URL do proprietário das tabelas como credencial de execução do app.**
