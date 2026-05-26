import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F5F3EE",
        card: "#FFFFFF",
        accent: {
          DEFAULT: "#3D6B4F",
          light: "#5A8F6E",
          dark: "#2D5240",
        },
      },
      fontFamily: {
        sans: ["Geist", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "monospace"],
      },
      maxWidth: {
        container: "1400px",
      },
      animation: {
        "score-pulse": "score-pulse 2s ease-in-out infinite",
      },
      keyframes: {
        "score-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
      },
    },
  },
  plugins: [],
};

export default config;