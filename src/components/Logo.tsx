import Image from "next/image";

export default function Logo({ claro = false }: { claro?: boolean }) {
  return (
    <div className="flex items-center gap-2" aria-label="Lumar Fire">
      <Image src="/lumar-fire-logo.png" alt="Lumar Fire" width={54} height={54} className="h-12 w-auto object-contain" priority />
      <span className={`text-lg font-bold tracking-tight ${claro ? "text-white" : "text-grafite"}`}>
        Lumar <span className="text-fogo">Fire</span>
      </span>
    </div>
  );
}
