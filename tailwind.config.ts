import type { Config } from "tailwindcss";

/**
 * Design tokens extracted from design-reference/design-system.fig
 * (Figma Variables: primitive/*, bg/*, text/*, border/*, action/*, status/*).
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      white: "#ffffff",
      neutral: {
        0: "#ffffff",
        50: "#fafaf8",
        100: "#f4f3f0",
        200: "#e6e3dd",
        300: "#d1ccc3",
        500: "#78736a",
        700: "#3f3b36",
        900: "#181614"
      },
      ink: {
        DEFAULT: "#1c1c1c",
        strong: "#111111",
        black: "#000000",
        50: "#f1f1f1",
        200: "#bdbdbd"
      },
      green: { 50: "#eaf7ef", 200: "#b8e3c7", 700: "#1f6b3d" },
      blue: { 50: "#eef2f7", 200: "#cad6e4", 700: "#35516f" },
      purple: { 50: "#f5edff", 200: "#dcc7ff", 700: "#5a3d8a" },
      yellow: { 50: "#fff6da", 200: "#ecdfae", 700: "#7a5600" },
      red: { 50: "#fdecec", 100: "#fbdfdf", 200: "#f0b7b7", 500: "#b54545", 700: "#9f2a2a" }
    },
    extend: {
      colors: {
        page: "#fafaf8",
        surface: "#ffffff",
        subtle: "#f4f3f0",
        line: { DEFAULT: "#e6e3dd", strong: "#d1ccc3" }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        serif: ["var(--font-crimson)", "Georgia", "serif"]
      },
      fontSize: {
        "2xs": ["11px", { lineHeight: "14px" }],
        "13": ["13px", { lineHeight: "18px" }]
      },
      borderRadius: {
        card: "12px",
        btn: "10px",
        field: "8px"
      },
      boxShadow: {
        card: "0 1px 2px rgb(24 22 20 / 0.05)",
        pop: "0 20px 48px rgb(24 22 20 / 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
