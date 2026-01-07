import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginScreen from './screens/Login';
import RegisterScreen from './screens/Register';
import DashboardScreen from './screens/Dashboard';
import CreateProjectScreen from './screens/CreateProject';
import ProfileScreen from './screens/Profile';
import MarketplaceScreen from './screens/Marketplace';
import ProjectDetailScreen from './screens/ProjectDetail';
import ReportsScreen from './screens/Reports';
import OrganizationsScreen from './screens/Organizations';
import UsersScreen from './screens/Users';

const App: React.FC = () => {
    return (
        <HashRouter>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LoginScreen />} />
                <Route path="/register" element={<RegisterScreen />} />

                {/* Authenticated Routes wrapped in Layout */}
                <Route element={<Layout />}>
                    <Route path="/dashboard" element={<DashboardScreen />} />
                    <Route path="/projects" element={<MarketplaceScreen />} /> {/* Reusing Marketplace as Project List for now */}
                    <Route path="/create-project" element={<CreateProjectScreen />} />
                    <Route path="/profile" element={<ProfileScreen />} />
                    <Route path="/marketplace" element={<MarketplaceScreen />} />
                    <Route path="/project-detail" element={<ProjectDetailScreen />} />
                    <Route path="/reports" element={<ReportsScreen />} />
                    
                    {/* New Admin Screens */}
                    <Route path="/organizations" element={<OrganizationsScreen />} />
                    <Route path="/users" element={<UsersScreen />} />
                    <Route path="/roles" element={<div className="p-10 text-slate-500 text-center">Gestión de Roles (Próximamente)</div>} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </HashRouter>
    );
};

export default App;
