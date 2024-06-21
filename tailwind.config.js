/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        black: '#343434',
        'accent-7': '#333',
        cyan: '#79FFE1',
        primary: '#2D9AFF',
        'primary-hover': '#54ACFD',
        'text-default': '#343434',
        'text-disabled': '#A19F9D',
        tsecondary: '#7C7A78',
        background: '#FBFDFF',
        'background-blue': '#ECF8FF',
        'primary-pink': '#FF5B7D',
        danger: '#ee4435',
        'background-red-2': '#ffccc7',
        success: '#389e0d',
      },
      screens: {
        xs: '545px',
        xl: '1281px',
        '3xl': '1920px',
      },
      fontSize: {
        '5xl': ['2.5rem', '2.75rem'],
        '6xl': ['3rem', '3.25rem'],
      },
      boxShadow: {
        small: '0 5px 10px rgba(0, 0, 0, 0.12)',
        medium: '0 8px 30px rgba(0, 0, 0, 0.12)',
        'white-small': '0px 6px 14px rgba(213, 235, 255, 0.5)',
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  important: '#root',
  plugins: [],
};
