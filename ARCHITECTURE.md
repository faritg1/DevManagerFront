# DevManager Frontend - Arquitectura Modular

## 📐 Arquitectura Feature-Sliced Design (FSD)

Este proyecto utiliza una arquitectura **Feature-Sliced Design** adaptada, que es más apropiada para aplicaciones React modernas que "Steam Architecture". Esta arquitectura es:

- **Escalable**: Fácil de agregar nuevas features sin afectar las existentes
- **Mantenible**: Cada feature es autocontenida y fácil de entender
- **Testeable**: Componentes y lógica claramente separados
- **Integrable**: Preparada para conectar con backend .NET

## 📁 Estructura de Carpetas

```
src/
├── app/                    # Capa de aplicación
│   ├── App.tsx             # Componente raíz
│   ├── Router.tsx          # Configuración de rutas
│   └── layouts/            # Layouts de la aplicación
│       ├── MainLayout.tsx  # Layout principal (con sidebar)
│       └── AuthLayout.tsx  # Layout para auth (login/register)
│
├── features/               # Features/módulos del dominio
│   ├── auth/               # Autenticación
│   │   └── pages/
│   │       ├── LoginPage.tsx
│   │       └── RegisterPage.tsx
│   ├── dashboard/          # Dashboard principal
│   ├── projects/           # Gestión de proyectos
│   ├── agents/             # Gestión de agentes IA ⭐
│   ├── organizations/      # Gestión de organizaciones
│   ├── users/              # Gestión de usuarios
│   └── index.ts            # Barrel export
│
├── widgets/                # Componentes complejos reutilizables
│   ├── Sidebar/
│   ├── Header/
│   └── index.ts
│
└── shared/                 # Código compartido
    ├── ui/                 # Componentes UI atómicos
    │   ├── Button/
    │   ├── Input/
    │   ├── Card/
    │   ├── Badge/
    │   ├── Avatar/
    │   ├── Modal/
    │   ├── ProgressBar/
    │   └── StatCard/
    ├── hooks/              # Hooks reutilizables
    │   ├── useModal.ts
    │   ├── useForm.ts
    │   ├── useLoading.ts
    │   └── useTheme.ts
    ├── api/                # Cliente API y endpoints
    │   ├── client.ts       # HTTP client con auth
    │   └── endpoints.ts    # Definición de endpoints
    ├── services/           # Servicios externos (Gemini AI)
    ├── context/            # Contextos globales
    │   ├── AuthContext.tsx
    │   └── NotificationContext.tsx
    ├── config/             # Configuración y constantes
    │   ├── constants.ts    # Rutas, estados, roles
    │   └── env.ts          # Variables de entorno
    ├── utils/              # Utilidades
    │   ├── helpers.ts      # Funciones helper
    │   ├── date.ts         # Formateo de fechas
    │   └── validation.ts   # Validadores de forms
    └── types/              # Tipos TypeScript globales
```

## 🔧 Capas de la Arquitectura

### 1. **App Layer** (`src/app/`)
- Punto de entrada de la aplicación
- Configuración del router
- Providers globales (Auth, Notifications)
- Layouts de la aplicación

### 2. **Features Layer** (`src/features/`)
- Cada feature es un módulo autocontenido
- Contiene sus propias pages, components, hooks, etc.
- Se comunica con otras capas solo a través de imports explícitos

### 3. **Widgets Layer** (`src/widgets/`)
- Componentes complejos que combinan múltiples UI components
- Pueden tener lógica de negocio específica
- Reutilizables entre features

### 4. **Shared Layer** (`src/shared/`)
- Código reutilizable en toda la aplicación
- NO tiene dependencias hacia capas superiores
- Incluye: UI, hooks, API, utilidades

## 🔌 Integración con Backend .NET

### Configuración del API Client

```typescript
// src/shared/api/client.ts
const apiClient = new ApiClient({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Uso en features
const { data } = await apiClient.get<Project[]>(API_ENDPOINTS.PROJECTS.BASE);
```

### Endpoints preparados para .NET

```typescript
// src/shared/api/endpoints.ts
export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
    },
    AGENTS: {
        BASE: '/agents',
        EXECUTE: (id: string) => `/agents/${id}/execute`,
    },
    // ... más endpoints
};
```

## 🤖 Sistema de Agentes IA

El proyecto está diseñado para gestionar **agentes inteligentes**:

```typescript
// Tipos para agentes
interface Agent {
    id: string;
    name: string;
    type: 'assistant' | 'analyzer' | 'automator' | 'monitor';
    status: 'Active' | 'Inactive' | 'Training' | 'Error';
    configuration: AgentConfiguration;
    metrics?: AgentMetrics;
}
```

## 📦 Uso de Componentes UI

```tsx
import { Button, Card, Badge, Input, Modal } from '@shared/ui';
import { useModal, useForm } from '@shared/hooks';

const MyComponent = () => {
    const { isOpen, open, close } = useModal();
    
    return (
        <Card hoverable>
            <Badge variant="success" dot>Active</Badge>
            <Button icon={Plus} onClick={open}>Crear</Button>
            <Modal isOpen={isOpen} onClose={close} title="Nuevo Item">
                <Input label="Nombre" />
            </Modal>
        </Card>
    );
};
```

## 🚀 Scripts Disponibles

```bash
npm run dev      # Servidor de desarrollo (puerto 3000)
npm run build    # Build de producción
npm run preview  # Preview del build
```

## 📝 Variables de Entorno

Crea un archivo `.env.local`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GEMINI_API_KEY=tu_api_key_aqui
```

## 🔄 Flujo de Datos

```
User Action → Feature Page → API Client → .NET Backend
                    ↓
              Context/State
                    ↓
              UI Components
```

## ✅ Beneficios de esta Arquitectura

1. **Separación de concerns**: Cada capa tiene una responsabilidad clara
2. **Escalabilidad**: Agregar nuevas features no afecta las existentes
3. **Reusabilidad**: Componentes UI y hooks compartidos
4. **Type Safety**: TypeScript en toda la aplicación
5. **Preparado para testing**: Fácil de mockear dependencias
6. **Integración limpia**: API layer preparado para .NET backend
