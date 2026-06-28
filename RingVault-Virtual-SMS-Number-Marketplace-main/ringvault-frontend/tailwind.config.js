/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        head: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        bg:       { DEFAULT: '#0B0F1A', light: '#F0F2F8' },
        surface:  { DEFAULT: '#131826', 2: '#1C2236', 3: '#242B42', light: '#FFFFFF', 'light-2': '#F5F7FC', 'light-3': '#E8ECF5' },
        border:   { DEFAULT: '#2A3352', 2: '#354060', light: '#DDE1EE', 'light-2': '#C8CEDF' },
        accent:   { DEFAULT: '#F5A623', 2: '#E8891A' },
        brand:    { blue: '#4F8EF7', green: '#22C67A', red: '#F75B5B' },
      },
      animation: {
        'fade-slide': 'fadeSlide 0.3s ease',
        'pulse-ring': 'pulseRing 2s infinite',
        'sms-in': 'smsIn 0.4s ease',
        'modal-in': 'modalIn 0.25s ease',
      },
      keyframes: {
        fadeSlide: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseRing: { '0%,100%': { boxShadow: '0 0 0 0 rgba(34,198,122,0.4)' }, '50%': { boxShadow: '0 0 0 5px transparent' } },
        smsIn: { from: { opacity: 0, transform: 'translateX(-10px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        modalIn: { from: { opacity: 0, transform: 'scale(0.95)' }, to: { opacity: 1, transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
}
