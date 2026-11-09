# Lumar Fire — QR Code já impresso, Android, iPhone e offline

## Alterações entregues
- `public/.well-known/assetlinks.json` gerado para o APK incluído, baseado no pacote lido do `AndroidManifest.xml` (`app.vercel.lumarfire.twa`) e na assinatura verificada com `keytool` (SHA-256: `01:B2:A2:97:EE:2A:6C:A4:3E:FF:24:F8:5F:45:08:07:CA:07:69:49:11:77:9C:09:2C:36:D8:25:EA:74:96:87`).
- Service Worker v3: ao abrir **sem rede** um URL de etiqueta `/painel/inspecionar/extintor/UUID` ou `/painel/inspecionar/mangueira/UUID`, redireciona para `/painel/mobile?qr=...`, se a tela offline já estiver em cache.
- Módulo móvel: lê o identificador do parâmetro `qr`, procura no catálogo local e pré-seleciona o equipamento.
- Manifest do módulo: scope ampliado para `/painel/` (não significa abertura automática de QR da câmera no iPhone).
- Etiquetas e links originais não foram modificados. Não altera CSS, telas de cadastro, banco ou regras de inspeção.

## Limites importantes
1. **Android**: `assetlinks.json` ajuda a verificar a associação do domínio com o APK, mas o aplicativo precisa conter `intent-filter` HTTPS de `VIEW/BROWSABLE`, e o Android precisa validar a associação. Se o APK original não tiver esse filtro para as rotas das etiquetas, **será necessário recompilá-lo a partir do projeto Android/PWABuilder**. O APK enviado NÃO foi recompilado.
2. **iPhone**: um PWA instalado pela tela inicial **não recebe automaticamente** URLs externas abertas pela câmera do iOS. Isso é uma limitação da plataforma. Sem app nativo, deve-se entrar no Lumar Fire pela tela inicial e usar o leitor dentro do app, ou selecionar o equipamento offline. Nenhum código de site pode prometer integração de câmera do iOS equivalente a Universal Links de apps nativos.
3. **Offline**: só funciona após abrir `/painel/mobile` com internet, baixar os equipamentos, aguardar o service worker concluir o cache e testar. QR iniciado pela câmera do celular, sem rede, pode falhar **antes** de o navegador ou o APK receber o URL; depende do sistema operacional.
4. O leitor interno ainda depende da API BarcodeDetector. Caso não seja suportada no WebView/navegador, será necessária uma biblioteca de leitura local (não adicionada porque a instalação de dependências não está disponível neste ambiente). O campo manual permanece.

## Teste após deploy
1. Na Vercel, confirmar `https://lumarfire.vercel.app/.well-known/assetlinks.json` devolve JSON diretamente (HTTP 200, sem redirect).
2. Em Android, abrir **Configurações > Apps > Lumar Fire > Abrir por padrão / Links suportados**, verificar se domínio está habilitado. Se ausente, gerar novo APK com os intent filters.
3. Online, acessar `/painel/mobile`, clicar em **Baixar plantas e equipamentos**, fechar e reabrir, validar tela offline.
4. Em modo avião, com a tela offline já cacheada, testar **Ler QR Code** dentro do aplicativo ou colar o URL do QR no campo manual.
5. Reabrir com rede e sincronizar a fila de inspeções.

## Aviso de segurança
Não envie chave `.keystore` ou segredos ao GitHub. O certificado SHA-256 público é seguro para publicar em `assetlinks.json`.
