import { ROUTES } from '../../shared/config/constants';

/**
 * Demo catalog: the organizations and personas loaded by DemoData.sql (API repo) and the presenter
 * script of each module. Data only: no credentials live here, the presenter types the password.
 */
export interface DemoOrganization {
    slug: string;
    name: string;
    type: string;
}

export interface DemoPersona {
    /** Local part of the email: `<key>@<slug>.example`. */
    key: string;
    label: string;
    description: string;
}

export interface DemoScript {
    key: string;
    title: string;
    /** Screen the shortcut opens; must be a route of the sidebar menu. */
    route: string;
    /** Menu permission of that screen: the script is listed only when the sidebar shows it. */
    permission: string;
    steps: string[];
}

export const DEMO_ORGANIZATIONS: DemoOrganization[] = [
    { slug: 'coopdemo', name: 'Cooperativa Demo Los Andes', type: 'Cooperativa' },
    { slug: 'fondodemo', name: 'Fondo de Empleados Demo Salud', type: 'Fondo de empleados' },
    { slug: 'mutualdemo', name: 'Mutual Demo Familia', type: 'Asociación mutual' },
];

export const DEMO_PERSONAS: DemoPersona[] = [
    { key: 'gerencia', label: 'Gerencia', description: 'Administra todo: ve y gestiona todos los módulos de la entidad.' },
    { key: 'talento', label: 'Talento', description: 'Gestión humana: personas, proyectos, actividades y horas.' },
    { key: 'calidad', label: 'Calidad', description: 'Crea, aprueba y distribuye los documentos de la entidad.' },
    { key: 'colaborador', label: 'Colaborador', description: 'Permisos base: sus actividades y los documentos que debe leer.' },
];

export const demoEmail = (persona: DemoPersona, organization: DemoOrganization): string =>
    `${persona.key}@${organization.slug}.example`;

export const DEMO_SCRIPTS: DemoScript[] = [
    {
        key: 'projects', title: 'Proyectos y sprints', route: ROUTES.PROJECTS, permission: 'menu.platform.projects',
        steps: [
            'Muestre la lista: la entidad tiene proyectos propios de su actividad en varios estados.',
            'Filtre por «En progreso» y abra uno de los proyectos.',
            'Recorra el equipo asignado y el avance por actividades.',
            'Muestre el sprint activo y su burndown frente a la línea ideal.',
        ],
    },
    {
        key: 'activities', title: 'Actividades y horas', route: ROUTES.ACTIVITIES, permission: 'menu.platform.activities',
        steps: [
            'Elija un proyecto en progreso para ver sus actividades en varios estados.',
            'Abra una actividad vencida o por vencer: responsable, prioridad y dependencias.',
            'Registre horas en una actividad y muestre el historial.',
            'Pase a «Mis actividades»: lo que la persona tiene abierto hoy.',
            'Cierre con «Reporte de horas»: totales por persona y por proyecto, con exportación.',
        ],
    },
    {
        key: 'reports', title: 'Reportes y analítica', route: ROUTES.REPORTS, permission: 'menu.platform.reports',
        steps: [
            'Muestre las métricas de equipo y la utilización.',
            'Señale «Proyectos en Riesgo»: actividades vencidas o avance por debajo del tiempo transcurrido.',
            'Cierre con la distribución de habilidades y su demanda en los proyectos.',
        ],
    },
    {
        key: 'education', title: 'Educación cooperativa', route: ROUTES.EDUCATION, permission: 'menu.solidarity.education',
        steps: [
            'Muestre los programas de formación y sus horas requeridas.',
            'Abra un programa para ver los asociados inscritos y su estado.',
            'Inscriba un asociado y muestre cómo queda registrado.',
            'Mencione que estas horas alimentan el balance social.',
        ],
    },
    {
        key: 'habeas-data', title: 'Habeas Data (ARCO)', route: ROUTES.HABEAS_DATA, permission: 'menu.solidarity.habeas_data',
        steps: [
            'Muestre las solicitudes de acceso, rectificación, cancelación y oposición con su estado.',
            'Abra una solicitud pendiente y atiéndala con una respuesta.',
            'Cree una solicitud nueva a nombre propio.',
            'Enlace con «Políticas de datos»: la política vigente y su consentimiento.',
        ],
    },
    {
        key: 'assistant', title: 'Asistente IA', route: ROUTES.ASISTENTE, permission: 'menu.solidarity.assistant',
        steps: [
            'Haga una consulta normativa, por ejemplo sobre educación cooperativa (Ley 79 de 1988).',
            'Cambie a «Verificar Cumplimiento» y muestre fortalezas y alertas.',
            'Genere el balance social con recomendaciones.',
            'Aclare que el asistente responde con los datos de la entidad en sesión.',
        ],
    },
    {
        key: 'documents', title: 'Control documental', route: ROUTES.DOCUMENTS, permission: 'menu.documents.master_list',
        steps: [
            'Muestre el listado: documentos de la entidad en borrador, en revisión, aprobados y obsoletos.',
            'Abra un documento aprobado: versión vigente, historial de versiones y descarga del archivo.',
            'Con Calidad, suba una versión nueva y envíela a revisión.',
            'Con Gerencia, apruébela: quien elabora no aprueba y la versión anterior pasa a obsoleta.',
            'Distribuya el documento y muestre quién confirmó la lectura.',
            'Entre como Colaborador y confirme una lectura pendiente.',
        ],
    },
];
