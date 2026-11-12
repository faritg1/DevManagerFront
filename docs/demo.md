# Modo demo

Sirve para presentar el sistema con datos de prueba: una entrada para elegir entidad y persona, y un guion por módulo a la mano mientras se muestra la pantalla.

Está **apagado por defecto**. Solo existe cuando la aplicación arranca o se compila con `VITE_DEMO_MODE=true`. Con cualquier otro valor no hay ruta `#/demo`, no se muestra nada nuevo y el código del modo demo no entra en el paquete.

## 1. Cargar los datos

Los datos salen del repositorio del API (`DevManagerAPI`), y solo se cargan en la base **local**:

1. `Infrastructure/Database/Seeders/DemoData.sql` crea las tres entidades, sus personas y los datos de cada módulo.
2. `Infrastructure/Database/Seeders/DemoDocumentFiles.mjs` crea en disco los archivos del control documental.

El paso a paso y la limpieza están en `Infrastructure/Database/SETUP_DATABASE.md` del API. La carga se puede repetir sin duplicar datos.

## 2. Encender el modo

Con el API local corriendo en el puerto 5073:

```bash
VITE_DEMO_MODE=true VITE_API_URL=http://localhost:5073/api VITE_AGENT_URL=http://localhost:5073 npm run dev
```

En PowerShell:

```powershell
$env:VITE_DEMO_MODE='true'; $env:VITE_API_URL='http://localhost:5073/api'; $env:VITE_AGENT_URL='http://localhost:5073'; npm run dev
```

También se pueden poner las tres variables en `.env`. La variable se lee al arrancar: si la cambias, reinicia `npm run dev`.

No lo enciendas en producción: la entrada `#/demo` muestra los correos de las personas de prueba.

## 3. Entrar

1. Abre `http://localhost:3000/#/demo`.
2. Elige la entidad y la persona.
3. Escribe la contraseña. Es la que indica la documentación de los datos de prueba (`Infrastructure/Database/SETUP_DATABASE.md` del API); el front no la guarda ni la trae escrita.
4. «Iniciar sesión demo» usa el mismo inicio de sesión de siempre y abre la aplicación.

Para cambiar de persona vuelve a `#/demo` (o usa «Cambiar de persona» en el guion): el nuevo inicio de sesión reemplaza al anterior.

### Entidades

| Entidad | Tipo | Dominio de los correos |
|---|---|---|
| Cooperativa Demo Los Andes | Cooperativa | `coopdemo.example` |
| Fondo de Empleados Demo Salud | Fondo de empleados | `fondodemo.example` |
| Mutual Demo Familia | Asociación mutual | `mutualdemo.example` |

### Personas

Son las mismas cuatro en cada entidad. El correo es `<persona>@<dominio>`, por ejemplo `calidad@fondodemo.example`.

| Persona | Correo | Qué puede hacer |
|---|---|---|
| Gerencia | `gerencia@<dominio>` | Administra todo: ve y gestiona todos los módulos de la entidad |
| Talento | `talento@<dominio>` | Gestión humana: personas, proyectos, actividades y horas |
| Calidad | `calidad@<dominio>` | Crea, aprueba y distribuye los documentos de la entidad |
| Colaborador | `colaborador@<dominio>` | Permisos base: sus actividades y los documentos que debe leer |

## 4. El guion

Con el modo encendido aparece una franja «Modo demo» bajo el encabezado, con el botón **Guion de demo**. Abre un panel con:

- los pasos del módulo que estás mostrando, y
- la lista de módulos con guion, que sirve de acceso directo.

Solo se listan los módulos que la persona puede abrir (la misma regla del menú lateral). El panel se cierra con `Esc` o con «Cerrar». La «X» de la franja la oculta hasta recargar la página.

Tienen guion los módulos que la guía de la aplicación marca como **Conservar**, y el control documental siempre.

### Proyectos y sprints (`#/projects`, permiso `menu.platform.projects`)

1. Muestre la lista: la entidad tiene proyectos propios de su actividad en varios estados.
2. Filtre por «En progreso» y abra uno de los proyectos.
3. Recorra el equipo asignado y el avance por actividades.
4. Muestre el sprint activo y su burndown frente a la línea ideal.

### Actividades y horas (`#/activities`, permiso `menu.platform.activities`)

1. Elija un proyecto en progreso para ver sus actividades en varios estados.
2. Abra una actividad vencida o por vencer: responsable, prioridad y dependencias.
3. Registre horas en una actividad y muestre el historial.
4. Pase a «Mis actividades»: lo que la persona tiene abierto hoy.
5. Cierre con «Reporte de horas»: totales por persona y por proyecto, con exportación.

### Reportes y analítica (`#/reports`, permiso `menu.platform.reports`)

1. Muestre las métricas de equipo y la utilización.
2. Señale «Proyectos en Riesgo»: actividades vencidas o avance por debajo del tiempo transcurrido.
3. Cierre con la distribución de habilidades y su demanda en los proyectos.

### Educación cooperativa (`#/education`, permiso `menu.solidarity.education`)

1. Muestre los programas de formación y sus horas requeridas.
2. Abra un programa para ver los asociados inscritos y su estado.
3. Inscriba un asociado y muestre cómo queda registrado.
4. Mencione que estas horas alimentan el balance social.

### Habeas Data (ARCO) (`#/habeas-data`, permiso `menu.solidarity.habeas_data`)

1. Muestre las solicitudes de acceso, rectificación, cancelación y oposición con su estado.
2. Abra una solicitud pendiente y atiéndala con una respuesta.
3. Cree una solicitud nueva a nombre propio.
4. Enlace con «Políticas de datos»: la política vigente y su consentimiento.

### Asistente IA (`#/asistente`, permiso `menu.solidarity.assistant`)

1. Haga una consulta normativa, por ejemplo sobre educación cooperativa (Ley 79 de 1988).
2. Cambie a «Verificar Cumplimiento» y muestre fortalezas y alertas.
3. Genere el balance social con recomendaciones.
4. Aclare que el asistente responde con los datos de la entidad en sesión.

### Control documental (`#/documentos`, permiso `menu.platform.documents`)

1. Muestre el listado: documentos de la entidad en borrador, en revisión, aprobados y obsoletos.
2. Abra un documento aprobado: versión vigente, historial de versiones y descarga del archivo.
3. Con Calidad, suba una versión nueva y envíela a revisión.
4. Con Gerencia, apruébela: quien elabora no aprueba y la versión anterior pasa a obsoleta.
5. Distribuya el documento y muestre quién confirmó la lectura.
6. Entre como Colaborador y confirme una lectura pendiente.

## Cambiar el catálogo o los guiones

Todo está en `src/features/demo/catalog.ts`: entidades, personas y guiones son datos. Cada guion lleva su ruta y su permiso de menú; si cambias un guion, actualiza también esta página.

## Fuera del guion

- **Plataforma y superadministrador**: la guía lo marca como Conservar, pero ninguna persona de demo es superadministradora, así que no tiene guion.
- Los módulos marcados como Terminar o Congelar (asociados, balance social, nómina, órganos, bienestar, excedentes, reportes Supersolidaria, SST) no tienen guion. Siguen en el menú para quien tenga el permiso.

## Datos que trae cada entidad

| Entidad | Proyectos en progreso | Lecturas pendientes del colaborador |
|---|---|---|
| Cooperativa Demo Los Andes | Asamblea General Ordinaria de Delegados, Implementación del SARLAFT | MAN-SAR-001, MAN-SST-001 |
| Fondo de Empleados Demo Salud | Feria de vivienda y educación, Convenio de libranza con la entidad patronal | REG-CRE-001, PLA-EME-001 |
| Mutual Demo Familia | Nuevo plan exequial familiar | REG-AUX-001 |

En cada entidad hay una versión en revisión elaborada por Calidad, que aprueba Gerencia, y otra elaborada por Gerencia, que aprueba Calidad.

Después de una demo, los datos vuelven a su estado inicial ejecutando `DemoData_Cleanup.sql` y luego `DemoData.sql` y `DemoDocumentFiles.mjs` (repositorio del API). La limpieza borra todo lo creado dentro de las tres entidades de demostración.
