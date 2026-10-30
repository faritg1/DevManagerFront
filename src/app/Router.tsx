import React, { lazy } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import {
  AuthProvider,
  NotificationProvider,
  ConfirmProvider,
} from "../shared/context";
import { MainLayout, AuthLayout } from "./layouts";
import { ProtectedRoute, PublicRoute, AdminGuard, PermissionGuard } from "./guards";
import { ROUTES } from "../shared/config/constants";
import { GlobalErrorListener } from "../shared/components/GlobalErrorListener";
import { NotFoundPage } from "../shared/components/RouteBoundary";

/** Route-level code splitting: each feature module loads on first visit (Suspense lives in the layouts). */
const page = <M extends Record<string, unknown>>(load: () => Promise<M>, name: keyof M) =>
  lazy(() => load().then((m) => ({ default: m[name] as React.ComponentType })));

const auth = () => import("../features/auth");
const projects = () => import("../features/projects");
const users = () => import("../features/users");
const rbac = () => import("../features/rbac");
const associates = () => import("../features/associates");
const education = () => import("../features/education");

const LoginPage = page(auth, "LoginPage");
const RegisterPage = page(auth, "RegisterPage");
const DashboardPage = page(() => import("../features/dashboard"), "DashboardPage");
const CreateProjectPage = page(projects, "CreateProjectPage");
const ProjectsPage = page(projects, "ProjectsPage");
const ProjectDetailPage = page(projects, "ProjectDetailPage");
const EditProjectPage = page(projects, "EditProjectPage");
const OrganizationsPage = page(() => import("../features/organizations"), "OrganizationsPage");
const UsersPage = page(users, "UsersPage");
const UserDetailPage = page(users, "UserDetailPage");
const AgentsPage = page(() => import("../features/agents"), "AgentsPage");
const ProfilePage = page(() => import("../features/profile"), "ProfilePage");
const RolesPage = page(rbac, "RolesPage");
const RolePermissionsPage = page(rbac, "RolePermissionsPage");
const PermissionsPage = page(rbac, "PermissionsPage");
const SkillsCatalogPage = page(() => import("../features/skills"), "SkillsCatalogPage");
const ReportsPage = page(() => import("../features/reports"), "ReportsPage");
const AiUsagePage = page(() => import("../features/ai"), "AiUsagePage");
const SettingsPage = page(() => import("../features/settings"), "SettingsPage");
const AssociatesPage = page(associates, "AssociatesPage");
const AssociateDetailPage = page(associates, "AssociateDetailPage");
const DataPoliciesPage = page(associates, "DataPoliciesPage");
const EducationProgramsPage = page(education, "EducationProgramsPage");
const ProgramDetailPage = page(education, "ProgramDetailPage");
const NominaPage = page(() => import("../features/nomina"), "NominaPage");
const OrganosPage = page(() => import("../features/organos"), "OrganosPage");
const BienestarPage = page(() => import("../features/bienestar"), "BienestarPage");
const BalanceSocialPage = page(() => import("../features/balance-social"), "BalanceSocialPage");
const SstPage = page(() => import("../features/sst"), "SstPage");
const ExcedentesPage = page(() => import("../features/excedentes"), "ExcedentesPage");
const HabeasDataPage = page(() => import("../features/habeas-data"), "HabeasDataPage");
const CompetenciasPage = page(() => import("../features/competencias"), "CompetenciasPage");
const ReportesSupersolidariaPage = page(() => import("../features/reportes-supersolidaria"), "ReportesSupersolidariaPage");
const AsistentePage = page(() => import("../features/asistente"), "AsistentePage");
const SuperAdminPage = page(() => import("../features/platform"), "SuperAdminPage");
const AuditPage = page(() => import("../features/audit"), "AuditPage");
const ActivitiesPage = page(() => import("../features/activities"), "ActivitiesPage");
const MyActivitiesPage = page(() => import("../features/activities"), "MyActivitiesPage");

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
                  <Route element={<PermissionGuard />}>
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
                    <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
                    <Route path={ROUTES.AI_USAGE} element={<AiUsagePage />} />
                    {/* Guarded by its superAdminOnly menu entry (PermissionGuard) */}
                    <Route path={ROUTES.SUPER_ADMIN} element={<SuperAdminPage />} />
                    {/* menu.admin.audit or the super admin (navConfig allowSuperAdmin), as the API */}
                    <Route path={ROUTES.AUDIT} element={<AuditPage />} />
                    <Route path={ROUTES.ACTIVITIES} element={<ActivitiesPage />} />
                    <Route path={ROUTES.ACTIVITIES_PROJECT} element={<ActivitiesPage />} />
                    <Route path={ROUTES.MY_ACTIVITIES} element={<MyActivitiesPage />} />
                    <Route path={ROUTES.ASSOCIATES} element={<AssociatesPage />} />
                    <Route path={ROUTES.ASSOCIATE_DETAIL} element={<AssociateDetailPage />} />
                    <Route path={ROUTES.DATA_POLICIES} element={<DataPoliciesPage />} />
                    <Route path={ROUTES.EDUCATION} element={<EducationProgramsPage />} />
                    <Route path={ROUTES.EDUCATION_PROGRAM} element={<ProgramDetailPage />} />

                    <Route element={<PermissionGuard require="menu.platform.projects.create" />}>
                      <Route path={ROUTES.CREATE_PROJECT} element={<CreateProjectPage />} />
                    </Route>
                    <Route element={<PermissionGuard require="menu.platform.projects.edit" />}>
                      <Route path={ROUTES.EDIT_PROJECT} element={<EditProjectPage />} />
                    </Route>

                    <Route element={<AdminGuard />}>
                      <Route path={ROUTES.ORGANIZATIONS} element={<OrganizationsPage />} />
                      <Route path={ROUTES.USERS} element={<UsersPage />} />
                      <Route path={ROUTES.USER_DETAIL} element={<UserDetailPage />} />
                      <Route path={ROUTES.ROLES} element={<RolesPage />} />
                      <Route path={`${ROUTES.ROLES}/:id/permissions`} element={<RolePermissionsPage />} />
                      <Route path={ROUTES.PERMISSIONS} element={<PermissionsPage />} />
                    </Route>
                  </Route>
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Route>

            </Routes>
          </NotificationProvider>
        </ConfirmProvider>
      </AuthProvider>
    </HashRouter>
  );
};

