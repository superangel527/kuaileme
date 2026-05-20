import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          deep: "#0a0a12",
          night: "#11111c",
          card: "#181826",
        },
        glow: {
          pink: "#ff5fa2",
          violet: "#8b5cf6",
          cyan: "#22d3ee",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "PingFang TC",
          "Noto Sans TC",
          "Microsoft JhengHei",
          "sans-serif",
        ],
      },
      animation: {
        "pulse-glow": "pulseGlow 2.2s ease-in-out infinite",
        "fade-in-up": "fadeInUp 0.35s ease-out both",
        "blink-dot": "blinkDot 1.2s ease-in-out infinite",
        "drift": "drift 8s ease-in-out infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "0.9", filter: "drop-shadow(0 0 6px #ff5fa2)" },
          "50%": { opacity: "1", filter: "drop-shadow(0 0 16px #ff5fa2)" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        blinkDot: {
          "0%, 80%, 100%": { opacity: "0.2", transform: "translateY(0)" },
          "40%": { opacity: "1", transform: "translateY(-3px)" },
        },
        drift: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-2px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
