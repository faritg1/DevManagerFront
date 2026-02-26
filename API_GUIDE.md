# DevManager API - Guía Completa de Implementación

> API REST multi-tenant para gestión de talento, habilidades y proyectos con integración de IA (Google Gemini)

**Base URL:** `https://localhost:7265/api`  
**Swagger UI:** `https://localhost:7265/swagger`

---

## 📋 Índice

1. [Autenticación](#-autenticación)
2. [Usuarios](#-usuarios)
3. [Perfiles](#-perfiles)
4. [Habilidades (Catálogo)](#-habilidades-catálogo)
5. [Habilidades de Empleados](#-habilidades-de-empleados)
6. [Proyectos](#-proyectos)
7. [Postulaciones](#-postulaciones)
8. [Asignaciones](#-asignaciones)
9. [Agente IA](#-agente-ia)
10. [Respuestas Estándar](#-respuestas-estándar)
11. [Códigos de Error](#-códigos-de-error)

---

## 🔐 Autenticación

Todos los endpoints (excepto login y registro) requieren un token JWT en el header:

```
Authorization: Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...
```

### POST `/api/auth/login`

Autentica un usuario y retorna un token JWT válido por 7 días.

**Request:**
```json
{
  "email": "admin@techcorp.com",
  "password": "Password123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...",
    "userId": "11111111-0000-0000-0000-000000000001",
    "email": "admin@techcorp.com",
    "fullName": "Admin TechCorp",
    "organizationId": "11111111-1111-1111-1111-111111111111",
    "organizationName": "TechCorp",
    "role": "Admin"
  },
  "timestamp": "2026-01-29T10:00:00Z"
}
```

**Errores:**
| Código | Descripción |
|--------|-------------|
| 401 | Credenciales inválidas |

---

### POST `/api/auth/register-organization`

Registra una nueva organización con su usuario administrador. Retorna token JWT para acceso inmediato.

**Request:**
```json
{
  "organizationName": "InnovateLab",
  "legalName": "InnovateLab S.A. de C.V.",
  "adminEmail": "admin@innovatelab.com",
  "adminPassword": "SecurePass123!",
  "adminFullName": "Carlos Ruiz"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Organización registrada exitosamente",
  "data": {
    "organizationId": "22222222-2222-2222-2222-222222222222",
    "organizationName": "InnovateLab",
    "adminUserId": "22222222-0000-0000-0000-000000000001",
    "adminEmail": "admin@innovatelab.com",
    "token": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errores:**
| Código | Descripción |
|--------|-------------|
| 400 | Email o nombre de organización duplicado |

---

## 👥 Usuarios

> Todos los endpoints requieren autenticación y filtran automáticamente por OrganizationId (multi-tenancy)

### GET `/api/users`

Obtiene todos los usuarios de la organización.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "11111111-0000-0000-0000-000000000001",
      "email": "admin@techcorp.com",
      "fullName": "Admin TechCorp",
      "roleName": "Admin",
      "phoneNumber": "+52 55 1234 5678",
      "isActive": true,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

### GET `/api/users/{id}`

Obtiene un usuario específico por ID.

**Parámetros:**
| Nombre | Tipo | Descripción |
|--------|------|-------------|
| id | GUID | ID del usuario |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "11111111-0000-0000-0000-000000000002",
    "email": "maria.garcia@techcorp.com",
    "fullName": "María García",
    "roleName": "Manager",
    "phoneNumber": "+52 55 9876 5432",
    "isActive": true,
    "createdAt": "2024-01-20T14:30:00Z"
  }
}
```

**Errores:**
| Código | Descripción |
|--------|-------------|
| 404 | Usuario no encontrado |

---

### POST `/api/users`

Crea un nuevo usuario en la organización. Requiere rol Admin o Manager.

**Request:**
```json
{
  "email": "pedro.lopez@techcorp.com",
  "password": "SecurePass123!",
  "fullName": "Pedro López",
  "roleId": "11111111-0001-0000-0000-000000000003",
  "phoneNumber": "+52 55 1111 2222"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Usuario creado exitosamente",
  "data": {
    "id": "11111111-0000-0000-0000-000000000005",
    "email": "pedro.lopez@techcorp.com",
    "fullName": "Pedro López",
    "roleName": "Developer",
    "phoneNumber": "+52 55 1111 2222",
    "isActive": true,
    "createdAt": "2026-01-20T16:45:00Z"
  }
}
```

**Errores:**
| Código | Descripción |
|--------|-------------|
| 400 | Email duplicado o datos inválidos |
| 403 | Sin permisos |

---

### PUT `/api/users/{id}`

Actualiza un usuario existente (partial update).

**Request:**
```json
{
  "fullName": "María García Sánchez",
  "phoneNumber": "+52 55 9876 5432",
  "roleId": "11111111-0001-0000-0000-000000000002",
  "isActive": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Usuario actualizado exitosamente",
  "data": {
    "id": "11111111-0000-0000-0000-000000000002",
    "email": "maria.garcia@techcorp.com",
    "fullName": "María García Sánchez",
    "roleName": "Manager",
    "phoneNumber": "+52 55 9876 5432",
    "isActive": true
  }
}
```

> ⚠️ **Nota:** No se puede cambiar el email por seguridad.

---

### DELETE `/api/users/{id}`

Elimina lógicamente un usuario (soft delete). El registro se mantiene para auditoría.

**Response (204 No Content)**

---

## 📝 Perfiles

### GET `/api/profile/me`

Obtiene el perfil profesional del usuario autenticado.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "11111111-0000-0000-0000-000000000003",
    "bio": "Desarrollador Full Stack con 5 años de experiencia en .NET y React",
    "yearsExperience": 5,
    "linkedinUrl": "https://linkedin.com/in/juan-martinez",
    "githubUrl": "https://github.com/juanmartinez",
    "portfolioUrl": "https://juandev.com",
    "createdAt": "2024-02-01T10:00:00Z",
    "updatedAt": "2025-12-15T08:30:00Z"
  }
}
```

---

### PUT `/api/profile/me`

Crea o actualiza el perfil del usuario autenticado (upsert).

**Request:**
```json
{
  "bio": "Senior Full Stack Developer especializado en arquitecturas cloud-native",
  "yearsExperience": 8,
  "linkedinUrl": "https://linkedin.com/in/juan-martinez-dev",
  "githubUrl": "https://github.com/juanmartinez",
  "portfolioUrl": "https://juandev.io"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Perfil actualizado exitosamente"
}
```

---

### ✅ Certificaciones

El perfil también incluye las certificaciones del empleado. Un endpoint específico permite gestionarlas.

#### GET `/api/certifications/me`

Obtiene todas las certificaciones del usuario autenticado.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cccccccc-0000-0000-0000-000000000005",
      "userId": "11111111-0000-0000-0000-000000000003",
      "name": "Microsoft Certified: Azure Developer Associate",
      "issuer": "Microsoft",
      "issueDate": "2023-07-10T00:00:00Z",
      "expirationDate": "2026-07-10T00:00:00Z",
      "evidenceUrl": "https://www.example.com/certif.pdf"
    }
  ]
}
```

#### POST `/api/certifications/me`

Crea una nueva certificación para el usuario autenticado.

**Request:**
```json
{
  "name": "AWS Certified Solutions Architect",
  "issuer": "Amazon",
  "issueDate": "2025-01-15T00:00:00Z",
  "expirationDate": "2028-01-15T00:00:00Z",
  "evidenceUrl": "https://cert.example.com/aws.pdf"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Certificación creada exitosamente",
  "data": "dddddddd-0000-0000-0000-000000000006"
}
```

#### GET `/api/certifications/me/{id}`

Recupera una certificación propia por ID.

#### PUT `/api/certifications/me/{id}`

Actualiza una certificación del usuario.

#### DELETE `/api/certifications/me/{id}`

Elimina (soft delete) una certificación propia.

---

---

## 🎯 Habilidades (Catálogo)

## ⚙️ Configuración / Catálogos
### GET `/api/config`
Obtiene todos los catálogos de configuración en una sola llamada (uso para dropdowns iniciales).

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "projectStatuses": [
      { "id": 1, "code": "DRAFT", "name": "Borrador", "description": "Proyecto en creación", "displayOrder": 1, "isActive": true, "allowsApplications": false },
      { "id": 2, "code": "OPEN", "name": "Abierto", "description": "Aceptando postulaciones", "displayOrder": 2, "isActive": true, "allowsApplications": true }
    ],
    "complexityLevels": [
      { "id": 1, "code": "LOW", "name": "Baja", "description": "Requiere poco esfuerzo", "displayOrder": 1, "isActive": true, "experienceMultiplier": 0.75 },
      { "id": 2, "code": "MEDIUM", "name": "Media", "description": "Complejidad estándar", "displayOrder": 2, "isActive": true, "experienceMultiplier": 1.0 }
    ],
    "applicationStatuses": [
      { "id": 1, "code": "APPLIED", "name": "Postulado", "description": "Candidato postulado", "displayOrder": 1, "isActive": true, "requiresReviewNotes": false, "isFinalState": false },
      { "id": 2, "code": "APPROVED", "name": "Aprobado", "description": "Postulación aceptada", "displayOrder": 2, "isActive": true, "requiresReviewNotes": true, "isFinalState": true }
    ],
    "assignmentStatuses": [
      { "id": 1, "code": "ASSIGNED", "name": "Asignado", "description": "Empleado asignado", "displayOrder": 1, "isActive": true, "isFinalState": false }
    ],
    "skillLevels": [
      { "id": 1, "code": "NOVICE", "name": "Novato", "description": "Conocimientos básicos", "displayOrder": 1, "isActive": true, "minYearsExperience": 0 },
      { "id": 5, "code": "EXPERT", "name": "Experto", "description": "Referencia técnica", "displayOrder": 5, "isActive": true, "minYearsExperience": 7 }
    ],
    "contributionScores": [
      { "id": 1, "code": "LOW", "name": "Bajo", "description": "Contribución mínima", "displayOrder": 1, "isActive": true, "experienceBonus": 0.0 }
    ],
    "evaluationSources": [
      { "id": 1, "code": "SELF", "name": "Autoevaluación", "description": "Declarado por el empleado", "displayOrder": 1, "isActive": true, "isAutomated": false }
    ],
    "skillTypes": [
      { "id": 1, "code": "HARD", "name": "Técnica", "description": "Habilidades técnicas", "displayOrder": 1, "isActive": true }
    ],
    "skillCategories": [
      { "id": 1, "code": "PROGRAMMING", "name": "Lenguajes de Programación", "description": "Categoría principal", "displayOrder": 1, "isActive": true, "parentCategoryId": null, "parentCategoryName": null }
    ],
    "agentActionTypes": [
      { "id": 1, "code": "SKILL_VALIDATION", "name": "Validación de Skill", "description": "Acción automática del agente", "displayOrder": 1, "isActive": true, "requiresApproval": false }
    ],
    "agentActionStatuses": [
      { "id": 1, "code": "SUCCESS", "name": "Exitoso", "description": "Acción completada", "displayOrder": 1, "isActive": true, "isFinalState": true }
    ],
    "seniorityLevels": [
      { "id": 1, "code": "INTERN", "name": "Practicante", "description": "Nivel inicial", "displayOrder": 1, "isActive": true, "minYearsExperience": 0, "maxYearsExperience": 1 },
      { "id": 7, "code": "ARCHITECT", "name": "Arquitecto", "description": "Máxima seniority técnica", "displayOrder": 7, "isActive": true, "minYearsExperience": 12, "maxYearsExperience": null }
    ]
  }
}
```

---

### GET `/api/config/project-statuses`
Listar estados de proyecto (respuesta por catálogo, útil para menús desplegables).

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "DRAFT",
      "name": "Borrador",
      "description": "Proyecto en creación",
      "displayOrder": 1,
      "isActive": true,
      "allowsApplications": false
    },
    {
      "id": 2,
      "code": "OPEN",
      "name": "Abierto",
      "description": "Aceptando postulaciones",
      "displayOrder": 2,
      "isActive": true,
      "allowsApplications": true
    }
  ]
}
```

### GET `/api/config/complexity-levels`
Listar niveles de complejidad.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    { "id": 1, "code": "LOW", "name": "Baja", "description": "Requiere poco esfuerzo", "displayOrder": 1, "isActive": true, "experienceMultiplier": 0.75 },
    { "id": 2, "code": "MEDIUM", "name": "Media", "description": "Complejidad estándar", "displayOrder": 2, "isActive": true, "experienceMultiplier": 1.0 }
  ]
}
```

### GET `/api/config/application-statuses`
Listar estados de postulación.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    { "id": 1, "code": "APPLIED", "name": "Postulado", "requiresReviewNotes": false, "isFinalState": false, "displayOrder": 1, "isActive": true },
    { "id": 2, "code": "APPROVED", "name": "Aprobado", "requiresReviewNotes": true, "isFinalState": true, "displayOrder": 2, "isActive": true }
  ]
}
```

### GET `/api/config/assignment-statuses`
Listar estados de asignación.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    { "id": 1, "code": "ASSIGNED", "name": "Asignado", "isFinalState": false, "displayOrder": 1, "isActive": true }
  ]
}
```

### GET `/api/config/skill-levels`
Listar niveles de habilidad.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    { "id": 1, "code": "NOVICE", "name": "Novato", "minYearsExperience": 0, "displayOrder": 1, "isActive": true },
    { "id": 5, "code": "EXPERT", "name": "Experto", "minYearsExperience": 7, "displayOrder": 5, "isActive": true }
  ]
}
```

### GET `/api/config/contribution-scores`
Listar puntajes de contribución.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    { "id": 1, "code": "LOW", "name": "Bajo", "experienceBonus": 0.0, "displayOrder": 1, "isActive": true }
  ]
}
```

### GET `/api/config/evaluation-sources`
Listar fuentes de evaluación.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    { "id": 1, "code": "SELF", "name": "Autoevaluación", "isAutomated": false, "displayOrder": 1, "isActive": true }
  ]
}
```

### GET `/api/config/skill-types`
Listar tipos de habilidad.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    { "id": 1, "code": "HARD", "name": "Técnica", "displayOrder": 1, "isActive": true },
    { "id": 2, "code": "SOFT", "name": "Blanda", "displayOrder": 2, "isActive": true }
  ]
}
```

### GET `/api/config/skill-categories`
Listar categorías de habilidad (incluye parent si aplica).

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    { "id": 1, "code": "PROGRAMMING", "name": "Lenguajes de Programación", "parentCategoryId": null, "parentCategoryName": null, "displayOrder": 1, "isActive": true }
  ]
}
```

### GET `/api/config/agent-action-types`
Listar tipos de acción del agente.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    { "id": 1, "code": "SKILL_VALIDATION", "name": "Validación de Skill", "requiresApproval": false, "displayOrder": 1, "isActive": true }
  ]
}
```

### GET `/api/config/agent-action-statuses`
Listar estados de acción del agente.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    { "id": 1, "code": "SUCCESS", "name": "Exitoso", "isFinalState": true, "displayOrder": 1, "isActive": true }
  ]
}
```

### GET `/api/config/seniority-levels`
Listar niveles de seniority.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    { "id": 1, "code": "INTERN", "name": "Practicante", "minYearsExperience": 0, "maxYearsExperience": 1, "displayOrder": 1, "isActive": true },
    { "id": 7, "code": "ARCHITECT", "name": "Arquitecto", "minYearsExperience": 12, "maxYearsExperience": null, "displayOrder": 7, "isActive": true }
  ]
}
```



## 🎯 Habilidades (Catálogo)
### GET `/api/skills`
Obtiene el catálogo de habilidades (globales + organizacionales). Filtra automáticamente por `OrganizationId` para skills organizacionales.

Headers:
- `Authorization: Bearer {token}`

Query params (opcionales):
- `q` (string): búsqueda por nombre o categoría
- `skillType` (0|1): filtra por tipo (Global u Organizational)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "aaaaaaaa-0000-0000-0000-000000000001",
      "name": "C#",
      "category": "Backend",
      "skillType": 0,
      "organizationId": null
    },
    {
      "id": "bbbbbbbb-0000-0000-0000-000000000001",
      "name": "Sistema Legacy Interno",
      "category": "Plataformas Internas",
      "skillType": 1,
      "organizationId": "11111111-1111-1111-1111-111111111111"
    }
  ]
}
```

Campos devueltos (por item):
- `id` (GUID)
- `name` (string)
- `category` (string?)
- `skillType` (int): 0 = Global, 1 = Organizational
- `organizationId` (GUID?): presente si `skillType` = 1

---

### GET `/api/skills/{id}`
Obtiene una habilidad por su `id`.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "aaaaaaaa-0000-0000-0000-000000000001",
    "name": "C#",
    "category": "Backend",
    "skillType": 0,
    "organizationId": null
  }
}
```

**Errores:**
- `404 Not Found` si la skill no existe o no pertenece a la organización.

---

### POST `/api/skills`
Crea una nueva habilidad organizacional. Requiere rol Admin o Manager.

Headers:
- `Authorization: Bearer {token}`

**Request (application/json):**
```json
{
  "name": "SAP ERP",
  "category": "Sistemas Empresariales",
  "skillType": 1
}
```

Validaciones (DTO - `SkillDto`):
- `name`: requerido, máximo 120 caracteres, único por organización.
- `category`: opcional, máximo 80 caracteres.
- `skillType`: sólo `1` para creación vía API (organisational).

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Habilidad creada exitosamente",
  "data": "cccccccc-0000-0000-0000-000000000001"
}
```

**Errores:**
- `400 Bad Request` → payload inválido o validación fallida.
- `403 Forbidden` → rol insuficiente.
- `409 Conflict` → nombre duplicado.

---

### PUT `/api/skills/{id}`
Actualiza datos de una habilidad existente. Requiere rol Admin o Manager.

**Request (application/json):** (mismo `SkillDto`, `id` en ruta debe coincidir con `id` en body)
```json
{
  "id": "cccccccc-0000-0000-0000-000000000001",
  "name": "SAP ERP",
  "category": "Sistemas Empresariales",
  "skillType": 1
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Habilidad actualizada exitosamente"
}
```

**Errores:**
- `400 Bad Request` → `id` discordante o validación.
- `404 Not Found` → skill no encontrada.

---

### DELETE `/api/skills/{id}`
Elimina lógicamente una skill (soft delete). Requiere rol Admin o Manager.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Habilidad eliminada"
}
```

**Errores:**
- `404 Not Found` → skill no encontrada.

---

## 💼 Habilidades de Empleados

Endpoints para gestionar las habilidades de un empleado (auto-declaradas y validadas por managers).

### GET `/api/employees/{id}/skills`
Obtiene todas las habilidades de un empleado específico (incluye metadata de validación).

Headers:
- `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "dddddddd-0000-0000-0000-000000000001",
      "userId": "11111111-0000-0000-0000-000000000003",
      "skillId": "aaaaaaaa-0000-0000-0000-000000000001",
      "skillName": "C#",
      "level": 5,
      "evidenceUrl": "https://github.com/juan/dotnet-core",
      "lastValidatedAt": "2025-12-01T10:00:00Z",
      "validatedByUserId": "11111111-0000-0000-0000-000000000002",
      "validatedByName": "María García"
    }
  ]
}
```

Niveles de Proficiencia (valor del campo `level`):
- `1` Básico
- `2` Intermedio
- `3` Competente
- `4` Avanzado
- `5` Experto

---

### POST `/api/employees/skills`
Crea o actualiza (upsert) la habilidad del usuario autenticado. `OrganizationId` y `userId` se toman del JWT.

Headers:
- `Authorization: Bearer {token}`

**Request (application/json) — DTO `UpsertEmployeeSkillRequest`:**
```json
{
  "skillId": "aaaaaaaa-0000-0000-0000-000000000008",
  "level": 3,
  "evidenceUrl": "https://github.com/myuser/kubernetes-project"
}
```

Validaciones:
- `skillId`: requerido (GUID) y debe existir en catálogo.
- `level`: obligatorio, valor entre 1 y 5.
- `evidenceUrl`: opcional, si se envía debe ser URL válida.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Habilidad guardada exitosamente"
}
```

Errores:
- `400 Bad Request`: validación de payload fallida.
- `404 Not Found`: `skillId` no existe.

---

### PUT `/api/employees/skills/{id}/validate`
Endpoint para que un Manager/Admin valide la habilidad declarada por un empleado.

Headers:
- `Authorization: Bearer {token}` (requiere rol Manager o Admin)

**Request (application/json) — DTO `ValidateSkillRequest`:**
```json
{
  "newLevel": 3
}
```

- `newLevel`: opcional (null = solo marcar como validada sin cambiar nivel). Si se proporciona, debe estar en 1-5.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Habilidad validada exitosamente"
}
```

Errores:
- `400 Bad Request`: `newLevel` fuera de rango.
- `403 Forbidden`: rol insuficiente.
- `404 Not Found`: skill del empleado no encontrada.

---

## 📁 Proyectos

### GET `/api/projects`

Obtiene todos los proyectos con filtro opcional por estado.

**Query Parameters:**
| Nombre | Tipo | Descripción |
|--------|------|-------------|
| status | int? | Filtro por estado (opcional) |

**Estados de Proyecto:**
| Valor | Estado | Descripción |
|-------|--------|-------------|
| 0 | Draft | Borrador |
| 1 | Active | Activo |
| 2 | OnHold | En pausa |
| 3 | Completed | Completado |
| 4 | Cancelled | Cancelado |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "eeeeeeee-0000-0000-0000-000000000001",
      "code": "SIST-HOSP-001",
      "name": "Sistema de Gestión Hospitalaria",
      "description": "Modernización del sistema de registro de pacientes",
      "status": 1,
      "statusName": "Active",
      "startDate": "2024-03-01T00:00:00Z",
      "endDate": "2024-12-31T00:00:00Z",
      "complexity": 2,
      "complexityName": "High",
      "createdAt": "2024-02-15T10:00:00Z"
    }
  ]
}
```

---

### GET `/api/projects/{id}`

Obtiene los detalles de un proyecto específico.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "eeeeeeee-0000-0000-0000-000000000001",
    "code": "SIST-HOSP-001",
    "name": "Sistema de Gestión Hospitalaria",
    "description": "Sistema integral para gestión de pacientes...",
    "status": 1,
    "statusName": "Active",
    "startDate": "2024-03-01T00:00:00Z",
    "endDate": "2024-12-31T00:00:00Z",
    "complexity": 2,
    "complexityName": "High",
    "budgetEstimate": 500000.00,
    "createdAt": "2024-02-15T10:00:00Z"
  }
}
```

---

### POST `/api/projects`

Crea un nuevo proyecto. Requiere rol Manager o Admin.

**Request:**
```json
{
  "code": "APP-MOVIL-002",
  "name": "App Móvil de Delivery",
  "description": "Aplicación Android/iOS para entregas a domicilio con tracking en tiempo real",
  "startDate": "2026-03-01T00:00:00Z",
  "endDate": "2026-09-30T00:00:00Z",
  "complexity": 1,
  "budgetEstimate": 250000.00
}
```

**Complejidad:**
| Valor | Nivel |
|-------|-------|
| 0 | Low |
| 1 | Medium |
| 2 | High |

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Proyecto creado exitosamente",
  "data": "ffffffff-0000-0000-0000-000000000001"
}
```

---

### POST `/api/projects/{id}/reqs`

Agrega un requisito de habilidad al proyecto.

**Request:**
```json
{
  "skillId": "aaaaaaaa-0000-0000-0000-000000000001",
  "requiredLevel": 4,
  "isMandatory": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Requisito agregado exitosamente",
  "data": "gggggggg-0000-0000-0000-000000000001"
}
```

---

### GET `/api/projects/{id}/reqs`

Obtiene todos los requisitos de habilidades de un proyecto.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "gggggggg-0000-0000-0000-000000000001",
      "projectId": "eeeeeeee-0000-0000-0000-000000000001",
      "skillId": "aaaaaaaa-0000-0000-0000-000000000001",
      "skillName": "C#",
      "requiredLevel": 4,
      "isMandatory": true
    }
  ]
}
```

---

## 📩 Postulaciones

### POST `/api/projects/{id}/apply`

Permite a un empleado postularse a un proyecto.

**Request:**
```json
{
  "message": "Tengo 5 años de experiencia en .NET y Azure, he trabajado en proyectos similares..."
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Postulación enviada exitosamente",
  "data": "hhhhhhhh-0000-0000-0000-000000000001"
}
```

---

### GET `/api/projects/{id}/applications`

Obtiene todas las postulaciones de un proyecto.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "hhhhhhhh-0000-0000-0000-000000000001",
      "projectId": "eeeeeeee-0000-0000-0000-000000000001",
      "projectName": "Sistema de Gestión Hospitalaria",
      "userId": "11111111-0000-0000-0000-000000000003",
      "userFullName": "Juan Martínez",
      "message": "Tengo 5 años de experiencia en .NET y Azure...",
      "status": 0,
      "statusName": "Pending",
      "appliedAt": "2026-01-15T10:30:00Z",
      "reviewedByUserId": null,
      "reviewedByName": null,
      "reviewedAt": null,
      "reviewNotes": null
    }
  ]
}
```

**Estados de Postulación:**
| Valor | Estado |
|-------|--------|
| 0 | Pending |
| 1 | Approved |
| 2 | Rejected |

---

### PUT `/api/applications/{id}/review`

Revisa una postulación (aprobar/rechazar). Requiere rol Manager o Admin.

**Request - Aprobar:**
```json
{
  "status": 1,
  "reviewNotes": "Perfil excelente, cumple todos los requisitos técnicos"
}
```

**Request - Rechazar:**
```json
{
  "status": 2,
  "reviewNotes": "No cumple con el nivel requerido de Azure (necesitamos nivel 4+)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Postulación aprobada exitosamente"
}
```

---

## 📌 Asignaciones

### POST `/api/assignments`

Asigna un usuario a un proyecto. Requiere rol Manager o Admin.

**Request:**
```json
{
  "projectId": "eeeeeeee-0000-0000-0000-000000000001",
  "userId": "11111111-0000-0000-0000-000000000004",
  "role": "Backend Developer",
  "hoursPerWeek": 40,
  "startDate": "2026-02-01T00:00:00Z",
  "endDate": "2026-08-31T00:00:00Z"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Usuario asignado exitosamente al proyecto",
  "data": "iiiiiiii-0000-0000-0000-000000000001"
}
```

**Diferencia con Postulaciones:**
| Concepto | Descripción |
|----------|-------------|
| Application | Postulación voluntaria del empleado (bottom-up) |
| Assignment | Asignación administrativa por manager (top-down) |

---

## 🤖 Agente IA

> Endpoints de inteligencia artificial usando Google Gemini para análisis de talento.

### POST `/agent/query`

Consulta en lenguaje natural al agente de IA. El agente puede responder preguntas sobre la organización o personalizadas sobre ti mismo.

#### Consultas Organizacionales

**Request:**
```json
{
  "query": "¿Cuántos desarrolladores tenemos con Java nivel 4 o superior?",
  "requireApproval": false
}
```

**Ejemplos de consultas organizacionales:**
- "¿Cuántos desarrolladores tenemos con Java nivel 4 o superior?"
- "Analiza las brechas de capacitación en el equipo de frontend"
- "¿Qué skills están más demandadas en los proyectos activos?"

#### Consultas Personalizadas (Contexto del Usuario Actual)

El agente ahora puede responder preguntas personalizadas sobre TI. Utiliza pronombres como "yo", "mi", "mis" para referirte a ti mismo. El sistema extrae automáticamente tu userId del token JWT.

**Request:**
```json
{
  "query": "¿Qué habilidades me recomiendan aprender?",
  "requireApproval": false
}
```

**Ejemplos de consultas personalizadas:**
- "¿Qué habilidades me recomiendan aprender?"
- "¿Qué proyectos encajan con mis habilidades?"
- "Analiza mi perfil y dime en qué proyectos puedo contribuir"
- "Dame recomendaciones para mejorar mi carrera profesional"
- "¿Cuáles son mis fortalezas y debilidades técnicas?"

**Detección Automática:**
El sistema detecta automáticamente cuando la consulta se refiere al usuario actual mediante estos patrones:
- "yo", "mi", "mis", "mí"
- "para mí", "para mi"
- "me recomi", "me适合" (soporte multilingüe)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Consulta procesada exitosamente",
  "data": {
    "answer": "Tenemos 2 desarrolladores con Java nivel 4+:\n\n1. Juan Martínez (Java: 4, Spring Boot: 3)\n2. Ana López (Java: 5, Spring Boot: 5, PostgreSQL: 4)\n\nAna López es el perfil más senior en Java.",
    "reasoning": "Analicé la tabla talent.EmployeeSkills filtrando por OrganizationId y skillName='Java' con level >= 4.",
    "requiresApproval": false,
    "actionId": null,
    "confidence": 95
  }
}
```

**Response (200 OK) - Consulta Personalizada:**
```json
{
  "success": true,
  "message": "Consulta procesada exitosamente",
  "data": {
    "answer": "Basado en tu perfil actual (C# nivel 4, React nivel 3, 5 años de experiencia), te recomiendo:\n\n1. **Aprender Azure DevOps** - Complementa tus habilidades actuales y es muy demandada\n2. **Mejorar tu nivel de Kubernetes** - De 2 a 3+ para acceder a proyectos cloud-native\n3. **Considerar certificación AWS Solutions Architect** - Ampliaría tus oportunidades",
    "reasoning": "Analicé tu perfil: C# (4), React (3), SQL Server (4). Comparé con los requisitos de proyectos activos y skills más demandadas en la organización.",
    "requiresApproval": false,
    "actionId": null,
    "confidence": 88
  }
}
```

---

### POST `/agent/validate-skill`

Validación semántica de habilidades usando IA.

**Request:**
```json
{
  "userId": "11111111-0000-0000-0000-000000000003",
  "skillId": "aaaaaaaa-0000-0000-0000-000000000001",
  "level": 5,
  "evidenceUrl": "https://github.com/juan/dotnet-microservices-framework",
  "yearsExperience": 8
}
```

**Response (200 OK) - Válido:**
```json
{
  "success": true,
  "message": "Skill validado exitosamente",
  "data": {
    "isValid": true,
    "confidence": 92,
    "reasoning": "El nivel 5 declarado es coherente con:\n- 8 años de experiencia\n- Evidencia de repositorio con framework completo de microservicios\n- Patrones avanzados: CQRS, Event Sourcing, DDD",
    "recommendations": [
      "Considerar certificación Microsoft Certified: Azure Solutions Architect Expert",
      "Potencial mentor para desarrolladores junior en .NET"
    ]
  }
}
```

**Response (200 OK) - Requiere revisión:**
```json
{
  "success": true,
  "message": "Skill requiere revisión",
  "data": {
    "isValid": false,
    "confidence": 45,
    "reasoning": "El nivel 5 (Experto) parece sobreestimado:\n- Solo 2 años de experiencia\n- Evidencia muestra proyectos básicos CRUD",
    "recommendations": [
      "Solicitar evidencia adicional de proyectos complejos",
      "Considerar nivel 3-4 como más apropiado"
    ]
  }
}
```

---

### POST `/agent/match-candidates`

Matching inteligente de candidatos para un proyecto.

**Request:**
```json
{
  "projectId": "eeeeeeee-0000-0000-0000-000000000001",
  "requireApproval": true,
  "minScore": 70
}
```

**Algoritmo de Matching:**
| Criterio | Peso | Descripción |
|----------|------|-------------|
| Mandatory Skills | 60% | Debe tener TODAS las skills obligatorias |
| Optional Skills | 20% | Bonus por skills deseables |
| Experience | 10% | Años de experiencia |
| Skill Surplus | 10% | Bonus si nivel supera el requerido |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Se encontraron 3 candidatos",
  "data": {
    "projectId": "eeeeeeee-0000-0000-0000-000000000001",
    "projectName": "Sistema de Gestión Hospitalaria",
    "totalCandidates": 3,
    "requiresApproval": true,
    "actionId": "kkkkkkkk-0000-0000-0000-000000000001",
    "candidates": [
      {
        "userId": "11111111-0000-0000-0000-000000000004",
        "fullName": "Ana López",
        "matchScore": 95,
        "matchDetails": {
          "mandatorySkillsMatch": "4/4",
          "optionalSkillsMatch": "2/3",
          "averageSkillLevel": 4.5,
          "yearsExperience": 7
        },
        "strengths": [
          "Cumple todos los requisitos obligatorios",
          "Nivel experto en Java (5) y Spring Boot (5)"
        ],
        "gaps": [
          "No tiene skill en Docker (requerido nivel 3)"
        ],
        "recommendation": "HIGHLY RECOMMENDED - Candidata ideal"
      }
    ],
    "summary": {
      "bestMatch": "Ana López (95% match)",
      "averageScore": 82.67,
      "candidatesAbove90": 1
    }
  }
}
```

---

### POST `/agent/approve/{actionId}`

Aprueba una acción del agente (flujo HITL - Human In The Loop).

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Acción aprobada exitosamente"
}
```

---

### POST `/agent/reject/{actionId}`

Rechaza una acción del agente con motivo.

**Request:**
```json
{
  "reason": "El candidato ya está asignado a otro proyecto de alta prioridad."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Acción rechazada"
}
```

---

## 📦 Respuestas Estándar

### Respuesta Exitosa

```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": { ... },
  "timestamp": "2026-01-29T10:00:00Z"
}
```

### Respuesta de Error

```json
{
  "success": false,
  "message": "Descripción del error",
  "errorCode": "NOT_FOUND",
  "errors": {
    "campo": ["Mensaje de validación"]
  },
  "timestamp": "2026-01-29T10:00:00Z",
  "traceId": "00-abc123..."
}
```

---

## ❌ Códigos de Error

| Código HTTP | ErrorCode | Descripción |
|-------------|-----------|-------------|
| 400 | VALIDATION_ERROR | Datos de entrada inválidos |
| 401 | UNAUTHORIZED | Token inválido o expirado |
| 403 | FORBIDDEN | Sin permisos para la acción |
| 404 | NOT_FOUND | Recurso no encontrado |
| 409 | CONFLICT | Conflicto (ej: email duplicado) |
| 500 | INTERNAL_ERROR | Error interno del servidor |

---

## 🔄 Flujos de Uso Típicos

### Flujo 1: Onboarding de Empleado

```
1. POST /api/users                    → Admin crea usuario
2. PUT  /api/profile/me               → Empleado completa perfil
3. POST /api/employees/skills         → Empleado declara skills
4. PUT  /api/employees/skills/{id}/validate  → Manager valida skills
```

### Flujo 2: Asignación a Proyecto

```
1. POST /api/projects                 → Manager crea proyecto
2. POST /api/projects/{id}/reqs       → Manager define requisitos
3. POST /agent/match-candidates       → IA sugiere candidatos
4. POST /agent/approve/{actionId}     → Manager aprueba sugerencia
5. POST /api/assignments              → Manager asigna empleado
```

### Flujo 3: Postulación Voluntaria

```
1. GET  /api/projects?status=1        → Empleado ve proyectos activos
2. POST /api/projects/{id}/apply      → Empleado se postula
3. GET  /api/projects/{id}/applications  → Manager revisa postulaciones
4. PUT  /api/applications/{id}/review → Manager aprueba/rechaza
5. POST /api/assignments              → Manager asigna si aprobó
```

---

## 🔧 Configuración

### Headers Requeridos

```
Content-Type: application/json
Authorization: Bearer {token}  (excepto login/register)
```

### Ejemplo cURL - Login

```bash
curl -X POST https://localhost:7265/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@techcorp.com","password":"Password123!"}'
```

### Ejemplo cURL - Obtener Usuarios

```bash
curl -X GET https://localhost:7265/api/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9..."
```

---

## 📚 Referencias

- **Swagger UI**: https://localhost:7265/swagger
- **Archivo HTTP de pruebas**: [API/API.http](API/API.http)
- **Pruebas del Agente**: [API/Agent.http](API/Agent.http)
- **Script PowerShell**: [Scripts/Test-Agent.ps1](Scripts/Test-Agent.ps1)
