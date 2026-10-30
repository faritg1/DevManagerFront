import React, { useState, useCallback } from 'react';
import { RouteBoundary } from '../../shared/components/RouteBoundary';
import { Sidebar } from '../../widgets/Sidebar';
import { Header, ImpersonationBanner } from '../../widgets/Header';

import { ConfigProvider, PermissionsProvider, UserNotificationsProvider } from '../../shared/context';
import { useTableCellLabels } from '../../shared/hooks';

export const MainLayout: React.FC = () => {
    useTableCellLabels();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const openMobileMenu = useCallback(() => setIsMobileMenuOpen(true), []);
    const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);

    return (
        <ConfigProvider>
        <PermissionsProvider>
        <UserNotificationsProvider>
            <div className="flex min-h-screen w-full bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display">
                <a href="#main-content" onClick={(e) => { e.preventDefault(); document.getElementById('main-content')?.focus(); }} className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white">
                    Saltar al contenido
                </a>
                <Sidebar isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
                
                <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden print:h-auto print:overflow-visible">
                    <ImpersonationBanner />
                    <Header onMenuClick={openMobileMenu} />

                    <main id="main-content" tabIndex={-1} className="flex-1 outline-none overflow-y-auto bg-background-light dark:bg-background-dark scroll-smooth print:overflow-visible">
                        <RouteBoundary />
                    </main>
                </div>
            </div>
        </UserNotificationsProvider>
        </PermissionsProvider>
        </ConfigProvider>
    );
};

