import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        primary: {
          light: '#329C5A', // blue-500
          DEFAULT: '#2D7B51', // blue-600
          dark: '#294B49', // blue-700
        },
        link:{
          light: '#3B82F6', // blue-500
          DEFAULT: '#2563EB', // blue-600
          dark: '#1D4ED8', // blue-700
        },
        secondary: {
          light: '#EF4444', // red-500
          DEFAULT: '#DC2626', // red-600
          dark: '#B91C1C', // red-700
        },
        neutral: {
          light: '#F3F4F6', // gray-100
          DEFAULT: '#9CA3AF', // gray-400
          dark: '#4B5563', // gray-600
        },
      },
    },
  },
  plugins: [],
};

export default config;