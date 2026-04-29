/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        kid: {
          sky: '#5B8CFF',
          mint: '#5ED7B8',
          peach: '#FFB26B',
          lilac: '#A78BFA',
          bg: '#F4F8FF',
          text: '#1F2A44'
        }
      },
      
      boxShadow: {
        card: '0 14px 40px rgba(91, 140, 255, 0.16)'
      },
      borderRadius: {
        xl2: '1.25rem'
      },
      fontFamily: {
        app: ['Nunito', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        kids: ['Baloo 2', 'Nunito', 'cursive']
      },
      backgroundImage: {
  bgImage: "url('/src/assets/keystroke-bg.png')"
},
      
    },
  },
  plugins: [],
}

