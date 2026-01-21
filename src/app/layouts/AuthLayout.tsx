import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark">
            <Outlet />
        </div>
    );
};

export default AuthLayout;
