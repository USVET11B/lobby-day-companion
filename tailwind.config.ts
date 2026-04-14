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
        // Bear Flag Veterans California palette
        ca: {
          blue: "#1172d4",
          "blue-hover": "#0e5fb4",
          gold: "#ffc107",
          "gold-hover": "#e6ac00",
          dark: "#15294a",
          "dark-hover": "#0f1f38",
          cream: "#fafaf5",
          red: "#d32f2f",
        },
        primary: {
          50: "#f0f7ff",
          100: "#e0efff",
          200: "#b8dbff",
          300: "#7cbeff",
          400: "#369cf7",
          500: "#1172d4",
          600: "#0e5fb4",
          700: "#0b4d93",
          800: "#15294a",
          900: "#0f1f38",
          DEFAULT: "#1172d4",
        },
        dem: {
          DEFAULT: "#1e40af",
          light: "#3b82f6",
          dark: "#1e3a8a",
        },
        rep: {
          DEFAULT: "#b91c1c",
          light: "#dc2626",
          dark: "#991b1b",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 8px -2px rgba(21, 41, 74, 0.08), 0 4px 16px -4px rgba(21, 41, 74, 0.06)",
        card: "0 1px 3px 0 rgba(21, 41, 74, 0.08), 0 1px 2px -1px rgba(21, 41, 74, 0.04)",
        "card-hover":
          "0 4px 12px -2px rgba(21, 41, 74, 0.1), 0 8px 24px -4px rgba(21, 41, 74, 0.08)",
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
    },
  },
  plugins: [],
};
export default config;
