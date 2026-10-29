# Atualização: download do APK na tela de login

- Em `/login`, aparece o QR Code e botão de download para Android.
- Arquivo APK incluído em `public/downloads/lumar-fire-inspecoes.apk` (fornecido pelo usuário).
- A URL embutida no QR é `https://lumarfire.vercel.app/downloads/lumar-fire-inspecoes.apk`.
- Usa a dependência `qrcode` que já existia no projeto; não é necessário instalar `qrcode.react`.
- Ao publicar no Vercel, confirme o download em `/downloads/lumar-fire-inspecoes.apk` e faça a leitura do QR com um Android.
- Se trocar o domínio, atualize `URL_APK` em `src/components/DownloadAppAndroid.tsx`.
- Não inclua `android.keystore` no repositório. Este ZIP contém só o instalador APK enviado, não a chave de assinatura.

Commit recomendado: `feat(login): adicionar QR Code e download do APK Android`
