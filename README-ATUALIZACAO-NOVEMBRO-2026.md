# Atualização

1. No Neon SQL Editor, execute `database/2026-10-manutencoes-inicio-custo.sql` (adiciona data de início e custo; não apaga dados).
2. Faça commit/push e redeploy.
3. No Vercel, atualize ou apague `APP_URL` (o QR agora usa o endereço do site aberto). Depois reimprima as etiquetas com o domínio antigo: o QR já impresso continua apontando para o antigo.

## O que mudou
- Manutenções: campos Data de início e Custo (R$), total de custos e botão Excluir (administrador).
- QR Codes: passam a usar o domínio atual do site.
- Login: removido "Criar conta"; /cadastro redireciona ao login e o cadastro fica bloqueado. Crie cada cliente manualmente.
- App de inspeção (celular): botões Apagar (uma) e Apagar tudo na fila de envio.
