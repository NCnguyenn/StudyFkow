import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "misty-cyan": {
          DEFAULT: "#a5f3fc",
          10: "rgba(165, 243, 252, 0.1)",
          20: "rgba(165, 243, 252, 0.2)",
          50: "rgba(165, 243, 252, 0.5)",
        },
        "lavender-soft": "#e9d5ff",
      },
      keyframes: {
        breathe: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        breathe: "breathe 4s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "spin-slow": "spin 3s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
