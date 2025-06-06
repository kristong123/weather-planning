/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5a71af',
          dark: '#44417e',
        },
        gray: {
          light: '#f5f5f5',
          border: '#ddd',
        },
        text: {
          dark: '#333',
          medium: '#555',
          light: '#666',
        }
      },
      spacing: {
        '0.5': '0.125rem',
        '1.5': '0.375rem',
        '2.5': '0.625rem',
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'md': '0 2px 10px rgba(0, 0, 0, 0.1)',
        'lg': '0 4px 20px rgba(0, 0, 0, 0.2)',
      },
      borderRadius: {
        DEFAULT: '4px',
        'lg': '8px',
      }
    },
  },
  plugins: [],
} 