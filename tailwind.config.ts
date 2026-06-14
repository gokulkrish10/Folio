import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./contexts/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui"],
        serif: ["var(--font-newsreader)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 18px 45px rgba(54, 39, 25, 0.09)",
      },
    },
  },
  plugins: [],
};

export default config;
