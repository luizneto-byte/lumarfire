import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: { colors: { fogo: "#D4262C", grafite: "#1E2328", papel: "#F4F4F1", agua: "#1F6A8A" },
    fontFamily: { sans: ["var(--fonte)", "system-ui", "sans-serif"] } } },
} satisfies Config;
