import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          DEFAULT: '#F47B20',
          dark: '#D4660F',
          pale: '#FFF3E8',
        },
        navy: {
          DEFAULT: '#000222', // azul da marca (letras da logo Liinc)
          light: '#0B1036',
          muted: '#3A3F66',
        },
      },
      fontFamily: {
        sans: ['Lato', 'sans-serif'],
        display: ['Work Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
