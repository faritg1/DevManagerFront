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
                <Sidebar isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
                
                <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden print:h-auto print:overflow-visible">
                    <ImpersonationBanner />
                    <Header onMenuClick={openMobileMenu} />

                    <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark scroll-smooth print:overflow-visible">
                        <RouteBoundary />
                    </main>
                </div>
            </div>
        </UserNotificationsProvider>
        </PermissionsProvider>
        </ConfigProvider>
    );
};

