# DevManager Frontend - AI Coding Instructions

## Project Overview
DevManager es una plataforma de gestión de talento para proyectos, asignación de recursos y agentes IA. Construido con **React 19 + TypeScript + Vite** usando arquitectura **Feature-Sliced Design (FSD)**.

## Arquitectura Feature-Sliced Design

El proyecto sigue la estructura FSD en `src/`. Ver [ARCHITECTURE.md](../ARCHITECTURE.md) para documentación completa.

```
src/
├── app/           # Router, layouts, providers globales
├── features/      # Módulos de dominio autocontenidos (auth, dashboard, agents, etc.)
├── widgets/       # Componentes complejos reutilizables (Sidebar, Header)
└── shared/        # UI atómicos, hooks, api, context, utils, types
```

**Regla de dependencias:** `shared` → `widgets` → `features` → `app` (nunca al revés)

## Imports y Aliases

Usa alias configurados en [vite.config.ts](../vite.config.ts):
```tsx
import { Button, Card, Badge } from '@shared/ui';
import { useModal, useForm } from '@shared/hooks';
import { ROUTES, PROJECT_STATUS } from '@shared/config/constants';
import { apiClient, API_ENDPOINTS } from '@shared/api';
```

## Componentes UI Reutilizables

Usa siempre componentes de [src/shared/ui/](../src/shared/ui/) en lugar de estilos inline:
```tsx
// ✅ Correcto
<Button variant="primary" icon={Plus}>Crear</Button>
<Card hoverable padding="md"><Badge variant="success" dot>Active</Badge></Card>

// ❌ Evitar - No crear estilos de botón/card manualmente
<button className="bg-primary rounded-xl...">Crear</button>
```

**Componentes disponibles:** `Button`, `Card`, `Badge`, `Avatar`, `Input`, `Modal`, `ProgressBar`, `StatCard`

## Sistema de Estilos

**Tailwind con dark mode obligatorio** - siempre incluye variantes `dark:`:
- Fondos: `bg-white dark:bg-[#16222b]` (cards), `dark:bg-[#111b22]` (inputs/sidebar)
- Bordes: `border-slate-200 dark:border-[#233948]`
- Texto: `text-slate-900 dark:text-white` (primario), `text-slate-500 dark:text-slate-400` (secundario)

## Rutas y Navegación

**HashRouter** - URLs usan formato `#/path`. Usa constantes de [constants.ts](../src/shared/config/constants.ts):
```tsx
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@shared/config/constants';

const navigate = useNavigate();
navigate(ROUTES.DASHBOARD);  // ✅ Usar constantes
navigate('/dashboard');      // ❌ Evitar strings hardcodeados
```

## Estado y Contextos

Usa contextos de [src/shared/context/](../src/shared/context/):
```tsx
import { useAuth, useNotification } from '@shared/context';

const { user, login, logout } = useAuth();
const { showNotification } = useNotification();
```

## API Client (Backend .NET)

**Base URL:** `https://devmanagerapi.runasp.net/api` | **Guía completa:** [API_GUIDE.md](../API_GUIDE.md)

### Servicios por Dominio

```tsx
import { 
    authService, 
    usersService, 
    projectsService, 
    skillsService, 
    profileService,
    applicationsService,
    assignmentsService,
    agentService 
} from '@shared/api';
```

### Ejemplos de Uso

```tsx
// ============ AUTH ============
await authService.login({ email, password });
await authService.registerOrganization({ organizationName, adminEmail, adminPassword, adminFullName });
authService.logout();

// ============ USERS ============
const { data: users } = await usersService.getAll();
await usersService.create({ email, password, fullName, roleId });
await usersService.update(id, { fullName, isActive });

// ============ PROFILE ============
const { data: profile } = await profileService.getMyProfile();
await profileService.updateMyProfile({ bio, yearsExperience, linkedinUrl });

// ============ SKILLS ============
const { data: skills } = await skillsService.getAll();
await skillsService.upsertEmployeeSkill({ skillId, level: 4, evidenceUrl });
await skillsService.validateSkill(skillId, { newLevel: 4 });

// ============ PROJECTS ============
const { data: projects } = await projectsService.getAll(ProjectStatus.Active);
await projectsService.create({ name, description, complexity: ProjectComplexity.Medium });
await projectsService.addRequirement(projectId, { skillId, requiredLevel: 4, isMandatory: true });
await projectsService.apply(projectId, { message: 'Me interesa participar...' });

// ============ APPLICATIONS ============
await applicationsService.review(applicationId, { status: ApplicationStatus.Approved, reviewNotes });

// ============ ASSIGNMENTS ============
await assignmentsService.create({ projectId, userId, role: 'Backend Developer', hoursPerWeek: 40 });

// ============ AGENT IA ============
const { data: answer } = await agentService.query({ query: '¿Cuántos devs con Java 4+?' });
const { data: candidates } = await agentService.matchCandidates({ projectId, minScore: 70 });
await agentService.approveAction(actionId);
```

### Respuesta Estándar del API

```tsx
interface ApiResponse<T> {
    success: boolean;
    message: string | null;
    data: T;
    timestamp: string;
}
```

### Enums Importantes

```tsx
// Estados de Proyecto: 0=Draft, 1=Active, 2=OnHold, 3=Completed, 4=Cancelled
// Complejidad: 0=Low, 1=Medium, 2=High
// Estado Postulación: 0=Pending, 1=Approved, 2=Rejected
// Tipo Skill: 0=Global, 1=Organizational
// Nivel Skill: 1=Básico, 2=Intermedio, 3=Competente, 4=Avanzado, 5=Experto
```

Los tipos del API están en [src/shared/api/types.ts](../src/shared/api/types.ts).

## Crear Nueva Feature

1. Crear carpeta en `src/features/{nombre}/`
2. Añadir `pages/`, `components/` según necesidad
3. Exportar en `src/features/{nombre}/index.ts`
4. Re-exportar en `src/features/index.ts`
5. Añadir ruta en [Router.tsx](../src/app/Router.tsx) usando `ROUTES` constante

## Comandos de Desarrollo

```bash
npm run dev      # Servidor en puerto 3000
npm run build    # Build producción
npm run preview  # Preview del build
```

**Variables de entorno** en `.env.local`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_GEMINI_API_KEY=tu_api_key
```

## Convenciones Clave

- **Iconos:** Lucide React con `size={20}` o `size={24}` - `import { Plus, Users } from 'lucide-react'`
- **Componentes:** Funcionales tipados `const MyComponent: React.FC = () => {}`
- **Tipos:** Definir en `src/shared/types/index.ts`, usar tipos existentes como `Agent`, `Project`, `Organization`
- **Hooks personalizados:** En `src/shared/hooks/` - `useModal`, `useForm`, `useLoading`, `useTheme`
