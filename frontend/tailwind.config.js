/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#101C19',
        card: '#192723',
        raised: '#20322D',
        line: '#2B3B35',
        fg: '#E8F0EA',
        muted: '#91A99D',
        accent: {
          DEFAULT: '#A995FF',
          hover: '#BCADFF',
          ink: '#241A5C',
          soft: 'rgba(169,149,255,0.14)',
        },
        good: '#4BCB80',
        warn: '#F2C14E',
        bad: '#F27C84',
      },
      fontFamily: {
        sans: ['"Schibsted Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: { xl2: '1.25rem' },
    },
  },
  plugins: [],
}
