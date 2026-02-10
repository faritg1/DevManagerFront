import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../../widgets/Sidebar';
import { Header } from '../../widgets/Header';

import { ConfigProvider } from '../../shared/context';

export const MainLayout: React.FC = () => {
    return (
        <ConfigProvider>
            <div className="flex min-h-screen w-full bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display">
                <Sidebar />
                
                <div className="flex-1 flex flex-col h-screen overflow-hidden">
                    <Header />

                    {/* Content Area */}
                    <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark scroll-smooth">
                        <Outlet />
                    </main>
                </div>
            </div>
        </ConfigProvider>
    );
};

export default MainLayout;