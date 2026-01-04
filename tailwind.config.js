/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        khaki: {
          DEFAULT: '#C3B091',
          dark: '#8B7D3A',
          light: '#F4F1E8',
          brown: '#6B4F1D',
        },
        textPrimary: '#3B2F2F',
        textSecondary: '#6E6658',
        priority: {
          high: '#8B0000',
          medium: '#D4A017',
          low: '#556B2F',
        },
      },
    },
  },
  plugins: [],
};
