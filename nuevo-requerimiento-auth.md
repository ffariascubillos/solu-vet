**IMPORTANTE: NO IMPLEMENTES TODAVÍA EL LOGIN NI MODIFIQUES CÓDIGO.**

Antes de implementar cualquier parte del sistema de autenticación, quiero que analices el proyecto actual y propongas la arquitectura de **autenticación + multi-tenancy** de soluVet.

El objetivo de esta etapa es definir correctamente el modelo de negocio, las organizaciones, los usuarios, los roles y el aislamiento de datos antes de comenzar a implementar el auth.

## 1. Modelo de negocio

soluVet debe soportar inicialmente estos tipos de clientes:

* **Veterinario independiente:** 1 usuario.
* **Clínica veterinaria:** múltiples usuarios (por ejemplo, 4-5 o más).
* El diseño debe permitir aumentar la cantidad de usuarios de una organización en el futuro sin cambiar la arquitectura.

La idea principal es que **todo usuario pertenezca a una Organization**, incluso cuando se trate de un veterinario independiente.

Conceptualmente:

soluVet
│
└── Organization
│
├── Veterinario independiente
│   └── 1 usuario
│
└── Clínica
├── Veterinario
├── Veterinario
├── Recepción
└── ...

Cada Organization tendrá sus propios datos:

Organization
│
├── Users
├── Tutors
├── Pets
├── Medical Records
├── Appointments
└── otros datos pertenecientes al negocio

## 2. Multi-tenancy

Quiero evaluar y proponer una arquitectura **multi-tenant**.

La opción que quiero evaluar como principal es:

**Una base de datos PostgreSQL compartida → mismas tablas → aislamiento lógico mediante `organizationId`.**

Por ejemplo:

pets

| id | name     | organizationId |
| -- | -------- | -------------- |
| 1  | Firulais | org_001        |
| 2  | Luna     | org_001        |
| 3  | Rocky    | org_002        |

El backend debe garantizar que un usuario de `org_001` nunca pueda acceder, modificar o eliminar datos pertenecientes a `org_002`.

No quiero asumir que cada cliente tendrá una base de datos independiente ni un schema PostgreSQL independiente. Analiza si el modelo de base de datos compartida + `organizationId` es adecuado para el proyecto actual y explica sus ventajas, riesgos y posibles necesidades futuras de escalabilidad.

## 3. Organización

La `Organization` será la unidad principal de aislamiento de datos.

Todo usuario debe pertenecer a una `Organization`, incluso cuando se trate de un veterinario independiente.

### Ejemplo de veterinario independiente

**Organization**

* id: `org_001`
* name: `"Dr. Juan Pérez"`
* type: `INDEPENDENT`

**User**

* id: `user_001`
* organizationId: `org_001`
* role: `VETERINARIAN`

En este caso, el veterinario independiente tiene una Organization propia y es su único usuario.

---

### Ejemplo de clínica veterinaria

**Organization**

* id: `org_002`
* name: `"Clínica Veterinaria Patitas"`
* type: `CLINIC`

**Users**

**Administrador / propietario**

* id: `user_002`
* organizationId: `org_002`
* role: `OWNER`

**Veterinario**

* id: `user_003`
* organizationId: `org_002`
* role: `VETERINARIAN`

**Veterinario**

* id: `user_004`
* organizationId: `org_002`
* role: `VETERINARIAN`

**Recepcionista**

* id: `user_005`
* organizationId: `org_002`
* role: `RECEPTIONIST`

Todos estos usuarios pertenecen a la misma `Organization` (`org_002`), por lo que pueden trabajar sobre los datos de esa clínica según los permisos correspondientes a su rol.

Por ejemplo:

```text
Organization: org_002
"Clínica Veterinaria Patitas"
        │
        ├── user_002 → OWNER
        ├── user_003 → VETERINARIAN
        ├── user_004 → VETERINARIAN
        └── user_005 → RECEPTIONIST
```

Los datos de la clínica, como tutores, mascotas, fichas clínicas y citas, estarán asociados a `org_002` y deberán permanecer aislados de los datos de otras Organizations.

**Regla fundamental:**

`Organization` es la unidad principal de aislamiento de datos. Un usuario solo debe poder acceder y operar sobre los datos de las Organizations a las que pertenece y según los permisos de su rol.


## 4. Flujo de registro

Quiero evaluar estos flujos:

### Veterinario independiente

Crear cuenta
↓
Crear Organization
↓
Crear User asociado a la Organization
↓
Entrar a soluVet

### Clínica

Crear cuenta
↓
Crear Organization
↓
Crear User administrador/owner
↓
Administrador invita o agrega usuarios
↓
Veterinarios / recepción ingresan a soluVet

Analiza si estos flujos son correctos o si propones una alternativa mejor.

## 5. Roles y permisos

Propón inicialmente los roles necesarios para soluVet.

Como mínimo quiero evaluar:

* OWNER / ADMIN
* VETERINARIAN
* RECEPTIONIST

No implementes todavía un sistema complejo de permisos. Quiero primero definir correctamente el modelo y determinar qué responsabilidades debería tener cada rol.

## 6. Auth

Analiza cómo debería relacionarse:

User
→ Organization
→ Role
→ Authentication / Session / Token

Revisa el sistema actual del proyecto y determina qué entidades/modelos ya existen y cuáles deberían modificarse o crearse.

## 7. Análisis del proyecto actual

Antes de proponer cambios:

1. Revisa la estructura actual del proyecto.
2. Revisa `CLAUDE.md` y las instrucciones existentes.
3. Revisa el schema actual de Prisma.
4. Identifica las entidades relacionadas con usuarios, tutores, mascotas, fichas, citas y cualquier otra entidad existente.
5. Identifica qué entidades deberían pertenecer a una Organization.
6. Identifica posibles problemas o decisiones del modelo actual que puedan dificultar el multi-tenancy.
7. No modifiques ningún archivo.

## 8. Entregable

Quiero que tu propuesta incluya:

### A. Arquitectura propuesta

Explica cómo deberían relacionarse:

* Organization
* User
* Role
* Authentication / Session
* Tutor
* Pet
* Medical Record
* Appointment
* demás entidades relevantes

### B. Modelo de datos

Propón las entidades y relaciones necesarias.

Si corresponde, muestra ejemplos de modelos Prisma, pero **no los implementes todavía**.

### C. Flujo de autenticación

Describe paso a paso:

* Registro.
* Login.
* Obtención de Organization.
* Sesión/token.
* Acceso a recursos.
* Logout.
* Invitación de usuarios a una clínica.

### D. Aislamiento de datos

Explica exactamente cómo garantizarías que:

`organization A ≠ organization B`

y cómo debería aplicarse esto en las consultas y operaciones CRUD del backend.

### E. Escalabilidad

Evalúa si esta arquitectura seguirá siendo adecuada con:

* 10 organizaciones.
* 100 organizaciones.
* 1.000 organizaciones.
* 10.000 organizaciones.

No quiero sobre-ingeniería para el MVP, pero sí quiero evitar tomar decisiones que después obliguen a reconstruir completamente el sistema.

### F. Decisiones y recomendaciones

Termina con una sección:

**"Decisiones que necesito aprobar antes de implementar"**

Enumera claramente las decisiones arquitectónicas que debo revisar y aprobar.

---

**REGLA PRINCIPAL:**

No implementes login, no modifiques Prisma, no crees migraciones y no modifiques ningún archivo todavía.

Primero quiero revisar y aprobar la propuesta arquitectónica. Después de mi aprobación podremos pasar a la implementación.
