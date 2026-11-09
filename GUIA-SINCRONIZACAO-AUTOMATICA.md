# Lumar Fire — envio automático de inspeções

- Com internet: ao salvar uma inspeção, ela é persistida no IndexedDB e enviada imediatamente ao servidor; só sai da fila quando o servidor confirma.
- Sem internet: a inspeção é persistida localmente com UUID único; permanece pendente.
- Ao recuperar internet, abrir ou voltar ao app: a fila é enviada automaticamente em lotes de até 100 registros. Enquanto o aplicativo estiver aberto, há tentativas a cada 30 segundos.
- Em falha de rede, sessão expirada ou rejeição: o registro não confirmado permanece salvo; aparece mensagem de erro.
- O botão de envio manual permanece como opção de recuperação.
- Não altera URLs, etiquetas QR Code, banco ou layout geral.

**Limitação do iOS/Android:** o navegador/PWA suspenso ou totalmente fechado não executa JavaScript de forma confiável. O envio automático ocorre quando o app está aberto ou volta a ficar ativo, com conexão e sessão válidas.

**Teste recomendado:** baixar catálogo, registrar uma inspeção em modo avião, fechar e reabrir, verificar pendências e em seguida reativar internet com o app aberto; conferir que a fila zera e o registro aparece no painel. Repetir em iPhone e Android. Não apagar dados do aplicativo antes de sincronizar.
