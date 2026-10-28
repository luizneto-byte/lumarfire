import Logo from "./Logo";
export default function Moldura({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen md:grid-cols-[2fr_3fr]">
      <aside className="hidden flex-col justify-between bg-grafite p-10 text-white md:flex">
        <Logo claro />
        <p className="max-w-xs text-2xl font-semibold leading-snug">Extintores e mangueiras sempre em dia, com a inspeção na palma da mão.</p>
        <p className="text-sm text-white/60">Inspeção de extintores e mangueiras de incêndio</p>
      </aside>
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 md:hidden"><Logo /></div>
          <h1 className="mb-6 text-2xl font-bold">{titulo}</h1>
          {children}
        </div>
      </section>
    </main>
  );
}
