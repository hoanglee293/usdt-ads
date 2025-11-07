import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  corePlugins: {
    preflight: false, // Tắt các CSS mặc định
  },
  theme: {
    extend: {
      fontFamily: {
        orbitron: ['var(--font-orbitron)', 'sans-serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        theme: {
          black: {
            DEFAULT: '#000000',
            100: '#3C3C3C',
          },
          gray: {
            DEFAULT: '#E6E9EC',
            100: '#E6E9EC',
            200: '#3E3E3E',
          },
          white: {
            100: '#FFFCF9',
          },
          red: {
            DEFAULT: '#D40000',
            100: '#D61F00',
          },
          pink: {
            DEFAULT: '#ffeaea',
            100: '#ffeaea',
          }
        }
      },
    },
  },
  plugins: [],
};
export default config;
