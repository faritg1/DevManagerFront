import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, NotificationProvider } from '../shared/context';
import { MainLayout, AuthLayout } from './layouts';
import { ROUTES } from '../shared/config/constants';

// Feature pages - Lazy loaded for better performance
import { 
    LoginPage, 
    RegisterPage, 
    DashboardPage, 
    CreateProjectPage,
    ProjectsPage,
    ProjectDetailPage,
    OrganizationsPage,
    UsersPage,
    AgentsPage,
} from '../features';

// Placeholder pages for routes not yet implemented
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
    <div className="p-10 text-slate-500 text-center">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p>Próximamente</p>
    </div>
);

export const AppRouter: React.FC = () => {
    return (
        <HashRouter>
            <AuthProvider>
                <NotificationProvider>
                    <Routes>
                        {/* Public Routes */}
                        <Route element={<AuthLayout />}>
                            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                            <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
                        </Route>

                        {/* Protected Routes wrapped in MainLayout */}
                        <Route element={<MainLayout />}>
                            {/* Dashboard */}
                            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
                            
                            {/* Projects */}
                            <Route path={ROUTES.PROJECTS} element={<ProjectsPage />} />
                            <Route path={ROUTES.CREATE_PROJECT} element={<CreateProjectPage />} />
                            <Route path={ROUTES.PROJECT_DETAIL} element={<ProjectDetailPage />} />
                            
                            {/* Reports */}
                            <Route path={ROUTES.REPORTS} element={<PlaceholderPage title="Reportes IA" />} />
                            
                            {/* Agents */}
                            <Route path={ROUTES.AGENTS} element={<AgentsPage />} />
                            <Route path={ROUTES.MARKETPLACE} element={<PlaceholderPage title="Marketplace de Agentes" />} />
                            
                            {/* Administration */}
                            <Route path={ROUTES.ORGANIZATIONS} element={<OrganizationsPage />} />
                            <Route path={ROUTES.USERS} element={<UsersPage />} />
                            <Route path={ROUTES.ROLES} element={<PlaceholderPage title="Gestión de Roles" />} />
                            
                            {/* User */}
                            <Route path={ROUTES.PROFILE} element={<PlaceholderPage title="Mi Perfil" />} />
                        </Route>

                        {/* Fallback */}
                        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
                    </Routes>
                </NotificationProvider>
            </AuthProvider>
        </HashRouter>
    );
};

export default AppRouter;
