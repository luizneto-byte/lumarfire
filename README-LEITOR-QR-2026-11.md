# Leitor de QR Code na inspeção móvel

## Alterações
- Tela `/painel/mobile`: botão **Ler QR Code** dentro da seção Equipamento.
- Abre câmera dentro da própria inspeção, sem navegar para outra página.
- Reconhece etiquetas com URL `https://lumarfire.vercel.app/painel/inspecionar/extintor/UUID` ou `/mangueira/UUID`, inclusive quando o QR é apontado offline (desde que dados tenham sido baixados).
- Busca equipamento no catálogo baixado da empresa, troca automaticamente o local e seleciona o equipamento na lista.
- Não seleciona caso haja ambiguidade, link de outro domínio ou item ausente no catálogo.
- Fecha e libera a câmera ao sair. Campo para colar código como alternativa.

## Teste
1. Publique o código no Vercel e abra `/painel/mobile` em HTTPS, com Chrome no Android.
2. Faça login e toque em **Baixar plantas e equipamentos** para atualizar o catálogo.
3. Toque em **Ler QR Code**, aceite a permissão da câmera e leia uma etiqueta de extintor ou mangueira existente.
4. Confira se o local e equipamento mudaram automaticamente; salve a inspeção offline.
5. Teste em modo avião depois de baixar os dados. Use o botão de volta/fechar para confirmar que a câmera é liberada.

## Limitações
- Scanner utiliza `BarcodeDetector` nativo; o suporte varia por navegador e WebView/APK. Em aparelhos sem suporte aparece erro e alternativa para colar o código. Uma implementação Android nativa ou uma biblioteca decodificadora embarcada pode ser necessária para cobertura universal.
- Este ZIP altera o código WEB. O APK binário em `public/downloads/` **não foi reconstruído**. Se o APK existente for TWA que carrega `/painel/mobile` do site, o recurso poderá chegar via deploy; se for WebView com conteúdo empacotado, precisa recompilar.
- O projeto não contém a chave de assinatura nem fontes Android necessárias para produzir atualização compatível com instalações existentes.
- Não foi possível executar build completo neste ambiente: dependências npm não estão instaladas de forma completa.
