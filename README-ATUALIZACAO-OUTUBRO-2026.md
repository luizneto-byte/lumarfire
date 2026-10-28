# Lumar Fire – melhorias de outubro de 2026

## Alterações
- Plantas: zoom de 50% a 500% com botões e Ctrl + rolagem, viewport rolável e pinos vinculados às coordenadas da planta.
- Manutenções: nova aba, ordens para extintores e mangueiras, prazos, fornecedores, responsáveis, observações e status. Link direto a partir de cada cadastro.
- Dashboard: quatro gráficos circulares de validade, tipos, conformidade da última inspeção e manutenções.
- Etiquetas: número de série do extintor embaixo do QR Code, quando cadastrado (ou "Não informado").

## Implantação (IMPORTANTE)
1. Faça backup do banco Neon.
2. No Neon SQL Editor, execute `database/2026-10-manutencoes.sql` uma vez. Sem isso, Dashboard e Manutenções não funcionarão.
3. Faça commit/push dos arquivos atualizados e redeploy no Vercel; preserve as variáveis de ambiente.
4. Teste abertura de uma manutenção, alteração de status, QR Code e zoom.

## Limitações
- A abertura/conclusão de manutenção não modifica automaticamente as datas de validade ou recarga do cadastro. Atualize os dados do equipamento quando fizer a manutenção.
- QR identifica equipamento via URL; série é mostrada no texto impresso da etiqueta.
- O SQL inclui observação de RLS; não habilite políticas do arquivo `database/rls.sql` sem a migração transacional documentada no projeto.
- Não foi possível executar o build neste ambiente porque as dependências npm não ficaram completamente instaladas.
