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
          DEFAULT: '#1A2744',
          light: '#253459',
          muted: '#3D4F7A',
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
