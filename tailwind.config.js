/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Brand Colors - Matcha Green
        brand: {
          DEFAULT: '#7AA06E',
          light: '#EFF5ED',
          dark: '#56744C',
        },
        // Background Colors
        'bg-canvas': '#FAFAF8',
        'bg-surface': '#FFFFFF',
        // Text Colors
        'text-main': '#4B4036',
        'text-sub': '#8C857B',
        // Accent & Semantic
        accent: '#EBCD78',
        error: '#D97D7D',
      },
      fontFamily: {
        pretendard: ['Pretendard', 'sans-serif'],
        noto: ['NotoSansJP', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

