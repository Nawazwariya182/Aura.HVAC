import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        title: ['Magilio', 'Poppins', 'sans-serif'],
        magilio: ['Magilio', 'Poppins', 'sans-serif'],
        departure: ['DepartureMono', 'monospace'],
        nav: ['DepartureMono', 'monospace'],
      },
      colors: {
        background: "#f8fafc", // Clean, calm light background
        foreground: "#0f172a", // Rich slate-900 text
        card: "#ffffff",       // Pure white cards
        "card-border": "#e2e8f0", // Subtle clean gray border
        muted: "#64748b",      // Slate-500 secondary text
        heat: {
          subtle: "#ffedd5",
          DEFAULT: "#ea580c",
          high: "#ef4444",
          max: "#dc2626"
        },
        cool: {
          subtle: "#e0f2fe",
          DEFAULT: "#0284c7",
          high: "#0ea5e9",
          max: "#38bdf8"
        },
        comfort: {
          subtle: "#ecfdf5",
          DEFAULT: "#10b981",
          glow: "rgba(16, 185, 129, 0.15)"
        }
      },
      boxShadow: {
        'soft': '0 2px 10px -2px rgba(0, 0, 0, 0.05), 0 1px 4px -1px rgba(0, 0, 0, 0.03)',
        'soft-lg': '0 10px 25px -3px rgba(0, 0, 0, 0.06), 0 4px 10px -2px rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
};

export default config;
