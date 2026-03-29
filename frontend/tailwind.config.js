module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        saffron: { DEFAULT: '#FF6B2B', dark: '#E55A1A', light: '#FFF0EA' },
        peach: { DEFAULT: '#FFDAB9', light: '#FFF5EE' },
        hotel: { green: '#2E7D32', 'green-light': '#E8F5E9' }
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['DM Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
