import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'gray-900': '#121212',
        'gray-800': '#1e1e1e',
        'gray-700': '#2a2a2a',
        'gray-600': '#3a3a3a',
        'gray-500': '#6b7280',
        'gray-400': '#9ca3af',
        'gray-200': '#e5e7eb',
        'gray-100': '#f3f4f6',
        'brand-blue': '#007aff',
        'brand-green': '#34c759',
        'brand-red': '#ff3b30',
        'brand-yellow': '#ffcc00',
      },
    },
  },
  plugins: [],
};
export default config;
