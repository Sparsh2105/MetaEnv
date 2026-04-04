/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          400: '#6b8cff',
          500: '#4f6ef7',
          600: '#3b55e6',
          700: '#2d42c8',
          900: '#1a2580',
        },
        surface: {
          900: '#0a0e1a',
          800: '#0f1629',
          700: '#151e38',
          600: '#1c2847',
          500: '#243058',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(79,110,247,0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(79,110,247,0.8)' },
        }
      }
    },
  },
  plugins: [],
}
