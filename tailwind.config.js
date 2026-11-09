import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                // Brand accent (icons, focus, fills, blue text in dark mode).
                'primary': '#1392ec',
                'primary-dark': '#0f7bc2',
                // Accessible shades of the brand for solid buttons and blue text in light mode (AA on white).
                'primary-400': '#3aa3f0',
                'primary-600': '#0b6fb8',
                'primary-700': '#0a5f9e',
                'background-light': '#f6f7f8',
                'background-dark': '#111b22',
                'surface-dark': '#192833',
                'card-dark': '#16222b',
                'border-dark': '#233948',
                // Form control borders: 3:1 against their surface (WCAG 1.4.11).
                'control-border': '#8492a6',
                'input-border': '#4a6d8c',
                'text-muted': '#92b2c9',
            },
            fontFamily: {
                display: ['Inter', 'sans-serif'],
            },
            transitionTimingFunction: {
                standard: 'cubic-bezier(0.2, 0, 0, 1)',
                enter: 'cubic-bezier(0, 0, 0.2, 1)',
                exit: 'cubic-bezier(0.4, 0, 1, 1)',
            },
            keyframes: {
                'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
                'scale-in': { from: { opacity: '0', transform: 'scale(.98)' }, to: { opacity: '1', transform: 'scale(1)' } },
                'slide-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
                'slide-in-left': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
            },
            animation: {
                'fade-in': 'fade-in 220ms cubic-bezier(0, 0, 0.2, 1)',
                'scale-in': 'scale-in 220ms cubic-bezier(0, 0, 0.2, 1)',
                'slide-up': 'slide-up 220ms cubic-bezier(0, 0, 0.2, 1)',
                'slide-in-left': 'slide-in-left 220ms cubic-bezier(0, 0, 0.2, 1)',
            },
        },
    },
    plugins: [typography],
};
