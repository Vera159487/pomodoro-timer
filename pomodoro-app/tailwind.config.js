/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        apple: {
          red: '#ff3b30',
          orange: '#ff9500',
          green: '#34c759',
          blue: '#007aff',
          purple: '#af52de',
          pink: '#ff2d55',
        }
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"',
          '"SF Pro Text"', '"Helvetica Neue"', 'Inter', 'system-ui',
          'sans-serif'
        ],
        mono: ['"SF Mono"', '"Fira Code"', '"Cascadia Code"', 'monospace']
      },
      borderRadius: {
        'apple': '22px',
      },
      backdropBlur: {
        'glass': '40px',
      }
    }
  },
  plugins: [],
}
