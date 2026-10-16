/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        warm: {
          bg: '#F8F5F0',
          sidebar: '#FBF9F5',
          card: '#FFFFFF',
          border: '#E7E2D6',
          borderLight: '#F0EBE1',
          terracotta: '#C05D34',
          terracottaDark: '#A94F2B',
          terracottaTint: '#FBECE6',
          ink: '#1A2533',
          muted: '#6F7C8E',
          faint: '#8E9AAB',
        },
        ink: {
          DEFAULT: '#1A2533',
          deep: '#101824',
          subtle: '#263447',
        },
        terracotta: {
          DEFAULT: '#C05D34',
          dark: '#A94F2B',
          tint: '#FBECE6',
        },
        paper: {
          DEFAULT: '#F8F5F0',
          subtle: '#FBF9F5',
          card: '#FFFFFF',
        },
        teal: {
          DEFAULT: '#1F7A64',
          dark: '#175D4C',
          light: '#28987D',
          tint: '#E1F2ED',
        },
        gold: {
          DEFAULT: '#C97A2B',
          dark: '#A6601D',
          tint: '#F5E4CE',
        },
        rust: {
          DEFAULT: '#B23A3A',
          dark: '#8E2C2C',
          tint: '#FBE7E5',
        },
      },
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(26, 37, 51, 0.04)',
        elevated: '0 10px 25px -5px rgba(26, 37, 51, 0.08), 0 8px 10px -6px rgba(26, 37, 51, 0.04)',
        '2xs': '0 1px 2px rgba(0, 0, 0, 0.02)',
      }
    },
  },
  plugins: [],
}
