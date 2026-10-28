# Lumar Fire — Inspeção offline (módulo móvel)

## O que foi implementado
- Tela de campo `/painel/mobile` (sem menus administrativos próprios)
- Download autenticado de locais, extintores, mangueiras e imagens de plantas da mesma empresa
- Armazenamento local persistente por IndexedDB
- Inspeção conforme/não conforme e fila offline
- Sincronização autenticada, multiempresa e idempotente (não duplica após reenvio)
- Marcadores nas plantas, pesquisa e seleção de equipamento
- Service worker para reabrir a tela quando offline (após carregá-la online)

## Antes do deploy
1. Execute no Neon o arquivo `database/2026-10-inspecoes-offline.sql`.
2. Publique o projeto no Vercel e faça login no celular.
3. Abra `/painel/mobile` **com internet** e clique **Baixar plantas e equipamentos**.
4. Teste em modo avião: inspeções devem ser guardadas e, após a conexão voltar, enviadas.
5. Use HTTPS; o navegador precisa permitir IndexedDB/Service Worker. Não limpe os dados do navegador antes de sincronizar.

## Observações de segurança e operação
- O banco é acessado apenas pelas rotas do servidor; nunca inclua `DATABASE_URL` ou `AUTH_SECRET` no aplicativo.
- Os dados locais (incluindo plantas e inspeções pendentes) não são criptografados pelo próprio módulo. Adote bloqueio de tela e política de aparelho.
- Login e download inicial exigem internet. Sessão expirada exige novo login antes de sincronizar.
- Sincronização é manual, com confirmação do servidor. Não há promessa de envio automático quando fechado.
- Não oferece leitura pela câmera de QR Code, fotos ou checklist detalhado nesta primeira versão.
- Se houver falha no salvamento, a mensagem aparece explicitamente; não desinstale antes de sincronizar.
- A disponibilidade offline depende da instalação e permanência do cache; valide em aparelho real.

## Gerar APK no GitHub Codespaces
Esta é a base web offline do aplicativo, não um APK compilado.
Para um APK real, após testar e publicar o site, pode-se empacotar como Trusted Web Activity usando Bubblewrap. Requer Android SDK, Java, Node.js, site HTTPS com manifesto web válido, vínculo Digital Asset Links, e chave de assinatura Android. Estas etapas de empacotamento e assinatura **não estão implementadas neste ZIP**. Alternativa imediata: instalar como PWA no navegador Android, usando o manifesto e o ícone incluídos.

## Bubblewrap no Codespaces (depois de publicar no Vercel)
```bash
npm install -g @bubblewrap/cli
mkdir -p ~/lumar-inspecao-android && cd ~/lumar-inspecao-android
bubblewrap init --manifest https://SEU-DOMINIO.vercel.app/inspecao-manifest.webmanifest
bubblewrap build
```
O assistente instala/configura Android SDK e JDK na primeira execução; configure package ID como `br.com.lumarfire.inspecao`, crie chave de assinatura, **guarde o arquivo .jks e suas senhas fora do repositório**. O APK assinado será `app-release-signed.apk`. Configure o arquivo `/.well-known/assetlinks.json` com SHA-256 do certificado e package ID para tela cheia sem barra de navegador. Teste offline em dispositivo físico.
