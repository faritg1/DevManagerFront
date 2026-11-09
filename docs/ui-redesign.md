# Rediseño visual de DevManager: diagnóstico, propuesta (fase 1) y aplicación (fase 2)

Documento de entrada para la fase 2. Es pulido dentro del sistema actual: se conservan la paleta (azul `#1392ec`, neutros slate, fondos `#f6f7f8` / `#111b22`), la tipografía Inter, los componentes de `src/shared/ui` y la escala de espaciado de Tailwind. Solo se ajusta lo que falla WCAG AA o lo que rompe la consistencia. No se cambia ninguna regla de negocio, permiso, endpoint ni texto que usen las pruebas e2e.

## 0. Supuestos declarados

Edwin dejó estos campos en blanco; la propuesta asume:

- **Usuarios:** equipos de gestión humana, coordinadores de proyectos y calidad, gerentes y asociados de cooperativas y fondos de empleados. Uso diario en escritorio y consulta en móvil.
- **Tono:** limpio, confiable, corporativo pero cercano.
- **Referencia:** el estándar visual de Linear.app y Vercel: superficies planas, bordes finos, poca sombra, tipografía con jerarquía clara, color reservado para estado y acción.

Evidencia visual: capturas en `C:\Users\DESARR~1\AppData\Local\Temp\claude\34e734c8fb32f4c9\f3115e9a-7333-4b3d-b04d-16f4450862f2\scratchpad\ui\` con el nombre `<pantalla>-<desk|movil>-<light|dark>-<admin|carolina>.png` (login: `login-<desk|movil>-<light|dark>.png`; cajón móvil: `menu-movil-movil-light-admin.png`). La app usa `HashRouter`, así que las rutas son `/#/dashboard`, `/#/documentos`, etc.

---

## 1. Inventario del sistema actual

### 1.1 Tokens

| Token | Valor | Dónde |
|---|---|---|
| `primary` | `#1392ec` | `tailwind.config.js:10` |
| `primary-dark` | `#0f7bc2` | `tailwind.config.js:11` |
| `background-light` / `background-dark` | `#f6f7f8` / `#111b22` | `tailwind.config.js:12-13` |
| `surface-dark` / `card-dark` | `#192833` / `#16222b` | `tailwind.config.js:14-15` |
| `border-dark` / `input-border` | `#233948` / `#325167` | `tailwind.config.js:16-17` |
| `text-muted` = `text-secondary` | `#92b2c9` (duplicados) | `tailwind.config.js:18-19` |
| Fuentes | `display: Inter`, `body: Noto Sans` (Noto se descarga y no se usa: 0 usos de `font-body`) | `tailwind.config.js:22-25`, `index.html:19` |
| Modo oscuro | `darkMode: 'class'`, clase en `<html>` | `tailwind.config.js:5`, `src/shared/hooks/useTheme.ts:10-12` |
| Foco global | `outline 2px #1392ec, offset 2px` | `src/index.css:18-22` |
| Tabla responsive (<768 px) | filas como tarjetas `label: valor` | `src/index.css:37-57` |

No existen tokens de espaciado, radio, sombra ni movimiento: todo son utilidades de Tailwind escritas a mano. Recuento en `src/**/*.tsx`: `rounded-xl` 99, `rounded-lg` 45, `rounded-2xl` 25; `shadow-lg|xl|2xl` 23; `text-slate-500` 310; `text-primary` 138; `text-rose-500` 33; `text-emerald-500` 32; `text-[10px]|[11px]` 6.

### 1.2 Componentes compartidos

| Componente | Archivo | Observación |
|---|---|---|
| Button (6 variantes, 3 tamaños) | `src/shared/ui/Button/Button.tsx:17-30,48` | Primario `bg-primary` + `shadow-lg shadow-primary/25`; `active:scale-95`; `sm` h-8, `md` h-10 |
| IconButton | `src/shared/ui/IconButton/IconButton.tsx:442` | `size-9` (36 px) |
| Input / Select / Textarea | `src/shared/ui/Input/Input.tsx:298-302,332-343`; `src/shared/ui/formStyles.ts:197-203` | Input `md` h-12, `SELECT_SM` h-10, foco `ring-1` |
| Card (+ variante `gradient`) | `src/shared/ui/Card/Card.tsx:136-160` | `hoverable` = `-translate-y-1 shadow-xl` |
| StatCard | `src/shared/ui/StatCard/StatCard.tsx:34` | Hover con sombra aunque no es clicable |
| Badge (6 variantes) | `src/shared/ui/Badge/Badge.tsx:81-88` | Pastilla con borde |
| Modal (dialog / drawer) | `src/shared/ui/Modal/Modal.tsx:94-182` | Sin animación de entrada; cierre `p-2` (36 px) |
| Toasts | `src/shared/context/NotificationContext.tsx:35-73` | Arriba a la derecha; botón cerrar `p-1` (24 px); sin animación |
| PageContainer / PageHeader / EmptyState / LoadingBlock / BackButton | `src/shared/ui/Page/Page.tsx` | Estándar ya usado en 28 archivos (EmptyState) |
| Clases de tabla | `src/shared/ui/tableStyles.ts:206-215` | 23 páginas usan `TABLE_CLASS` |
| Avatar | `src/shared/ui/Avatar/Avatar.tsx:34,52` | Degradado `from-primary to-primary-dark` |

### 1.3 Layout

- Shell: `src/app/layouts/MainLayout.tsx:20-33`. Sidebar fija `w-64`/`w-20` en md+ y cajón `w-72` en móvil (`src/widgets/Sidebar/Sidebar.tsx:371,389`). El scroll vive en `<main>` (`MainLayout.tsx:30`), no en `body`.
- Header: `h-16`, translúcido con `backdrop-blur` (`src/widgets/Header/Header.tsx:106`). Migas en escritorio, título en móvil, buscador Ctrl+K, tema y campana.
- Auth: `src/app/layouts/AuthLayout.tsx`; login con dos manchas difuminadas animadas (`src/features/auth/pages/LoginPage.tsx:38-41`).

### 1.4 Patrones de pantalla observados

`PageHeader` (h1 + descripción + acciones) → filtros en `Card` → tabla con `TABLE_CLASS` o rejilla de tarjetas → `Pager`. Los estados vacíos usan `EmptyState`; la carga usa spinner centrado (`LoadingBlock`, `Page.tsx:124-129`), sin esqueletos salvo el menú lateral.

---

## 2. Diagnóstico priorizado

Contrastes medidos con la fórmula WCAG 2.x (luminancia relativa). Texto normal requiere 4.5:1; texto grande (≥ 24 px, o ≥ 18.66 px en negrita) y componentes de interfaz requieren 3:1.

### P1. Alto impacto

| # | Hallazgo | Medición | Evidencia |
|---|---|---|---|
| 1 | **El azul de marca no pasa AA como fondo de botón con texto blanco ni como texto en modo claro.** Afecta al CTA principal de cada pantalla, a los enlaces (códigos de documento, «Ver todas», «¿Olvidaste tu contraseña?») y al ítem activo del menú. | blanco sobre `#1392ec` **3.31** ✗; `#1392ec` sobre blanco **3.31** ✗; sobre `#f6f7f8` **3.08** ✗; ítem activo (`primary` sobre `primary/10`) **2.95** ✗ | `Button.tsx:18`, `Sidebar.tsx:79`, 138 usos de `text-primary` |
| 2 | **Texto secundario sobre el fondo de página falla por poco.** Las descripciones de `PageHeader` y otros textos `slate-500` sobre `#f6f7f8`. | `#64748b` sobre `#f6f7f8` **4.44** ✗ (sobre blanco 4.76 ✓) | `Page.tsx:249` (la descripción de cada página) |
| 3 | **Colores de estado como texto no pasan AA en claro.** Errores de campo, tendencias de KPI y avisos. Los botones danger y success tampoco. | `rose-500` **3.67** ✗; `emerald-500` **2.54** ✗; `amber-600` **3.19** ✗; blanco sobre `rose-500` **3.67** ✗; blanco sobre `emerald-600` **3.77** ✗ | `Input.tsx:287`, `StatCard.tsx:50,54`, `Button.tsx:21-22`, `NotificationBell` (badge rose-500) |
| 4 | **El borde de los campos no alcanza 3:1** (WCAG 1.4.11). En claro, el input es `slate-50` sobre tarjeta blanca y solo lo delimita el borde; en oscuro pasa igual. | `slate-300` sobre `slate-50` **1.42** ✗; oscuro `#233948` sobre `#111b22` **1.45** ✗; el token `input-border #325167` da **2.08** ✗ | `Input.tsx:334`, `formStyles.ts:198-203` |
| 5 | **Placeholder en oscuro ilegible.** | `slate-500` sobre `#111b22` **3.67** ✗ | `Input.tsx:337`, `formStyles.ts:203` |
| 6 | **Áreas táctiles menores de 44 px en móvil** (medidas con Playwright a 390 px). Header: abrir menú 40, buscar / tema / campana 36. Botones de página `md` 40, `sm` 32 (Exportar, Nuevo documento, Anterior/Siguiente). Editar fila 36. Mostrar contraseña 36. Enlaces de código en tabla 20 de alto. Toast cerrar 24. Ítems del cajón 40; encabezados de sección 32. | ver captura `menu-movil-movil-light-admin.png` | `Header.tsx:111,168,174`, `IconButton.tsx:442`, `Button.tsx:27-28`, `NotificationContext.tsx:65`, `Sidebar.tsx:77,133` |
| 7 | **Degradados saturados genéricos** contrarios a la directriz: avatares de proyecto (morado→rosa, naranja→amarillo…), logo de organización, barras de Reportes IA y manchas difuminadas del login. Compiten con los badges de estado y no comunican nada. | — | `src/features/projects/utils/projectAvatar.ts:1-8`, `ProjectCard.tsx:30`, `ProjectDetailPage.tsx:203`, `OrganizationsPage.tsx:192`, `ReportsPage.tsx:193,314,409,443`, `LoginPage.tsx:38-41`, `Avatar.tsx:34,52`, `Card.tsx:140` |
| 8 | **Tabla de Documentos cortada a 1280 px.** Se ven 5 de 9 columnas; Vigente, Aprobación, En curso y Acciones quedan fuera, con scroll horizontal oculto. Es la pantalla central del control documental. | `documentos-desk-light-admin.png` | `src/features/documents/DocumentsPage.tsx:136-153`, `tableStyles.ts:206,209,213` (`whitespace-nowrap`, `px-4 py-4`) |

### P2. Jerarquía, densidad y consistencia

9. **Botones primarios anidados en enlaces** (`<a><button>`): dos tabulaciones para una acción y rol ambiguo para lectores de pantalla. También explica el «Nuevo Proyecto» duplicado que aparece en la auditoría táctil. Archivos: `DashboardPage.tsx:88-89,227`, `ProjectsPage.tsx:86,131`, `ProjectActivitiesSection.tsx:34`.
10. **Las tarjetas que no son clicables parecen clicables.** `StatCard` cambia borde y sombra en hover (`StatCard.tsx:34`); en `dashboard-desk-light-carolina.png` la tarjeta de Excedentes aparece «levantada». `Card hoverable` además se desplaza 4 px (`Card.tsx:159`), lo que pesa visualmente en rejillas de 9 tarjetas.
11. **Sombras de color en los botones** (`shadow-primary/25`, `shadow-rose-500/25`, `Button.tsx:18,21-22`): el CTA «brilla» en cada pantalla; es el efecto de IA genérica que Edwin quiere evitar y resta foco al contenido.
12. **Alturas de control inconsistentes en una misma fila.** Proyectos: buscador h-12 junto a botones h-10 (`proyectos-desk-light-admin.png`). Documentos: filtros h-12 y acciones de cabecera `sm` h-8 (`DocumentsPage.tsx:87,110-112`). Asociados: buscador 36 y select 40.
13. **Semántica de color sobrecargada en tarjetas de proyecto.** «Complejidad: Baja/Media/Alta» usa verde, naranja y rojo, los mismos colores del estado. Una tarjeta con «En progreso» naranja y «Complejidad: Media» naranja no se lee de un vistazo (`ProjectCard.tsx`, `proyectos-desk-light-admin.png`).
14. **El dashboard móvil cuesta 3 pantallas de scroll antes de mostrar trabajo.** Los tres KPI principales ocupan cada uno el ancho completo y unos 130 px de alto (`dashboard-movil-light-admin.png`, `DashboardPage.tsx:95`).
15. **En móvil, la acción principal de la página queda en último lugar.** En Asociados, «Nuevo asociado» cae en una tercera fila bajo «Preguntar a la IA» e «Importar CSV» (`asociados-movil-light-admin.png`, `Page.tsx:252`).
16. **Las tarjetas de la tabla responsive desalinean la etiqueta del valor.** La etiqueta abarca 10 filas (`grid-row: 1 / span 10`) y se centra verticalmente, así que «NOMBRE» queda más abajo que el nombre (`index.css:51`, `asociados-movil-light-admin.png`).
17. **Menú lateral largo y plano.** El admin ve unos 30 ítems con todas las secciones abiertas: el ítem activo se pierde y «Cerrar sesión» queda lejos. El ítem activo usa fondo, borde y sombra a la vez (`Sidebar.tsx:79`), mientras que en el resto de la app el foco visual es más sobrio.
18. **En modo oscuro, tarjeta y fondo apenas se distinguen.** `card-dark` frente a `background-dark` da **1.08**; `surface-dark` frente al fondo, **1.16**. Todo depende del borde `#233948`. Los modales usan `card-dark`, igual que las tarjetas que tapan, así que no hay elevación perceptible.
19. **Migas de pan:** la página actual se pinta igual que las anteriores (`slate-500`, `Header.tsx:136`), cuando debería ser el elemento más fuerte.
20. **Textos de 10–11 px** (6 usos, p. ej. `StatCard.tsx:36` en modo compacto): en móvil son ilegibles.

### P3. Estados y micro-interacciones

21. **Carga:** spinner centrado en todas las tablas y listas (`LoadingBlock`). El salto de layout al llegar los datos es grande. Solo el menú tiene esqueleto (`Sidebar.tsx:307-309`).
22. **Error:** no hay un componente compartido de estado de error; cada página improvisa. `StatCard` sí tiene `error` (`StatCard.tsx:49-52`), pero en ámbar 3.19 ✗.
23. **Vacío:** `EmptyState` está bien resuelto y se usa en 28 archivos. Solo falla el contraste del icono (`slate-400` 2.56, decorativo, aceptable) y la descripción en `slate-500` sobre `#f6f7f8` cuando no está dentro de una tarjeta.
24. **Foco visible:** existe y es correcto en escritorio (`index.css:18-22` y `focus-visible:ring-2` en componentes). Hay dos fallos: el foco de inputs es `ring-1` (1 px, poco perceptible) y el anillo `#1392ec` sobre blanco da 3.31, que pasa 3:1 pero justo.
25. **Movimiento:** Modal y toasts aparecen sin transición; `Card` se desplaza 4 px; `active:scale-95` es exagerado en botones anchos. No hay ninguna regla global de `prefers-reduced-motion`: solo el login la aplica, en una animación (`LoginPage.tsx:39`).
26. **Fuente sin uso:** Noto Sans se descarga en cada carga (`index.html:19`) sin ningún uso.

---

## 3. Sistema de diseño propuesto

### 3.1 Color

Regla general: **el azul de marca `#1392ec` se conserva como acento** (logo, iconos, anillo de foco, rellenos de progreso, selección y texto en modo oscuro). Para **texto azul y botones sólidos en modo claro** se usa un tono más oscuro de la misma familia. Así se conserva la identidad y se cumple AA.

#### Modo claro

| Rol | Token Tailwind (fase 2) | HEX | Contraste / nota |
|---|---|---|---|
| Fondo de página | `background-light` | `#f6f7f8` | sin cambio |
| Superficie (tarjeta, sidebar, header, modal) | `white` | `#ffffff` | sin cambio |
| Superficie hundida (input, thead, hover de fila) | `slate-50` | `#f8fafc` | sin cambio |
| Borde decorativo (tarjetas, divisores) | `slate-200` | `#e2e8f0` | decorativo, sin requisito |
| **Borde de control** (input, select, textarea) | `control-border` **nuevo** | `#8492a6` | 3.02 sobre slate-50, 3.16 sobre blanco ✓ (antes 1.42 ✗) |
| Texto principal | `slate-900` | `#0f172a` | 17.9 ✓ |
| **Texto secundario** (descripciones, metadatos) | `slate-600` | `#475569` | 7.58 sobre blanco, ≈7.0 sobre `#f6f7f8` ✓ (sustituye a slate-500 fuera de superficies blancas) |
| Texto terciario (solo sobre blanco o slate-50) | `slate-500` | `#64748b` | 4.76 / 4.55 ✓; **prohibido sobre `#f6f7f8`** (4.44) |
| Deshabilitado / icono decorativo | `slate-400` | `#94a3b8` | exento (inactivo o decorativo); nunca para texto informativo |
| Acento de marca | `primary` | `#1392ec` | iconos, foco, rellenos |
| **Acción / enlace** (botón sólido, texto azul, ítem activo) | `primary-600` **nuevo** | `#0b6fb8` | blanco sobre él 5.28 ✓; como texto sobre blanco 5.28 ✓; sobre `primary/10` 4.71 ✓ |
| Acción hover / pressed | `primary-700` **nuevo** | `#0a5f9e` | blanco 6.68 ✓ |
| Fondo de acento suave (ítem activo, info) | `primary/10` | ≈`#e7f4fd` | — |
| Éxito: texto / sólido | `emerald-700` | `#047857` | 5.48 ✓ (antes emerald-500/600 ✗) |
| Éxito: fondo suave | `emerald-100` | `#d1fae5` | texto emerald-700 4.84 ✓ |
| Aviso: texto | `amber-700` | `#b45309` | 5.02 ✓ (antes amber-600 3.19 ✗) |
| Aviso: fondo suave (badge) | `orange-100` + texto `orange-700` | `#ffedd5` / `#c2410c` | 4.52 ✓ (sin cambio) |
| Peligro: texto / sólido | `rose-600` | `#e11d48` | 4.70 ✓ (antes rose-500 3.67 ✗) |
| Peligro hover | `rose-700` | `#be123c` | — |
| Peligro: fondo suave | `rose-100` + texto `rose-700` | `#ffe4e6` / `#be123c` | 5.24 ✓ |
| Info (badge) | `blue-100` + `blue-700` | `#dbeafe` / `#1d4ed8` | 5.49 ✓ |
| Neutro (badge) | `slate-100` + `slate-700` | `#f1f5f9` / `#334155` | 9.45 ✓ |

#### Modo oscuro

| Rol | Token | HEX | Contraste / nota |
|---|---|---|---|
| Fondo de página, sidebar, header | `background-dark` | `#111b22` | sin cambio |
| Superficie (tarjeta) | `card-dark` | `#16222b` | sin cambio |
| **Superficie elevada** (modal, popover, menú, toast, paleta Ctrl+K) | `surface-dark` | `#192833` | ya existe; se reserva para elevación (hallazgo 18) |
| Borde decorativo | `border-dark` | `#233948` | sin cambio |
| **Borde de control** | `input-border` (**ajustado**) | `#325167` → **`#4a6d8c`** | 3.20 sobre `#111b22` ✓ (antes 2.08 ✗) |
| Texto principal | `white` / `slate-100` | `#ffffff` / `#f1f5f9` | ≥15 ✓ |
| Texto secundario | `slate-400` | `#94a3b8` | 6.31 sobre card, 6.80 sobre fondo ✓ |
| **Placeholder** | `slate-400` | `#94a3b8` | 6.80 ✓ (antes slate-500 3.67 ✗) |
| Texto terciario | `text-muted` | `#92b2c9` | 7.27 ✓; eliminar el alias duplicado `text-secondary` |
| Prohibido como texto | `slate-500` | `#64748b` | 3.40 sobre card ✗ |
| Acento y texto azul | `primary` | `#1392ec` | 5.28 sobre fondo, 4.89 sobre card ✓ |
| Texto azul hover | `primary-400` **nuevo** | `#3aa3f0` | 6.38 ✓ |
| Botón sólido | `primary-600` → hover `primary-700` | `#0b6fb8` / `#0a5f9e` | blanco 5.28 / 6.68 ✓ (la misma regla que en claro) |
| Estado: texto sobre fondo `x-500/10` | `emerald-400`, `amber-400`, `rose-400`, `blue-400`, `purple-400` | — | 7.18 / 9.69 / 5.52 / 5.60 / 5.52 ✓ (sin cambio) |

> Únicos cambios de paleta: se añaden `primary-600`, `primary-700`, `primary-400` y `control-border`; se oscurece `input-border`; se elimina el alias `text-secondary`. Todo lo demás son tonos de Tailwind que la app ya usa.

### 3.2 Tipografía

Familia única: **Inter** (`font-display`). Se elimina la carga de Noto Sans en `index.html:19` y su entrada en `tailwind.config.js:24`. Se activan los números tabulares en cifras (`tabular-nums`, ya presente en StatCard).

| Rol | Clase Tailwind | Tamaño / interlineado | Peso | Uso |
|---|---|---|---|---|
| Display (h1 de página) | `text-2xl sm:text-[28px] leading-8 sm:leading-9 tracking-tight` | 24/32 → 28/36 | 800 (`font-extrabold`) | `PageHeader` (hoy `font-black` 900 a 30 px) |
| h2 de sección | `text-lg leading-7` | 18/28 | 700 | títulos de bloque («Mis actividades», «Versiones») |
| h3 de tarjeta | `text-base leading-6` | 16/24 | 600 | `CardTitle`, título de modal en móvil |
| Cuerpo | `text-sm leading-5` (escritorio), `text-base leading-6` en formularios | 14/20 y 16/24 | 400 | texto general; los inputs se quedan en 16 px para evitar el zoom de iOS |
| Interfaz (botón, nav, tabla) | `text-sm leading-5` | 14/20 | 500 nav y tabla, 600 botón | el botón baja de 700 a 600 |
| Meta / ayuda | `text-[13px] leading-[18px]` | 13/18 | 400 | fechas, «Elaboró…», hints |
| Overline (encabezado de tabla, sección de menú, etiqueta de KPI) | `text-xs leading-4 uppercase tracking-wider` | 12/16 | 600 | hoy 700 |
| Cifra KPI | `text-3xl leading-9 tabular-nums` (`text-2xl` compacto) | 30/36 | 700 | StatCard |

Regla: **mínimo 12 px** en toda la app (eliminar `text-[10px]` y `text-[11px]`).

### 3.3 Espaciado

Base de 4 px (escala de Tailwind, sin cambios). Ritmo fijo:

| Uso | Valor |
|---|---|
| Padding de página | `p-4` móvil / `sm:p-6` / `md:p-8` (hoy `md:p-10`: se gana ancho para tablas a 1280) |
| Separación entre bloques de página | `gap-6` (24) |
| Separación dentro de un bloque / rejilla de tarjetas | `gap-4` (16) |
| Padding de tarjeta | `p-5` (20) estándar, `p-4` compacta y en móvil |
| Celda de tabla | `px-4 py-3` (antes `py-4`): filas de 48 px |
| Separación label → control | `gap-1.5` (6) |
| Separación entre campos de formulario | `gap-4` |

### 3.4 Radios

| Token | Valor | Uso |
|---|---|---|
| `rounded-md` | 6 px | kbd, chips pequeños |
| `rounded-lg` | 8 px | IconButton, ítems de menú, inputs compactos |
| `rounded-xl` | 12 px | botones, inputs, selects, toasts, ítems de navegación |
| `rounded-2xl` | 16 px | tarjetas, modales, paneles |
| `rounded-full` | — | badges, avatares, punto de notificación |

Es el uso actual; la fase 2 solo corrige las desviaciones (por ejemplo, ítems de nav en `rounded-xl` frente a `rounded-lg`: se quedan en `rounded-lg` para alinearse con IconButton).

### 3.5 Elevación

Estética plana tipo Linear: el borde separa y la sombra solo indica que algo flota.

| Nivel | Claro | Oscuro | Uso |
|---|---|---|---|
| 0 | borde `slate-200`, sin sombra | borde `border-dark`, sin sombra | tarjetas, tablas, sidebar, header |
| 1 | `shadow-sm` | borde `input-border` | hover de tarjeta clicable, botón primario en reposo |
| 2 | `shadow-lg shadow-slate-900/5` | `bg-surface-dark` + `shadow-lg shadow-black/40` | menús, popovers, toasts, campana |
| 3 | `shadow-2xl shadow-slate-900/10` | `bg-surface-dark` + `shadow-2xl shadow-black/50` | modales, cajón móvil, paleta Ctrl+K |

Quedan prohibidas las sombras de color (`shadow-primary/25`, `shadow-rose-500/25`, `shadow-emerald-600/25`).

### 3.6 Movimiento

| Token | Duración | Curva | Uso |
|---|---|---|---|
| `fast` | 120 ms | `cubic-bezier(0.2, 0, 0, 1)` | color, fondo y borde en hover; press |
| `base` | 180 ms | `cubic-bezier(0.2, 0, 0, 1)` | acordeones del menú, menús, popovers, chevrons |
| `enter` | 220 ms | `cubic-bezier(0, 0, 0.2, 1)` | entrada de modal (opacidad + `scale .98→1`), drawer (`translateX`), toast (`translateY 8px→0` + opacidad) |
| `exit` | 150 ms | `cubic-bezier(0.4, 0, 1, 1)` | salida de toast y cajón |

- Press de botón: `active:scale-[0.98]` (no `0.95`).
- Sin desplazamiento vertical en hover de tarjetas.
- Esqueletos: `animate-pulse` en `slate-100` / `white/5`.
- **Reducción de movimiento (global):** en `src/index.css`:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; }
  }
  ```

### 3.7 Reglas por componente

**Botones** (`Button.tsx`)
- `primary`: `bg-primary-600 hover:bg-primary-700 text-white shadow-sm`, sin sombra de color.
- `secondary`: superficie blanca o `card-dark` con borde `slate-200` / `border-dark`, texto `slate-700` / `slate-100`.
- `outline` y `ghost`: igual que hoy, con texto `slate-700` (hoy `slate-600`).
- `danger`: `bg-rose-600 hover:bg-rose-700`. `success`: `bg-emerald-700 hover:bg-emerald-800`.
- Tamaños: `sm` h-8, `md` h-10, `lg` h-12. **En puntero grueso todos miden al menos 44 px**: añadir `[@media(pointer:coarse)]:min-h-11` a la base.
- Peso `font-semibold`. Foco: `ring-2 ring-primary ring-offset-2` (se mantiene).
- Disabled: `opacity-50`, se mantiene.
- Loading: se mantiene el spinner en lugar del icono y `aria-busy`.
- **Una sola acción primaria por vista**; el resto `secondary` u `outline`.
- Exportar `buttonClasses(variant, size)` para dar estilo de botón a un `<Link>` sin anidar elementos interactivos.

**IconButton**: `size-9` en escritorio y `[@media(pointer:coarse)]:size-11` en táctil. Es obligatorio para todos los botones de solo icono del header, el modal, el toast y las filas.

**Inputs / select / textarea**
- Altura única `h-11` (44) para `md`; `SELECT_SM` y la búsqueda de filtros `h-10` (`coarse:h-11`).
- Borde `control-border` / `input-border`.
- Foco: `focus:border-primary focus:ring-2 focus:ring-primary/30` (hoy `ring-1`).
- Error: borde `rose-600`, mensaje `text-rose-600 dark:text-rose-400` con icono `AlertCircle` de 14 px.
- Placeholder: `slate-500` en claro, `slate-400` en oscuro.
- Label `text-sm font-semibold text-slate-700 dark:text-slate-200`. **Los textos de label no cambian** (e2e).

**Tablas** (`tableStyles.ts`)
- thead `bg-slate-50 dark:bg-white/[.02]`, texto overline `slate-500` (4.55 ✓) / `slate-400`.
- Celdas `px-4 py-3`; primera y última con `pl-5` / `pr-5`.
- Hover de fila `bg-slate-50 dark:bg-white/[.03]`; fila clicable con `cursor-pointer` y `focus-visible:bg-primary/5`.
- Texto largo con `TD_TRUNCATE_CLASS` y `title`.
- Columna de acciones fija a la derecha: `sticky right-0` con fondo de superficie y sombra lateral `shadow-[-8px_0_8px_-8px_rgba(0,0,0,.08)]` cuando hay overflow, para que «Acciones» nunca desaparezca.
- Enlaces de código en `primary-600` (claro) / `primary` (oscuro) con `font-medium`, e `inline-flex min-h-11 items-center` en táctil.
- Móvil (tarjeta): la etiqueta va arriba a la izquierda, alineada a la primera línea del valor (`align-items: start` y `grid-row: 1` en `::before`), con 12 px de separación entre filas de datos y 16 px de padding de tarjeta.

**Tarjetas** (`Card`, `StatCard`)
- Nivel 0 por defecto.
- `hoverable` solo cuando la tarjeta entera navega: `hover:border-slate-300 dark:hover:border-input-border hover:shadow-sm`, sin `translate`.
- La variante `gradient` pasa a sólido `bg-primary-600 text-white` (hoy no tiene usos: se puede eliminar).
- `StatCard` sin efectos de hover, padding `p-4 sm:p-5`, etiqueta en overline de 12 px, cifra de 30 px, `trend` en `emerald-700` / `rose-600` (oscuro: 400) y `error` en `amber-700` / `amber-400`.

**Badges de estado**
- Pastilla `rounded-full px-2 py-0.5 text-xs font-semibold` con borde sutil; fondo `x-100` y texto `x-700` en claro, fondo `x-500/10` y texto `x-400` en oscuro (todos ✓, ver 3.1).
- **El color se reserva para estado** (borrador = neutro, abierto o vigente = éxito, en progreso o en revisión = info o aviso según el mapa actual, cerrado = neutro o info, cancelado u obsoleto = peligro).
- Atributos no de estado (complejidad, tipo, proceso) usan una nueva variante `outline`: `bg-transparent border-slate-300 text-slate-700 dark:border-border-dark dark:text-slate-300`.
- Se mantiene el `dot` para estados en curso.

**Navegación (sidebar)**
- Ítem `h-10` (`coarse:h-11`), `rounded-lg`, `text-sm font-medium`.
- Inactivo: `text-slate-600 dark:text-slate-400`, hover `bg-slate-100 dark:bg-white/5`.
- **Activo:** `bg-primary/10 text-primary-600 dark:text-primary font-semibold`, sin borde ni sombra, con una barra indicadora de 3 px a la izquierda (`before:` absolute `bg-primary`). Se elimina el `fill-current` del icono activo (`Sidebar.tsx:83`): el relleno deforma iconos de trazo.
- Sección: overline de 12 px `text-slate-500`, `h-9` (`coarse:h-11`).
- Tarjeta de usuario más compacta (`p-2.5`).
- Pie fijo con «Mi Perfil» y «Cerrar Sesión» (se mantiene).
- Cajón móvil: botón cerrar de 44 px, transición de 220/150 ms y fondo de nivel 3.

**Header**
- `h-14` en móvil, `md:h-16`.
- Fondo `bg-white/85 dark:bg-background-dark/85` con blur (se mantiene).
- Migas: la página actual en `text-slate-900 dark:text-white font-medium` y los ancestros en `slate-600 / slate-400`.
- Botones de icono con `IconButton` (36 → 44 px en táctil).
- Badge de la campana `bg-rose-600`, `min-w-5 h-5`, `text-[11px]` → `text-xs`.

**Modales**
- Panel `bg-white dark:bg-surface-dark` (nivel 3), `rounded-2xl`, backdrop `bg-slate-950/50` con `backdrop-blur-[2px]`.
- Entrada de 220 ms (opacidad + escala 0,98).
- En móvil (<640 px) el diálogo se ancla abajo como hoja (`items-end`, `rounded-t-2xl`, `max-h-[90dvh]`) y el pie apila los botones a todo el ancho con la acción primaria arriba.
- Cerrar con `IconButton` de 44 px en táctil.
- **No cambian** `role="dialog"`, `aria-modal`, `aria-labelledby`, foco atrapado ni Escape.

**Toasts**
- Nivel 2 (`dark:bg-surface-dark`), acento lateral de 3 px, título `text-sm font-semibold`.
- Colores de icono: éxito `emerald-700/400`, error `rose-600/400`, aviso `amber-700/400`, info `primary-600/primary`.
- Entrada `translateY(8px)` + opacidad en 220 ms; salida en 150 ms.
- En móvil se anclan **abajo** (`bottom-4 inset-x-4`), lejos del header y al alcance del pulgar; en `sm+` siguen arriba a la derecha.
- Botón cerrar de 32 px visibles (44 en táctil).
- **No cambian** `aria-live`, `role="alert"` / `role="status"`, la duración ni los textos.

**Estados de pantalla**
- Carga: `SkeletonRows` (nuevo, presentacional) para tablas y listas, con 5 filas de altura real, `role="status"` y texto `sr-only` «Cargando…». `LoadingBlock` queda para cargas de pantalla completa.
- Vacío: `EmptyState` actual, con descripción en `slate-600`.
- Error: `ErrorState` (nuevo, presentacional) con icono `AlertTriangle` en `amber-700` / `amber-400`, título, mensaje y botón «Reintentar» **solo donde la página ya tiene una función de recarga**.

---

## 4. Plan de implementación para la fase 2

Orden: tokens → primitivas → shell → patrones compartidos → pantallas. Haz un commit por paso. Tras cada paso ejecuta `npm run typecheck` y `npm run test:e2e`. La suite e2e mockea el API (`e2e/mockApi.ts`), así que el estilo nunca debería romperla: lo que la rompe es cambiar **roles, nombres accesibles, labels o textos**.

**Selectores e2e que no deben romperse** (extraídos de `e2e/*.spec.ts`):
- Labels: `Email Corporativo`, `Contraseña` (exact), `Título`, `Tipo`, `Proceso`, `Código`, `Proyecto`, `Sprint` (exact), `Archivo`, `Resumen del cambio`.
- Botones: `Iniciar Sesión`, `Guardar`, `Eliminar`, `Rechazar`, `Distribuir`, `Confirmar lectura`, `Nuevo documento`, `Subir versión`, `Aprobar v1`, `Rechazar v1`, `Descargar v1|v2`, `Exportar`, `Nuevo sprint`, `Registrar horas`, `Preguntar a la IA`, `Quitar dependencia con DEV-1`, `DEV-1 API de pagos`.
- Roles con nombre: `navigation` «Menú principal»; `dialog` «Ir a…» con `combobox` y `option`; `table` (y `table` «Por proyecto» / «Por persona»); `region` «Sprint seleccionado», «Mis actividades», «Actividades», `/^Por hacer/`; `tab` «Horas», «Tablero», «Comentarios»; `heading` «Hola, Ana», «Documentos», «Lecturas», «Gestión Solidaria», «Propuestas de IA»; `link` «Dashboard», «Asociados», «Ver todas», «Ver tablero», «POL-001», «POL-001 v1: Política de calidad», «Configurar CI»; `cell` «DEV-1/DEV-2» (exact); `row` `/DEV-1/`.
- Textos: «Bloqueada» (exact), «Vencida», «Sin resultados».
- `smoke.spec.ts:20-25` exige que los ítems sin permiso no existan como `link` dentro del nav; no hay que pintar ítems deshabilitados.

| Paso | Archivos exactos | Cambio | Riesgo e2e |
|---|---|---|---|
| **1. Tokens y base** | `tailwind.config.js`, `src/index.css`, `index.html` | Añadir `primary-400 #3aa3f0`, `primary-600 #0b6fb8`, `primary-700 #0a5f9e`, `control-border #8492a6`; `input-border` a `#4a6d8c`; quitar `text-secondary` (antes, `grep -rn "text-secondary\b" src` y sustituir por `text-muted`) y la fuente `body`. Añadir `transitionTimingFunction` (`standard`, `enter`, `exit`), `keyframes`/`animation` (`fade-in`, `scale-in`, `slide-up`, `slide-in-left`), la regla global de `prefers-reduced-motion` y la corrección de alineación de `.responsive-table td::before` (`grid-row: 1; align-self: start`). Quitar Noto Sans de `index.html:19` y los pesos 300 y 900 si dejan de usarse. Cambiar el `outline` de foco a `#0b6fb8` en claro y mantener `#1392ec` en `.dark`. | Nulo. La tabla móvil solo cambia CSS. |
| **2. Button / IconButton** | `src/shared/ui/Button/Button.tsx`, `src/shared/ui/IconButton/IconButton.tsx`, `src/shared/ui/Button/index.ts` | Variantes según 3.7, sin sombras de color, `active:scale-[0.98]`, `font-semibold`, `[@media(pointer:coarse)]:min-h-11` y `size-11`. Exportar `buttonClasses()`. | Nulo: nombres y roles intactos. |
| **3. Enlaces con aspecto de botón** | `src/features/dashboard/pages/DashboardPage.tsx:88-89,227`, `src/features/projects/pages/ProjectsPage.tsx:86,131`, `src/features/activities/components/ProjectActivitiesSection.tsx:34` | Sustituir `<Link><Button/></Link>` por `<Link className={buttonClasses(...)}>` con el icono dentro. | Bajo. «Ver tablero» ya se busca como `link` y sigue siéndolo. Nadie busca `button` «Nuevo Proyecto» ni «Crear Proyecto» (verificado con grep en `e2e/`). |
| **4. Formularios** | `src/shared/ui/Input/Input.tsx`, `src/shared/ui/formStyles.ts` | Alturas (`md` h-11), bordes `control-border` / `input-border`, foco `ring-2 ring-primary/30`, error `rose-600` con icono, placeholder oscuro `slate-400`, label `font-semibold`. | Nulo: `htmlFor`/`id`, `aria-describedby` y textos sin cambio. **No tocar** `useField` ni `validationText`. |
| **5. Sidebar** | `src/widgets/Sidebar/Sidebar.tsx` | Estilos de ítem, ítem activo con barra, sección, tarjeta de usuario y cajón según 3.7. | Medio. Conservar `aria-label="Menú principal"`, `aria-current`, `aria-expanded`/`aria-controls`, `inert`, los textos de los ítems (`navConfig.ts`) y el doble render escritorio/cajón con `idPrefix`. No convertir ítems en botones. |
| **6. Header y toasts** | `src/widgets/Header/Header.tsx`, `src/widgets/Header/NotificationBell.tsx`, `src/widgets/Header/CommandPalette.tsx` (solo superficie: `surface-dark` y nivel 3), `src/shared/context/NotificationContext.tsx` | `h-14 md:h-16`, migas con la página actual destacada, `IconButton` para buscar, tema y campana, badge `rose-600`. Toasts con animación, nivel 2 y anclados abajo en móvil. | Bajo. Conservar `aria-label`s («Abrir menú», «Buscar pantallas y acciones», «Cambiar a modo…», «Cerrar notificación»), el `dialog` «Ir a…» con su `combobox`/`option` y «Sin resultados». |
| **7. Modal** | `src/shared/ui/Modal/Modal.tsx`, `src/shared/ui/ConfirmDialog/ConfirmDialog.tsx` (solo clases) | Superficie `surface-dark`, animación de entrada, hoja inferior en móvil y pie apilado. | Medio. Hay 23 usos de `getByRole('dialog')`: no cambiar `role`, `aria-modal`, `aria-labelledby`, el `form` con `onSubmit`, el orden DOM del pie (`flex-row-reverse`) ni la pila `openModals`. La animación no debe retrasar la visibilidad más de 220 ms (Playwright reintenta, así que es seguro). |
| **8. Tarjetas, KPI y badges** | `src/shared/ui/Card/Card.tsx`, `src/shared/ui/StatCard/StatCard.tsx`, `src/shared/ui/Badge/Badge.tsx`, `src/shared/ui/Avatar/Avatar.tsx`, `src/features/projects/utils/projectAvatar.ts` | Hover sin `translate`, StatCard sin hover, colores de `trend` y `error`, variante `outline` en Badge, eliminar la variante `gradient` de Card y el degradado de Avatar (sólido `bg-primary-600`). `projectAvatar.ts`: cambiar `GRADIENTS` por tintes sólidos con el mismo índice estable (`bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300`, y así con indigo, emerald, amber, rose y slate); renombrar la función a `getProjectTint` y actualizar sus 2 usos (`ProjectCard.tsx:30`, `ProjectDetailPage.tsx:203`) quitando `bg-gradient-to-br`. | Nulo. |
| **9. Tablas y estados compartidos** | `src/shared/ui/tableStyles.ts`, `src/shared/ui/Page/Page.tsx`, `src/shared/ui/Pager/Pager.tsx` | Celdas `py-3`, thead, hover/foco de fila, `TH_ACTIONS_CLASS`/`TableActions` sticky a la derecha. `PageContainer` con `md:p-8`. `PageHeader`: descripción en `slate-600`; en `<sm` las acciones van en rejilla de 2 columnas y la **última acción** (por convención la primaria) ocupa la fila completa, sin reordenar el DOM. Nuevos `SkeletonRows` y `ErrorState` (presentacionales). Pager con botones `coarse:h-11`. | Bajo. `role="table"`, `row` y `cell` intactos; `data-label` lo pone `useTableCellLabels` y no se toca. Si una prueba esperaba el texto de `LoadingBlock`, mantenerlo como `sr-only`. |
| **10. Login y auth** | `src/features/auth/pages/LoginPage.tsx`, `src/features/auth/pages/RegisterPage.tsx` (solo el fondo), `src/app/layouts/AuthLayout.tsx` | Quitar las manchas difuminadas animadas; fondo liso `background-light/dark`; tarjeta nivel 0 con borde; enlace «¿Olvidaste…?» en `primary-600` con `min-h-11`; h1 de 28/36 en `font-extrabold`. | Bajo: labels «Email Corporativo», «Contraseña» y botón «Iniciar Sesión» sin cambio. |
| **11. Dashboard** | `src/features/dashboard/pages/DashboardPage.tsx` | KPI principales en `grid-cols-3` también en móvil con `compact` (o 2 + 1), y secundarios en 2 columnas (ya ocurre en `:119`). Un solo CTA primario. Títulos de sección con estilo h2. | Bajo: conservar el heading «Hola, …», «Gestión Solidaria» y el link «Ver todas». |
| **12. Proyectos** | `src/features/projects/pages/ProjectsPage.tsx`, `src/features/projects/components/ProjectCard.tsx` | Buscador y botones a h-10 alineados; pestañas de estado como control segmentado (`h-9`, `coarse:h-11`); badge de complejidad en `outline`; tarjeta «Crear Nuevo Proyecto» con borde discontinuo `slate-300` y texto `slate-600`. | Bajo. |
| **13. Documentos (lista y detalle)** | `src/features/documents/DocumentsPage.tsx`, `src/features/documents/DocumentDetailPage.tsx` | Lista: acciones de cabecera en tamaño `md` como el resto; filtros con `SELECT_SM`/Input `sm` a h-10; placeholders «Ej. Procedimiento» y «Ej. Gestión humana» en Tipo y Proceso; columna de acciones sticky; truncado de Responsable. Detalle: metadatos como `<dl>` en rejilla; en las acciones de versión, la primaria a la derecha en escritorio y apilada a todo el ancho arriba en móvil. | Medio. Conservar `heading` «Documentos» y «Lecturas», los `link` «POL-001» y «POL-001 v1: Política de calidad», los botones de versión y los labels «Tipo», «Proceso», «Código», «Título», «Archivo» y «Resumen del cambio». Los placeholders no cambian el nombre accesible porque el label existe. |
| **14. Actividades, Asociados, Perfil** | `src/features/activities/ActivitiesPage.tsx`, `src/features/associates/pages/AssociatesPage.tsx`, `src/features/profile/**` | Actividades: select de proyecto con `max-w-md` y estado vacío con más aire. Asociados: acciones móviles según el paso 9; buscador y select a la misma altura. Perfil: tarjeta «Tu perfil no se encontró» en nivel 0 con CTA `primary-600`; botones de mostrar contraseña a 44 px (ya cubierto por el paso 4). | Medio en Actividades (regiones «Actividades», «Sprint seleccionado», `/^Por hacer/`, pestañas «Tablero» y «Comentarios»): solo clases, sin mover regiones. |
| **15. Barrido final** | `src/**/*.tsx` | Sustituir `text-rose-500` por `text-rose-600 dark:text-rose-400` (33), `text-emerald-500` por `text-emerald-700 dark:text-emerald-400` (32) cuando son texto, `text-[10px]`/`text-[11px]` por `text-xs`, y `text-slate-500` sobre `bg-background-light` por `text-slate-600`. Limpiar los degradados de `OrganizationsPage.tsx:192` y `ReportsPage.tsx:193,314,409,443` (rellenos sólidos `bg-primary`, `bg-amber-500`, `bg-purple-500`). Revisar a mano: el texto `text-primary` en claro pasa a `text-primary-600 dark:text-primary` (138 usos; hay que cambiar solo el texto, no los iconos ni los fondos `bg-primary/10`). | Bajo, pero conviene ejecutar la suite completa y revisar visualmente con las mismas capturas. |

Verificación por paso: repetir las capturas con el script de la fase 1 (Playwright a 1280 y 390, en claro y oscuro) y comparar a ojo con las de `scratchpad\ui`. Para AA, comprobar en DevTools (o con axe) las parejas de la sección 3.1.

---

## 5. Justificación breve

- **`primary-600` para texto y botones:** el CTA y los enlaces pasan de 3.31 a 5.28 sin cambiar de familia de color. El usuario ve «el mismo azul», solo con más cuerpo. En móvil y a pleno sol la lectura mejora de forma inmediata.
- **Secundario `slate-600`, placeholder oscuro `slate-400` y estados en tonos 600/700:** cierran los fallos AA más repetidos (descripciones de página, errores de formulario, tendencias), que son justo los textos que el usuario lee para decidir.
- **Bordes de control a 3:1:** los formularios de gestión humana y calidad son la tarea diaria; un campo que se distingue sin esfuerzo reduce errores de captura.
- **Sin degradados ni sombras de color:** el color queda para el estado y la acción. Una tarjeta de proyecto se lee por su estado y no por un avatar morado-rosa. Es la sobriedad de Linear y Vercel que Edwin pidió.
- **Elevación por superficie en oscuro:** modales y menús en `surface-dark` se separan del contenido sin añadir sombras pesadas.
- **44 px en táctil sin inflar el escritorio:** con `pointer:coarse` el escritorio mantiene su densidad (filas de 48 px, botones de 40) y el móvil gana precisión.
- **Tablas más densas con acciones fijas:** la pantalla de documentos muestra las columnas que importan (vigente, aprobación, en curso) a 1280 px.
- **Una acción primaria visible primero en móvil:** mejora la conversión de las tareas clave (nuevo asociado, nuevo documento) sin cambiar ningún flujo.
- **Esqueletos y animaciones cortas con `reduced-motion`:** la app se percibe más rápida y estable, y respeta a quien desactiva el movimiento.
- **Una sola familia tipográfica:** se carga una fuente menos y la jerarquía se construye con tamaño y peso, no con 900 en todos los títulos.

---

## 6. Fuera de alcance (funcional)

Estos cambios alterarían la lógica de negocio o los datos, así que no entran en la fase 2:

- **Qué KPI ve cada rol.** Carolina (Developer) ve postulaciones, miembros activos y excedentes de la organización (`dashboard-desk-light-carolina.png`). Decidir si debe verlos es un tema de permisos, no visual.
- Reagrupar, renombrar o reordenar el menú (`navConfig.ts`) o colapsar secciones por defecto por rol.
- Ocultar columnas de la tabla de Documentos o cambiar qué datos muestra; solo se trunca y se fija la columna de acciones.
- Convertir los filtros libres «Tipo» y «Proceso» en selects con valores del API.
- Cambiar textos de la interfaz que usan las pruebas e2e, la duración de los toasts o el comportamiento de la paleta Ctrl+K.
- Añadir búsqueda, filtros, acciones masivas o atajos nuevos.
- Botones «Reintentar» donde la página no tiene ya una función de recarga.
- La copia del estado «Tu perfil no se encontró» y el flujo de creación de perfil.

---

## 7. Fase 2: lo aplicado

Aplicada en la rama `Edwin` en cinco commits (`181e55b` tokens, botones y formularios; `df5bbff` menú, cabecera, toasts y modales; `e1027d7` tarjetas, KPI, badges, tablas y estados; `d5f52ad` pantallas; `2ab2ee0` barrido). No cambian rutas, datos, permisos, llamadas al API ni textos funcionales. La suite e2e sigue en 52 de 52.

### 7.1 Estado por paso

| Paso | Estado | Notas |
|---|---|---|
| 1. Tokens y base | Hecho | `primary-400/600/700`, `control-border`, `input-border #4a6d8c`, curvas `standard/enter/exit`, animaciones `fade-in`, `scale-in`, `slide-up`, `slide-in-right`; `prefers-reduced-motion` global; foco `#0b6fb8` en claro y `#1392ec` en oscuro; etiqueta de la tabla móvil alineada a la primera línea. Noto Sans y los pesos 300 y 900 ya no se cargan (los 11 `font-black` pasan a `font-extrabold`). `text-secondary` no tenía usos y se quitó. `slide-in-left` no se añadió: el cajón ya anima con transición. |
| 2. Button / IconButton | Hecho | Sin sombras de color, `active:scale-[0.98]`, `font-semibold`, `min-h-11`/`size-11` en `pointer: coarse`. Nuevo `buttonClasses()`. |
| 3. Enlaces con aspecto de botón | Hecho | Además de los 5 previstos, los 2 de `RouteBoundary.tsx`. Ya no queda `<a><button>`. |
| 4. Formularios | Hecho | `md` h-11, `sm` h-10 (h-11 táctil), borde de control AA, foco `ring-2`, error `rose-600` con icono, placeholder oscuro `slate-400`, mostrar contraseña a 44 px táctil. `BioCard` y `ConsentsPanel` usaban clases sueltas y se alinearon. |
| 5. Sidebar | Hecho | Ítem activo con barra de 3 px y sin borde, sombra ni relleno de icono; secciones h-9; cajón en `surface-dark` con 220/150 ms; cerrar a 44 px. |
| 6. Header y toasts | Hecho con ajuste | Los botones de icono del header usan las mismas medidas que `IconButton` (36 px, 44 táctil) pero se quedan como `<button>` propios para conservar los iconos de 20 px. Migas con la página actual en negrita y `aria-current`. Toasts abajo en móvil, entrada de 220 ms. **Pendiente:** la animación de salida del toast, porque exige retrasar su eliminación del estado (cambio de comportamiento). |
| 7. Modal | Hecho | `surface-dark`, backdrop `slate-950/50`, entrada de 220 ms, hoja inferior en móvil con `max-h-[90dvh]` y pie apilado (la acción primaria, primera en el DOM, queda arriba). El drawer entra desde la derecha. |
| 8. Tarjetas, KPI, badges | Hecho | Variante `gradient` eliminada (sin usos), StatCard sin hover, Badge `outline`, Avatar sólido, `getProjectTint`. |
| 9. Tablas y estados | Hecho | Celdas `py-3`, columna de acciones fija (`TD_ACTIONS_CLASS`, también dentro de `TableActions`), `md:p-8`, acciones de `PageHeader` en rejilla de 2 en móvil (la última impar ocupa la fila), `SkeletonRows` y `ErrorState`. |
| 10. Login y auth | Hecho | Sin manchas difuminadas; tarjeta plana; enlaces a 44 px. |
| 11. Dashboard | Hecho | KPI principales en 2 + 1 en móvil, títulos de sección h2, un solo CTA primario (el del estado vacío pasa a `secondary`), `ErrorState` con la recarga que ya existía. |
| 12. Proyectos | Hecho | Buscador h-10 junto al botón h-10, pestañas como control segmentado, complejidad en `outline`, `ErrorState`. |
| 13. Documentos | Parcial | Acciones de cabecera en `md`, placeholders de Tipo y Proceso, `SkeletonRows`, acciones fijas, truncado de Título, Tipo, Proceso, Responsable y aprobador, celdas más estrechas. **A 1280 px con el menú expandido se ven 7 de 9 columnas** (antes 5): Aprobación y En curso siguen tras el scroll horizontal; la columna de acciones ya no desaparece. Para ver las 9 habría que ocultar o fusionar columnas (fuera de alcance, sección 6). Los filtros se quedan en h-11 (los cuatro iguales) porque `Select` no tiene tamaño `sm`. Detalle: las acciones de versión van en rejilla de 2 en móvil **sin reordenar** la primaria arriba, para no separar el orden visual del orden de foco. |
| 14. Actividades, Asociados, Perfil | Hecho | Selector de proyecto `max-w-md`; Asociados toma la rejilla del paso 9 y su buscador y select ya miden 40 px; tarjeta de perfil plana con CTA `primary-600`. |
| 15. Barrido | Hecho | 26 `text-rose-500`, 31 `text-emerald-500`, 14 `text-emerald-600`, 6 `text-amber-600`, 4 `text-[10/11px]` y 39 textos `text-primary`/`hover:text-primary` con su par oscuro. Los iconos `text-amber-500` pasan a `amber-600` (3.19, pasa 3:1 como gráfico). Degradados eliminados en organizaciones, reportes, chat de IA y asistente; sombras de color fuera de `ProgressBar`. |

### 7.2 Contraste antes y después

| Hallazgo | Pareja | Antes | Después | Mínimo |
|---|---|---|---|---|
| 1 CTA primario | blanco / botón | 3.31 ✗ | 5.28 ✓ | 4.5:1 |
| 1 Enlace azul (claro) | texto / blanco | 3.31 ✗ | 5.28 ✓ | 4.5:1 |
| 1 Ítem activo menú | texto / primary·10 | 2.95 ✗ | 4.71 ✓ | 4.5:1 |
| 2 Descripción de página | texto / #f6f7f8 | 4.44 ✗ | 7.06 ✓ | 4.5:1 |
| 3 Error de campo | texto / blanco | 3.67 ✗ | 4.70 ✓ | 4.5:1 |
| 3 Tendencia positiva | texto / blanco | 2.54 ✗ | 5.48 ✓ | 4.5:1 |
| 3 Aviso KPI | texto / blanco | 3.19 ✗ | 5.02 ✓ | 4.5:1 |
| 3 Botón danger | blanco / botón | 3.67 ✗ | 4.70 ✓ | 4.5:1 |
| 3 Botón success | blanco / botón | 3.77 ✗ | 5.48 ✓ | 4.5:1 |
| 4 Borde de campo (claro) | borde / slate-50 | 1.42 ✗ | 3.02 ✓ | 3:1 |
| 4 Borde de campo (oscuro) | borde / #111b22 | 1.45 ✗ | 3.20 ✓ | 3:1 |
| 5 Placeholder oscuro | texto / #111b22 | 3.67 ✗ | 6.80 ✓ | 4.5:1 |
| 6 Badge campana | blanco / badge | 3.67 ✗ | 4.70 ✓ | 4.5:1 |
| 10 Icono de cierre (claro) | icono / blanco | 2.56 ✗ | 4.76 ✓ | 3:1 |
| 18 Modal frente al fondo (oscuro) | superficie / #111b22 | 1.08 | 1.16 | — |
| 24 Anillo de foco (claro) | contorno / blanco | 3.31 ✓ | 5.28 ✓ | 3:1 |

Áreas táctiles: la auditoría de Playwright a 390 px con `hasTouch` no encuentra ningún control visible por debajo de 44 × 44 en dashboard, actividades, proyectos, asociados, documentos y perfil (antes fallaban el header, los botones de página, la edición de fila, los enlaces de código, el cierre de toast y el cajón; hallazgo 6).

### 7.3 Pendiente

- Animación de salida de toasts y del modal (requiere retrasar el desmontaje).
- Documentos a 1280 px: Aprobación y En curso quedan tras el scroll (ver paso 13).
- Quedan unos 67 `text-primary` en iconos y logotipos a propósito (acento de marca) y algunos en cadenas multilínea o condicionales que el barrido no tocó; revisar a mano si aparecen como texto.
- `text-slate-500` directamente sobre `#f6f7f8` fuera de `PageHeader` y `EmptyState`: no se detecta de forma automática; revisar pantalla a pantalla.
- Los iconos de KPI en `amber-600`, `emerald-700`, etc. se dejaron como estaban en tono, sin auditar uno a uno.
- La tarjeta de proyecto en el detalle (`ProjectDetailPage`) mantiene la complejidad con color de estado.

Capturas de después: mismos nombres que las de la fase 1 con el sufijo `-after` (por ejemplo `dashboard-movil-light-admin-after.png`, `menu-movil-movil-dark-admin-after.png`).
