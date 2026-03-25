/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './index.ts'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          500: '#3B82F6',
          600: '#1A56DB',
          700: '#1E3A8A',
        },
        muted: '#F3F4F6',
        border: '#E5E7EB',
        destructive: '#EF4444',
      },
    },
  },
  plugins: [],
};
