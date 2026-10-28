import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  AuthProvider,
  NotificationProvider,
  ConfirmProvider,
} from "../shared/context";
import { MainLayout, AuthLayout } from "./layouts";
import { ProtectedRoute, PublicRoute, AdminGuard } from "./guards";
import { ROUTES } from "../shared/config/constants";
import { GlobalErrorListener } from "../shared/components/GlobalErrorListener";

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
  AssociatesPage,
  AssociateDetailPage,
  EducationProgramsPage,
  ProgramDetailPage,
  DataPoliciesPage,
  NominaPage,
  OrganosPage,
  BienestarPage,
  BalanceSocialPage,
  SstPage,
  ExcedentesPage,
  HabeasDataPage,
  CompetenciasPage,
  ReportesSupersolidariaPage,
  AsistentePage,
} from "../features";

export const AppRouter: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <ConfirmProvider>
          <NotificationProvider>
            <GlobalErrorListener />
            <Routes>
              <Route element={<PublicRoute />}>
                <Route element={<AuthLayout />}>
                  <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                  <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
                </Route>
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
                  <Route path={ROUTES.PROJECTS} element={<ProjectsPage />} />
                  <Route path={ROUTES.PROJECT_DETAIL} element={<ProjectDetailPage />} />
                  <Route path={ROUTES.AGENTS} element={<AgentsPage />} />
                  <Route path={ROUTES.SKILLS_CATALOG} element={<SkillsCatalogPage />} />
                  <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
                  <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
                  <Route path={ROUTES.NOMINA} element={<NominaPage />} />
                  <Route path={ROUTES.ORGANOS} element={<OrganosPage />} />
                  <Route path={ROUTES.BIENESTAR} element={<BienestarPage />} />
                  <Route path={ROUTES.BALANCE_SOCIAL} element={<BalanceSocialPage />} />
                  <Route path={ROUTES.SST} element={<SstPage />} />
                  <Route path={ROUTES.EXCEDENTES} element={<ExcedentesPage />} />
                  <Route path={ROUTES.HABEAS_DATA} element={<HabeasDataPage />} />
                  <Route path={ROUTES.COMPETENCIAS} element={<CompetenciasPage />} />
                  <Route path={ROUTES.REPORTES_SUPERSOLIDARIA} element={<ReportesSupersolidariaPage />} />
                  <Route path={ROUTES.ASISTENTE} element={<AsistentePage />} />

                  <Route element={<AdminGuard />}>
                    <Route path={ROUTES.CREATE_PROJECT} element={<CreateProjectPage />} />
                    <Route path={ROUTES.EDIT_PROJECT} element={<EditProjectPage />} />
                    <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
                    <Route path={ROUTES.ORGANIZATIONS} element={<OrganizationsPage />} />
                    <Route path={ROUTES.USERS} element={<UsersPage />} />
                    <Route path={ROUTES.USER_DETAIL} element={<UserDetailPage />} />
                    <Route path={ROUTES.ASSOCIATES} element={<AssociatesPage />} />
                    <Route path={ROUTES.ASSOCIATE_DETAIL} element={<AssociateDetailPage />} />
                    <Route path={ROUTES.DATA_POLICIES} element={<DataPoliciesPage />} />
                    <Route path={ROUTES.EDUCATION} element={<EducationProgramsPage />} />
                    <Route path={ROUTES.EDUCATION_PROGRAM} element={<ProgramDetailPage />} />
                    <Route path={ROUTES.ROLES} element={<RolesPage />} />
                    <Route path={`${ROUTES.ROLES}/:id/permissions`} element={<RolePermissionsPage />} />
                    <Route path={ROUTES.PERMISSIONS} element={<PermissionsPage />} />
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
            </Routes>
          </NotificationProvider>
        </ConfirmProvider>
      </AuthProvider>
    </HashRouter>
  );
};

