import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#1a1208',
        'paper-mid': '#221a0a',
        'paper-light': '#2a2010',
        ink: '#e8d5a3',
        'ink-soft': '#c8b888',
        gold: '#c9a84c',
        'gold-bright': '#dfc06a',
        blood: '#8b1a1a',
        jade: '#3a7a5a',
      },
      fontFamily: {
        serif: ['"LXGW WenKai"', '"KaiTi"', '"STKaiti"', '"楷体"', '"FangSong"', '"STFangsong"', '"仿宋"', '"SimSun"', '"宋体"', 'serif'],
      },
    },
  },
} satisfies Config;
