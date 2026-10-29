import QRCode from "qrcode";

const URL_APK = "https://lumarfire.vercel.app/downloads/lumar-fire-inspecoes.apk";

export default async function DownloadAppAndroid() {
  const imagemQr = await QRCode.toDataURL(URL_APK, { width: 192, margin: 1, errorCorrectionLevel: "M" });

  return (
    <section aria-labelledby="baixar-app-titulo" className="mt-7 rounded-2xl border border-zinc-200 bg-white p-5 text-center shadow-sm">
      <h2 id="baixar-app-titulo" className="text-base font-bold text-grafite">Lumar Fire Inspeções para Android</h2>
      <p className="mt-2 text-sm text-zinc-600">Escaneie o QR Code com o Android para baixar o aplicativo de inspeções.</p>
      <a href={URL_APK} download="lumar-fire-inspecoes.apk" aria-label="Baixar aplicativo Lumar Fire Inspeções para Android" className="mx-auto mt-4 block w-fit rounded-xl border border-zinc-200 bg-white p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imagemQr} width={192} height={192} alt="QR Code para baixar o APK Lumar Fire Inspeções" />
      </a>
      <a href={URL_APK} download="lumar-fire-inspecoes.apk" className="mt-4 block rounded-lg bg-red-700 px-4 py-3 text-sm font-semibold text-white hover:bg-red-800">Baixar APK para Android</a>
      <p className="mt-2 text-xs text-zinc-500">No iPhone, acesse o sistema pelo Safari. Arquivos APK são exclusivos do Android.</p>
    </section>
  );
}
