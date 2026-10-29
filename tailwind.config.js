/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './*.html',
    './etablissements/**/*.html',
    './platform/**/*.html',
    './faculties/**/*.html',
  ],
  theme: {
    extend: {
      colors: {
        primary: { light: '#0ea5e9', dark: '#38bdf8' },
        surface: { light: 'rgba(255, 255, 255, 0.7)', dark: 'rgba(15, 23, 42, 0.7)' },
        textMain: { light: '#0f172a', dark: '#f8fafc' },
        textMuted: { light: '#475569', dark: '#cbd5e1' },
        midnight: { 900: '#070C18', 800: '#0B132B', 700: '#1C2541', 600: '#2A365C' },
        gold: { 300: '#FFE885', 400: '#F3CF55', 500: '#D4AF37', 600: '#AA8820' },
      },
      fontFamily: {
        sans: ['Cairo', 'Tajawal', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};