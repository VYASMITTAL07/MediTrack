import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        destructive: "hsl(var(--destructive))"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        display: ["var(--font-display)", "ui-serif", "Georgia"]
      },
      spacing: {
        13: "3.25rem"
      },
      boxShadow: {
        glow: "0 0 80px rgba(20, 184, 166, 0.25)",
        glass: "0 24px 80px rgba(2, 6, 23, 0.14)"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-18px)" }
        },
        pulseRing: {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "100%": { transform: "scale(1.35)", opacity: "0" }
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" }
        }
      },
      animation: {
        float: "float 7s ease-in-out infinite",
        pulseRing: "pulseRing 1.8s cubic-bezier(0, 0, 0.2, 1) infinite",
        shimmer: "shimmer 1.8s linear infinite"
      },
      backgroundImage: {
        "health-grid":
          "linear-gradient(rgba(20,184,166,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,166,.12) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;
