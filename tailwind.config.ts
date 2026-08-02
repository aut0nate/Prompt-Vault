import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        accentSoft: "rgb(var(--accent-soft) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
      },
      boxShadow: {
        glow: "0 20px 70px rgb(var(--accent) / 0.18)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      fontFamily: {
        sans: ["Avenir Next", "Avenir", "Segoe UI", "sans-serif"],
        display: ["Iowan Old Style", "Baskerville", "Times New Roman", "serif"],
        mono: ["SFMono-Regular", "JetBrains Mono", "Menlo", "monospace"],
      },
      backgroundImage: {
        "mesh-light":
          "radial-gradient(circle at top left, rgba(255, 140, 92, 0.18), transparent 40%), radial-gradient(circle at bottom right, rgba(57, 176, 255, 0.2), transparent 35%)",
        "mesh-dark":
          "radial-gradient(circle at top left, rgba(255, 119, 61, 0.28), transparent 35%), radial-gradient(circle at bottom right, rgba(45, 133, 255, 0.28), transparent 35%)",
      },
    },
  },
  plugins: [],
};

export default config;
