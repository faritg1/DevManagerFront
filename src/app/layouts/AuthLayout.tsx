import React from 'react';
import { RouteBoundary } from '../../shared/components/RouteBoundary';

export const AuthLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark">
            <RouteBoundary />
        </div>
    );
};

