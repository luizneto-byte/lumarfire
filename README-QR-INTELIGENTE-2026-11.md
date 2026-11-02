# QR Codes, Android e manutenção

## Corrigir link antigo
Em Vercel > Settings > Environment Variables, defina `APP_URL=https://lumarfire.vercel.app` (ou o domínio oficial vigente), em Production e faça redeploy. Reimprima as etiquetas antigas: um QR já impresso não tem o conteúdo atualizado automaticamente.

## Custo e extintor substituto
Execute `database/2026-11-custos-substitutos.sql` no Neon antes do deploy. O formulário de manutenção permite custo e seleção de extintor reserva, mantendo o vínculo na ordem de manutenção. A posição física e na planta não são alteradas automaticamente: trocar o localId de um extintor prejudicaria seu histórico de localização e a posição na planta.

## QR abre app Android ou navegador
As etiquetas contêm URL HTTPS canônica. Para o APK instalado abrir automaticamente os links de inspeção, o projeto Android que gera o APK deve registrar um intent filter para `https://lumarfire.vercel.app/painel/inspecionar/*` com `android:autoVerify="true"` e publicar `/.well-known/assetlinks.json` com `package_name` e SHA-256 da chave que assina o APK. O Android resolve o link no aplicativo quando associação e preferências permitem; caso contrário, abre no navegador padrão (Chrome se escolhido como padrão). **O ZIP contém só o APK compilado, não o projeto Android, package name nem chave SHA-256**. Logo, a integração automática no aplicativo instalado NÃO fica habilitada apenas com estas mudanças de site. Não invente fingerprint ou package name.

Ao configurar o Android App Link, a activity receptora precisa extrair a URL e navegar até a tela de inspeção correspondente no WebView ou aplicativo nativo, preservando o login. O QR de baixar o APK na tela de login é independente dos QR Codes dos equipamentos.
