import React, { useState, useCallback } from 'react';
import { RouteBoundary } from '../../shared/components/RouteBoundary';
import { Sidebar } from '../../widgets/Sidebar';
import { Header } from '../../widgets/Header';

import { ConfigProvider, PermissionsProvider, UserNotificationsProvider } from '../../shared/context';

export const MainLayout: React.FC = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const openMobileMenu = useCallback(() => setIsMobileMenuOpen(true), []);
    const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);

    return (
        <ConfigProvider>
        <PermissionsProvider>
        <UserNotificationsProvider>
            <div className="flex min-h-screen w-full bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display">
                <Sidebar isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
                
                <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
                    <Header onMenuClick={openMobileMenu} />

                    <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark scroll-smooth">
                        <RouteBoundary />
                    </main>
                </div>
            </div>
        </UserNotificationsProvider>
        </PermissionsProvider>
        </ConfigProvider>
    );
};

