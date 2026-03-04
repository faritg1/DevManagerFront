import React, { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../../widgets/Sidebar';
import { Header } from '../../widgets/Header';

import { ConfigProvider } from '../../shared/context';

export const MainLayout: React.FC = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const openMobileMenu = useCallback(() => setIsMobileMenuOpen(true), []);
    const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);

    return (
        <ConfigProvider>
            <div className="flex min-h-screen w-full bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display">
                <Sidebar isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
                
                <div className="flex-1 flex flex-col h-screen overflow-hidden">
                    <Header onMenuClick={openMobileMenu} />

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