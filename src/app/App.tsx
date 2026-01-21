import React from 'react';
import { AppRouter } from './Router';

/**
 * Main Application Component
 * Entry point that wraps the entire application with necessary providers
 */
export const App: React.FC = () => {
    return <AppRouter />;
};

export default App;
