import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  AuthProvider,
  NotificationProvider,
  ConfirmProvider,
} from "../shared/context";
import { MainLayout, AuthLayout } from "./layouts";
import { ProtectedRoute, PublicRoute, RoleGuard } from "./guards";
import { ROUTES } from "../shared/config/constants";
import { GlobalErrorListener } from "../shared/components/GlobalErrorListener";

// Feature pages - Lazy loaded for better performance
import {
  LoginPage,
  RegisterPage,
  DashboardPage,
  CreateProjectPage,
  ProjectsPage,
  ProjectDetailPage,
  EditProjectPage,
  OrganizationsPage,
  UsersPage,
  UserDetailPage,
  AgentsPage,
  ProfilePage,
  RolesPage,
  RolePermissionsPage,
  PermissionsPage,
  SkillsCatalogPage,
  ReportsPage,
  SettingsPage,
} from "../features";

export const AppRouter: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <ConfirmProvider>
          <NotificationProvider>
            <GlobalErrorListener />
            <Routes>
              {/* Public Routes - Redirect to dashboard if already authenticated */}
              <Route element={<PublicRoute />}>
                <Route element={<AuthLayout />}>
                  <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                  <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
                </Route>
              </Route>

              {/* Protected Routes - Require authentication */}
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                {/* Dashboard */}
                <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />

                {/* Projects */}
                <Route path={ROUTES.PROJECTS} element={<ProjectsPage />} />
                <Route
                  path={ROUTES.PROJECT_DETAIL}
                  element={<ProjectDetailPage />}
                />

                {/* Projects — Admin only */}
                <Route element={<RoleGuard allowedRoles={['admin', 'administrator']} />}>
                  <Route
                    path={ROUTES.CREATE_PROJECT}
                    element={<CreateProjectPage />}
                  />
                  <Route
                    path={ROUTES.EDIT_PROJECT}
                    element={<EditProjectPage />}
                  />
                </Route>

                {/* Reports — Admin only */}
                <Route element={<RoleGuard allowedRoles={['admin', 'administrator']} />}>
                  <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
                </Route>

                {/* Agents */}
                <Route path={ROUTES.AGENTS} element={<AgentsPage />} />

                {/* Administration — Admin only */}
                <Route element={<RoleGuard allowedRoles={['admin', 'administrator']} />}>
                  <Route
                    path={ROUTES.ORGANIZATIONS}
                    element={<OrganizationsPage />}
                  />
                  <Route path={ROUTES.USERS} element={<UsersPage />} />
                  <Route path={ROUTES.USER_DETAIL} element={<UserDetailPage />} />
                </Route>

                {/* Security — Roles & Permissions (Admin only) */}
                <Route element={<RoleGuard allowedRoles={['admin', 'administrator']} />}>
                  <Route path={ROUTES.ROLES} element={<RolesPage />} />
                  <Route
                    path={`${ROUTES.ROLES}/:id/permissions`}
                    element={<RolePermissionsPage />}
                  />
                  <Route path={ROUTES.PERMISSIONS} element={<PermissionsPage />} />
                </Route>

                {/* Skills Catalog */}
                <Route path={ROUTES.SKILLS_CATALOG} element={<SkillsCatalogPage />} />

                {/* User */}
                <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
                <Route
                  path={ROUTES.SETTINGS}
                  element={<SettingsPage />}
                />
                </Route>
              </Route>

              {/* Fallback */}
              <Route
                path="*"
                element={<Navigate to={ROUTES.LOGIN} replace />}
              />
            </Routes>
          </NotificationProvider>
        </ConfirmProvider>
      </AuthProvider>
    </HashRouter>
  );
};

export default AppRouter;
