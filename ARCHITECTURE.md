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
│   ├── Router.tsx          # Providers globales y rutas
│   ├── guards/             # ProtectedRoute, PublicRoute, AdminGuard
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
│   └── Header/
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
    │   ├── useIsAdmin.ts
    │   ├── usePermission.ts
    │   └── useTheme.ts
    ├── api/                # Cliente API y endpoints
    │   ├── client.ts       # HTTP client con auth
    │   ├── endpoints.ts    # Definición de endpoints
    │   ├── types.ts        # Contratos del backend
    │   └── services/       # Un servicio por módulo del API
    ├── context/            # Contextos globales
    │   ├── AuthContext.tsx
    │   └── NotificationContext.tsx
    ├── config/
    │   └── constants.ts    # Rutas y claves de localStorage
    └── format.ts           # Formato de fechas, moneda y niveles
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
import { Button, Card, Badge, Input, Modal } from '../../../shared/ui';
import { useModal } from '../../../shared/hooks';

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

## 🧾 Formularios: `FormPanel` o `Modal`

| Caso | Componente |
|------|------------|
| Crear o editar un registro (cualquier formulario con campos que se guardan) | `FormPanel` + `FormSection` |
| Acción corta de uno a tres campos (aprobar, rechazar, transición, distribuir) | `Modal` con `onSubmit` |
| Confirmación | `useConfirm` |
| Visor de detalle, importación, IA y demás contenido que no es un formulario | `Modal` (`variant="drawer"` si necesita toda la altura) |

`FormPanel` (`src/shared/ui/FormPanel/`) es un panel lateral de toda la altura construido sobre `Modal variant="drawer"`: en celular ocupa la pantalla y el botón `Ampliar` lo lleva a pantalla completa (`defaultExpanded` para los formularios que no caben).

```tsx
import { FormPanel, FormSection, Input, Textarea } from '../../../shared/ui';

export const ItemFormDialog = ({ item, onClose, onSaved }: Props) => {
    const { showNotification } = useNotification();
    const [form, setForm] = useState({ name: item?.name ?? '', notes: item?.notes ?? '' });

    // Sin try/catch ni estado `saving`: si el API falla, la promesa se rechaza y el panel muestra el error.
    const save = async () => {
        await (item ? itemsService.update(item.id, form) : itemsService.create(form));
        showNotification({ type: 'success', message: 'Guardado' });
        onSaved(); // cierra el panel desde la página, sin pasar por la confirmación
    };

    return (
        <FormPanel isOpen onClose={onClose} onSubmit={save} title={item ? 'Editar item' : 'Nuevo item'}>
            <FormSection>
                <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                <div className="sm:col-span-2">
                    <Textarea label="Notas" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
            </FormSection>
        </FormPanel>
    );
};
```

Lo que el panel resuelve y el formulario no debe repetir:

- **Pie y guardado**: `Cancelar` y el botón principal (`submitText`, por defecto `Guardar`); mientras `onSubmit` está pendiente deshabilita el pie, no envía dos veces y no se deja cerrar. Botones adicionales van en `footerExtra`.
- **Errores del API**: un `ApiError` se muestra en un aviso `No se pudo guardar` arriba del formulario, con el `message` y los `errors` por campo. Los 4xx no se repiten en el aviso flotante global mientras el panel envía; los 5xx y los fallos de red salen en ambos.
- **Validación**: la nativa (`required`, `min`, `type="email"`…) con el mensaje en español bajo cada campo; `Input`, `Select` y `Textarea` marcan con `*` los obligatorios. Una regla propia se muestra con la propiedad `error` del campo.
- **Cambios sin guardar**: el panel escucha los eventos `input` y `change` de sus campos; con cambios, `Cancelar`, la X, Escape y el clic en el fondo piden confirmación. Si un control no emite esos eventos (una lista armada con botones, por ejemplo), pasa `dirty`.
- **Distribución**: `FormSection` (con `title` opcional) da una columna en celular y dos desde `sm`; un campo ocupa las dos envuelto en `<div className="sm:col-span-2">`.

Referencia: los formularios de `src/features/documents` y `e2e/form-panel.spec.ts`.

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
