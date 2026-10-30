# Novedades

## Dependencias entre actividades

- En **Organización**, el grupo "Módulo de actividades" tiene la opción **Habilitar dependencias entre actividades** (desactivada por defecto). Mientras esté apagada nada cambia; las dependencias ya creadas se conservan.
- Con las dependencias habilitadas, el detalle de una actividad tiene la sección **Dependencias**: lista a cuáles **Bloquea a** y por cuáles está **Bloqueada por**, abre la otra actividad con un clic y, con permiso de edición, agrega o quita dependencias con otra actividad del mismo proyecto.
- Las actividades con bloqueos abiertos muestran la etiqueta **Bloqueada** en el tablero y en el backlog. Moverlas a En progreso, En revisión o Hecho muestra un aviso (por ejemplo "DEV-3 tiene 2 dependencias abiertas") pero el movimiento se hace igual.

## Registro de horas en Actividades

- En **Organización**, el grupo "Módulo de actividades" tiene la opción **Habilitar registro de horas** (desactivada por defecto). Mientras esté apagada nada cambia; las horas ya registradas se conservan.
- Con el registro habilitado, el detalle de una actividad tiene la pestaña **Horas**: lista quién registró cuántas horas y en qué fecha, y permite registrar las propias (fecha no futura, más de 0 y hasta 24 horas, nota opcional). Cada quien elimina sus registros; un administrador puede eliminar cualquiera.
- El detalle muestra **Dedicado** (por ejemplo "6 h de 8 h", resaltado cuando supera lo estimado); la barra del sprint y la sección Actividades del proyecto muestran las horas dedicadas.

## Sprints opcionales en Actividades

- En **Organización**, el grupo "Módulo de actividades" tiene la opción **Habilitar sprints** (desactivada por defecto). Mientras esté apagada nada cambia.
- Con los sprints habilitados, la pantalla de **Actividades** filtra por sprint ("Todos", "Sin sprint" o un sprint) y muestra una barra con las fechas y el avance del sprint elegido. Quien puede editar actividades crea, edita, inicia y cierra sprints; solo puede haber un sprint activo por proyecto.
- Una actividad puede pertenecer a un sprint (campo opcional en el formulario y visible en el detalle). Al cerrar un sprint, sus actividades abiertas quedan sin sprint.

## Actividades en proyectos y "Mis actividades"

- El detalle del proyecto muestra una sección **Actividades**: avance, cantidad por estado, vencidas, por vencer y acceso al tablero.
- Nueva pantalla **Mis actividades**: las actividades abiertas que tienes asignadas en todos tus proyectos, las que vencen primero arriba, con filtro por proyecto. El dashboard muestra las primeras cinco.
- En **Organización**, el grupo "Módulo de actividades" permite ocultar la sección del proyecto y el widget del dashboard (ambos activos por defecto).

## Módulo de Actividades y proyectos en riesgo

- Nuevo módulo **Actividades**: tareas, historias, bugs y subtareas por proyecto, con backlog, tablero Kanban, comentarios con menciones, historial, exportación a CSV y avisos de actividades por vencer o vencidas.
- Propuestas de actividades generadas con IA: se revisan, editan y confirman (o rechazan) antes de crearse; vigencia de 7 días.
- El detalle del proyecto muestra el **avance por actividades** (hechas sobre no canceladas).
- **Cambio en "Proyectos en riesgo"**: ahora cuenta proyectos en curso con actividades abiertas vencidas o con avance por debajo del tiempo transcurrido. Antes se calculaba con otro criterio, por lo que la cifra puede variar. Reportes muestra la lista con avance, tiempo transcurrido y vencidas, y el avance promedio.
