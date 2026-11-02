/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        foundation: {
          bg: '#0c1017',
          surface: '#131923',
          surfaceElevated: '#1a2230',
          surfaceHover: '#1e2838',
          border: '#222c3c',
          borderSubtle: '#18202c',
          input: '#0e141d',
          inputBorder: '#263345',
        },
        brand: {
          teal: '#0d9488',
          tealLight: '#14b8a6',
          tealMuted: '#134e4a',
          tealSubtle: 'rgba(13, 148, 136, 0.12)',
        },
        semantic: {
          emerald: '#10b981',
          emeraldBg: 'rgba(16, 185, 129, 0.1)',
          emeraldBorder: 'rgba(16, 185, 129, 0.25)',
          amber: '#f59e0b',
          amberBg: 'rgba(245, 158, 11, 0.1)',
          amberBorder: 'rgba(245, 158, 11, 0.25)',
          rose: '#f43f5e',
          roseBg: 'rgba(244, 63, 94, 0.1)',
          roseBorder: 'rgba(244, 63, 94, 0.25)',
          sky: '#38bdf8',
          skyBg: 'rgba(56, 189, 248, 0.1)',
          skyBorder: 'rgba(56, 189, 248, 0.25)',
        }
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          '"Liberation Mono"',
          '"Courier New"',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
}

