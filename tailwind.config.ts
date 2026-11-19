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
          DEFAULT: '#FF7F00', // laranja da logo Liinc
          dark: '#C25E00',
          pale: '#FFF2E5',
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
