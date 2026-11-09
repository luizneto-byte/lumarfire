# QR Code Lumar Fire — iPhone e Android

## Alterações
- Leitor interno do aplicativo agora usa BarcodeDetector quando disponível, com fallback `jsqr@1.4.0` empacotado no bundle. Não depende de serviços de leitura externos.
- O mesmo QR Code com URL `/painel/inspecionar/extintor/{id}` ou `/painel/inspecionar/mangueira/{id}` é reconhecido pelo módulo de inspeção e seleciona o equipamento baixado no IndexedDB.
- Preservadas etiquetas, rotas, visual e regras de inspeção.
- Cache do módulo incrementado para atualização dos assets.

## Publicação
1. Envie projeto completo ao GitHub e faça build na Vercel (`npm ci` com o package-lock atualizado).
2. Abra o aplicativo com internet após o deploy. Aguarde o carregamento da página de inspeção e baixe plantas e equipamentos.
3. No iPhone, **abra pelo ícone Lumar Fire da tela inicial**, toque Ler QR Code e permita a câmera. Leia a etiqueta e confirme que o equipamento correto foi selecionado.
4. Repita em modo avião, após uma primeira utilização online com os arquivos já armazenados.
5. Refaça o teste no Android APK. Se o APK for uma TWA que carrega o site, poderá receber o JS novo ao conectar; o reconhecimento de QR por câmera externa continua dependendo de Android App Links na versão instalada e verificação do domínio.

**Limitações:** a câmera nativa do iPhone não pode ser forçada a abrir automaticamente um PWA por QR Code. Utilize o leitor interno; para deep link automático seria necessário app nativo e universal links próprios. Não houve teste em dispositivo físico.
