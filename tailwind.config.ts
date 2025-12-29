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
        orbitron: ['var(-- )', 'sans-serif'],
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
            200: '#FE645F',
            300: '#f68884',
          },
          pink: {
            DEFAULT: '#ffeaea',
            100: '#ffeaea',
          },
          orange: {
            DEFAULT: '#FFA500',
            100: '#FE635D',
          }
        }
      },
      keyframes: {
        'fade-in-up': {
          '0%': { 
            opacity: '0', 
            transform: 'translateY(30px)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'translateY(0)' 
          },
        },
        'fade-in-down': {
          '0%': { 
            opacity: '0', 
            transform: 'translateY(-30px)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'translateY(0)' 
          },
        },
        'fade-in-left': {
          '0%': { 
            opacity: '0', 
            transform: 'translateX(-30px)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'translateX(0)' 
          },
        },
        'fade-in-right': {
          '0%': { 
            opacity: '0', 
            transform: 'translateX(30px)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'translateX(0)' 
          },
        },
        'fade-in': {
          '0%': { 
            opacity: '0' 
          },
          '100%': { 
            opacity: '1' 
          },
        },
        'scale-in': {
          '0%': { 
            opacity: '0', 
            transform: 'scale(0.75)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'scale(1)' 
          },
        },
        'float': {
          '0%, 100%': { 
            transform: 'translateY(0px)' 
          },
          '50%': { 
            transform: 'translateY(-18px)' 
          },
        },
        'float-slow': {
          '0%, 100%': { 
            transform: 'translateY(0px) rotate(0deg)' 
          },
          '50%': { 
            transform: 'translateY(-22px) rotate(2deg)' 
          },
        },
        'float-fast': {
          '0%, 100%': { 
            transform: 'translateY(0px)' 
          },
          '50%': { 
            transform: 'translateY(-15px)' 
          },
        },
        'rotate-slow': {
          '0%': { 
            transform: 'rotate(0deg)' 
          },
          '100%': { 
            transform: 'rotate(360deg)' 
          },
        },
        'bounce-gentle': {
          '0%, 100%': { 
            transform: 'translateY(0px) scale(1)' 
          },
          '50%': { 
            transform: 'translateY(-8px) scale(1.1)' 
          },
        },
        'pulse-glow': {
          '0%, 100%': { 
            opacity: '1',
            transform: 'scale(1)'
          },
          '50%': { 
            opacity: '0.85',
            transform: 'scale(1.15)'
          },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'fade-in-up-delayed': 'fade-in-up 0.6s ease-out 0.2s both',
        'fade-in-up-more-delayed': 'fade-in-up 0.6s ease-out 0.4s both',
        'fade-in-down': 'fade-in-down 0.6s ease-out forwards',
        'fade-in-left': 'fade-in-left 0.6s ease-out forwards',
        'fade-in-right': 'fade-in-right 0.6s ease-out forwards',
        'fade-in': 'fade-in 0.6s ease-out forwards',
        'scale-in': 'scale-in 0.5s ease-out forwards',
        'float': 'float 2s ease-in-out infinite',
        'float-slow': 'float-slow 3s ease-in-out infinite',
        'float-fast': 'float-fast 1.5s ease-in-out infinite',
        'rotate-slow': 'rotate-slow 20s linear infinite',
        'bounce-gentle': 'bounce-gentle 1.5s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 1.5s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
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
          'padding': '0.25rem 0.25rem',
          'display': 'inline-block',
        },
        '.text-gradient-secondary': {
          'background': 'linear-gradient(90deg, #f783e1 0%, #61c2f5 49.03%, #9382e8 100%)',
          'background-clip': 'text',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'padding': '0.25rem 0.25rem',
          'display': 'inline-block',
        },
        '.text-gradient-primary-2': {
          'background': 'linear-gradient(90deg, #509ef4 0%, #ee8dd9 49.03%, #834df9 100%)',
          'background-clip': 'text',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'padding': '0.25rem 0.25rem',
          'display': 'inline-block',
        },
        '.radial-gradient': {
          'background': 'radial-gradient(139.32% 65.26% at 50% 0%, #aa5ffe 34.83%, #fdb7fe59, rgba(253, 183, 254, 0) 100%)',
          'background-blend-mode': 'multiply',
          'flex-shrink': '0',
        },
        '.bg-gradient-secondary': {
          'background': 'linear-gradient(90deg, #EA2EC6 0%, #F63753 49.03%, #7056F2 100%)',
        },
        '.bg-gradient-primary': {
          'background': 'linear-gradient(90deg, #3c80cb 0%, #c174b1 49.03%, #3b1c7f 100%)',
        },
      });  
    }),
  ],
};
export default config;
