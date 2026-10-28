import type { Metadata } from "next";
import { Barlow } from "next/font/google";
import "./globals.css";
const fonte = Barlow({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--fonte" });
export const metadata: Metadata = { title: "Lumar Fire", description: "Inspeção de extintores e mangueiras de incêndio" };
export default function Raiz({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR"><body className={`${fonte.variable} font-sans`}>{children}</body></html>;
}
