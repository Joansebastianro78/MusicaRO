/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0B0B0F',
        surface: '#15151D',
        gold: {
          DEFAULT: '#D4A24C',
          soft: '#E7C077'
        },
        wine: '#7A2E3B',
        cream: '#F2EDE4'
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      boxShadow: {
        vinyl: '0 0 0 1px rgba(212,162,76,0.15), 0 20px 60px -15px rgba(0,0,0,0.7)'
      }
    }
  },
  plugins: []
};
