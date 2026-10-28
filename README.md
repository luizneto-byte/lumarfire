# Lumar Fire — etapa 1 (base, login, perfis, layout)

1. `npm install`
2. Copie `.env.example` para `.env.local` e preencha `DATABASE_URL` (Neon, com pooler) e `AUTH_SECRET`
3. `npm run db:push` cria as tabelas no Neon
4. `npm run dev` e abra http://localhost:3000/cadastro

Multi-tenant: toda tabela de negócio leva `empresa_id`. A sessão (cookie JWT) guarda `empresaId` e `perfil`.
Próximo: RLS no Postgres e as tabelas de clientes, locais e extintores (etapa 2).

## Etapa 2
Novas tabelas: clientes, locais, extintores. Rode `npm run db:push` de novo.
Telas: /painel/clientes e /painel/extintores. Toda consulta filtra por `empresa_id` da sessão.
Dashboard: os cards agora contam os extintores reais (em dia, a vencer em 30 dias, vencidos).

## Etapa 3
Novas tabelas: mangueiras e inspecoes. Rode `npm run db:push` de novo.
- Editar: clientes, locais, extintores e mangueiras (administrador e inspetor).
- Excluir: só administrador, com confirmação. Excluir cliente apaga locais, equipamentos e inspeções dele.
- Mangueiras: tipo (NBR 11861), diâmetro, comprimento, validade do teste hidrostático.
- Inspeções: conforme/não conforme; não conforme exige observação. Dashboard conta "não conformes" pela inspeção mais recente de cada equipamento.
Próximo (etapa 4): plantas, QR Codes/etiquetas e inspeção pelo celular; depois RLS no Postgres e relatórios.

## Etapa 4
Novas colunas e tabela: `plantas`, e `planta_x`/`planta_y` em extintores e mangueiras. Rode `npm run db:push` de novo.
Nova variável no `.env.local`: `APP_URL` (endereço público do sistema, usado dentro do QR Code). Em produção use o domínio real; se ficar vazia, vale o endereço da requisição.
- **QR Codes e etiquetas** (`/painel/qrcodes`): uma etiqueta por extintor e mangueira, com filtro por local e botão de imprimir.
- **Inspeção pelo celular** (`/painel/inspecionar/extintor|mangueira/[id]`): destino do QR. Quem lê sem estar logado entra e volta para o equipamento. Botões grandes; não conforme exige observação.
- **Plantas** (`/painel/plantas`): envio de PNG/JPG/WEBP de até 2 MB por local (guardada no próprio banco), marcação dos equipamentos com um toque e pinos coloridos pela situação (em dia, a vencer, vencido ou não conforme). Só administrador remove a planta.
- Menu no celular recolhido em "Menu"; no computador continua lateral.
- Next atualizado para 14.2.35 (correção de vulnerabilidade da série 14.2).
Próximo: RLS no Postgres e relatórios.

## Etapa 5
Sem tabelas novas, não precisa de `db:push`.
- **Relatórios** (`/painel/relatorios`): três visões, com filtro por cliente.
  - *Situação dos equipamentos*: todos os extintores e mangueiras, com vencimento, última inspeção e situação.
  - *Pendências*: só o que está vencido, a vencer em 30 dias ou não conforme, do vencimento mais próximo ao mais distante.
  - *Inspeções no período*: filtro por data (até 2.000 registros).
- **Imprimir / salvar em PDF**: o botão abre a impressão do navegador com cabeçalho (empresa, cliente, data); no diálogo, escolha "Salvar como PDF".
- **Planilha (CSV)**: abre direto no Excel brasileiro (separador ponto e vírgula, acentos corretos). Células que começam com `=`, `+`, `-` ou `@` recebem um apóstrofo para não virarem fórmula.
- Todos os perfis, inclusive cliente, veem os relatórios. Toda consulta filtra por `empresa_id` da sessão.
Próximo: RLS no Postgres, usuários e permissões, configurações.

## Etapa 6
Sem tabelas novas, não precisa de `db:push`.
- **Usuários e permissões** (`/painel/usuarios`, só administrador): criar usuário com senha provisória, mudar perfil, redefinir senha, desativar/reativar. Não dá para mudar o próprio perfil nem desativar a própria conta (evita ficar sem administrador).
- **Configurações** (`/painel/configuracoes`, só administrador): nome e CNPJ da empresa (o nome aparece nos relatórios impressos).
- **Minha conta** (`/painel/conta`, todos): trocar nome e senha (pede a senha atual).
- **Sessão agora confere o banco**: perfil, empresa, nome e "ativo" vêm sempre do banco, não do cookie. Desativar um usuário ou mudar o perfil dele vale na hora; o usuário desativado cai no login (`/api/encerrar`). Custa uma consulta por requisição.
- Limite conhecido: redefinir ou trocar senha não derruba sessões já abertas em outros aparelhos (só desativar o usuário derruba).
Próximo: RLS no Postgres.

## Preparação RLS (ainda não ativada)
Veja `database/README-RLS.md` e `database/rls.sql`. **Não rode o SQL no banco de produção ainda**: falta adaptar o acesso ao banco e o fluxo de autenticação. O ZIP não deve ser apresentado como isolamento RLS concluído.
