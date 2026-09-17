import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#FAF9F6", // off-white — page/panel background
        ink: "#1A1A1A", // matte black — text, borders
        accent: "#7A1F1F", // dark red — primary actions, price
        trim: "#B8963E", // gold — active states, focus rings, structural rules
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
