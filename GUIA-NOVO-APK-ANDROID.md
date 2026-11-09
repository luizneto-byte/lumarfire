# Lumar Fire — preparação da nova versão Android (novembro/2026)

## Situação do pacote
Este ZIP é o código web/PWA preparado para publicação, **não é um APK novo**. O arquivo `public/downloads/lumar-fire-inspecoes.apk` é o **APK anterior**, mantido apenas para não quebrar o download existente. **Não distribuí-lo como se fosse a nova versão**.

Ajuste desta preparação: escopo do manifesto `/inspecao-manifest.webmanifest` passou de `/painel/mobile` para `/`, para incluir URLs existentes `/painel/inspecionar/{tipo}/{uuid}` sob o escopo web do aplicativo. Preservados layout, URLs das etiquetas e lógica de inspeção/sincronização do pacote anterior.

## Compilar nova versão por PWABuilder
1. Publicar este projeto no GitHub e aguardar deploy Ready na Vercel. Verificar `https://lumarfire.vercel.app/inspecao-manifest.webmanifest`, `https://lumarfire.vercel.app/.well-known/assetlinks.json` e `/painel/mobile`.
2. Acessar https://www.pwabuilder.com/ e usar a URL `https://lumarfire.vercel.app/painel/mobile` (manifest: `/inspecao-manifest.webmanifest`). Selecionar pacote Android.
3. **Atualização do app antigo:** definir package ID **`app.vercel.lumarfire.twa`** e **versão code maior que o APK anterior**. Confirmar package ID com a ferramenta de inspeção do APK/PWABuilder antes da distribuição.
4. Em assinatura, escolher **Use mine / Existing key**, informando o arquivo de chave privado original (`signing.keystore` ou `.jks`) e seus dados (alias e senhas). **Não envie a chave nem as senhas ao GitHub ou a chats.**
5. Configurar Deep Links/App Links para `https://lumarfire.vercel.app/painel/inspecionar/*` no projeto Android gerado e habilitar verificação de domínio. Verificar o `AndroidManifest.xml` do pacote exportado: action `VIEW`, `BROWSABLE`, `DEFAULT`, `https`, host `lumarfire.vercel.app`, `autoVerify=true`. O arquivo assetlinks sozinho não cria intent filter. Configure também a Activity de destino para abrir a URL recebida.
6. Gerar APK assinado, instalar **por cima** em um aparelho de teste, sem remover o antigo. Só depois substituir `public/downloads/lumar-fire-inspecoes.apk` pelo novo APK e publicar novamente.
7. Testar leitor interno e links pela câmera externa; testar inspeção com modo avião, reabertura do app sem rede e sincronização após voltar à internet.

## Dados do APK antigo já inspecionados
- SHA-256 do certificado: `01:B2:A2:97:EE:2A:6C:A4:3E:FF:24:F8:5F:45:08:07:CA:07:69:49:11:77:9C:09:2C:36:D8:25:EA:74:96:87`.
- `public/.well-known/assetlinks.json` corresponde a esse certificado.
- O APK compilado não é a chave privada de assinatura. Sem chave original, o Android normalmente **não aceitará atualização por cima** do app antigo; preserve/sincronize os dados antes de qualquer migração.

## Limites importantes
- A TWA/PWA depende de o conteúdo offline estar previamente em cache; a instalação do APK por si só **não garante** uso 100% offline.
- No iOS, links escaneados pela câmera podem continuar abrindo Safari em vez do PWA instalado; use o leitor dentro do Lumar Fire.
- A sincronização automática depende de o app estar aberto/retornar à atividade, não funciona garantidamente com o app totalmente encerrado.
- A configuração final de App Links e assinatura precisa ser validada no APK **novo**, que não foi compilado neste pacote.
