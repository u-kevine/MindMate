/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['Lato', 'sans-serif'],
      },
      colors: {
        sage: {
          50:  '#EBF3EC',
          100: '#C8DFC9',
          200: '#A8C5AC',
          300: '#88AC8D',
          400: '#6B8F71',
          500: '#5A7A60',
          600: '#496550',
          700: '#384F3F',
          800: '#263A2D',
          900: '#14251C',
        },
        terra: {
          50:  '#FAF0EB',
          100: '#F3CEBC',
          200: '#E9A98A',
          300: '#DC8058',
          400: '#C2714F',
          500: '#A85D3F',
          600: '#8D4930',
        },
        cream: { DEFAULT: '#FAF7F2', warm: '#FFFEF9' },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08)',
        panel: '0 4px 16px rgba(0,0,0,0.08)',
        modal: '0 8px 32px rgba(0,0,0,0.12)',
      },
      borderRadius: { xl: '16px', '2xl': '20px' },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}