import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#1a1208',
        ink: '#e8d5a3',
        gold: '#c9a84c',
        blood: '#8b1a1a',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
      },
    },
  },
} satisfies Config;
