import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        track: {
          bg: "#0A0A0C",       // fond principal, noir profond
          surface: "#141417",  // cartes / panneaux
          surface2: "#1C1C21", // éléments surélevés
          border: "#28282E",
          muted: "#8C8C96",
          white: "#F5F5F7",
          yellow: "#FFC700",
          orange: "#FF6A00",
          red: "#E8102B",
        },
      },
      fontFamily: {
        display: ["var(--font-rajdhani)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "flag-gradient": "linear-gradient(90deg, #FFC700 0%, #FF6A00 55%, #E8102B 100%)",
        "flag-radial": "conic-gradient(from -90deg, #FFC700 0deg, #FF6A00 180deg, #E8102B 360deg)",
      },
      boxShadow: {
        glow: "0 0 24px -6px rgba(255, 106, 0, 0.45)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
