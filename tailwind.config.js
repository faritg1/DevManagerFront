import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                'primary': '#1392ec',
                'primary-dark': '#0f7bc2',
                'background-light': '#f6f7f8',
                'background-dark': '#111b22',
                'surface-dark': '#192833',
                'card-dark': '#16222b',
                'border-dark': '#233948',
                'input-border': '#325167',
                'text-muted': '#92b2c9',
                'text-secondary': '#92b2c9',
            },
            fontFamily: {
                display: ['Inter', 'sans-serif'],
                body: ['Noto Sans', 'sans-serif'],
            },
        },
    },
    plugins: [typography],
};
