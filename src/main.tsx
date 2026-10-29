import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppRouter } from './app/Router';
import './index.css';

// Prints (and PDFs) always use the light theme: dark text colors would be unreadable on paper.
let printedDark = false;
window.addEventListener('beforeprint', () => {
    printedDark = document.documentElement.classList.contains('dark');
    document.documentElement.classList.remove('dark');
});
window.addEventListener('afterprint', () => document.documentElement.classList.toggle('dark', printedDark));

const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <AppRouter />
    </React.StrictMode>
);
