import type { Metadata } from "next";
import MobileInspecao from "@/components/MobileInspecao";
export const metadata: Metadata = { title: "Lumar Fire · Inspeção", manifest: "/inspecao-manifest.webmanifest", appleWebApp: { capable: true, title: "LF Inspeção" } };
export default function Mobile() { return <MobileInspecao />; }
