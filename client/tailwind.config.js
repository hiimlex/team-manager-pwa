/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // GitHub-inspired dark base
        bg: "#0D1117",
        surface: "#161B22",
        border: "#30363D",
        hover: "#21262D",
        // iFood-inspired red accent
        primary: "#E30613",
        "primary-hover": "#C0050F",
        "primary-muted": "#7D0308",
        // Text
        text: "#F0F6FC",
        "text-muted": "#8B949E",
        "text-dim": "#484F58",
        // States
        success: "#238636",
        warning: "#9E6A03",
        info: "#1F6FEB",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "score-bump": "scoreBump 0.3s ease-out",
      },
      keyframes: {
        scoreBump: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.3)" },
          "100%": { transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
