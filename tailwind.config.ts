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
            200: '#FE645F'
          },
          pink: {
            DEFAULT: '#ffeaea',
            100: '#ffeaea',
          }
        }
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      addUtilities({
        '.text-gradient-primary': {
          'background': 'linear-gradient(180deg, #FE645F 0%, #C68AFE 100%)',
          'background-clip': 'text',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
        },
        '.text-gradient-secondary': {
          'background': 'linear-gradient(90deg, #EA2EC6 0%, #F63753 49.03%, #7056F2 100%)',
          'background-clip': 'text',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'padding': '0.25rem 0.25rem',
          'display': 'inline-block',
        },
        '.radial-gradient': {
          'background': 'radial-gradient(139.32% 65.26% at 50% 0%, #FE645F 34.83%, #fdb7fe59, rgba(253, 183, 254, 0) 100%)',
          'background-blend-mode': 'multiply',
          'flex-shrink': '0',
        },
      });
    }),
  ],
};
export default config;
