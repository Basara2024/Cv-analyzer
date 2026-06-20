# Matchia — Plataforma de Análisis de CV con IA

> Plataforma SaaS de análisis inteligente de hojas de vida, enfocada actualmente en el **Dashboard Empresarial** para equipos de reclutamiento.

**Producción:** [https://matchia.co](https://matchia.co)

---

## Tabla de contenidos

1. [Descripción general](#1-descripción-general)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Arquitectura](#3-arquitectura)
4. [Estructura del proyecto](#4-estructura-del-proyecto)
5. [Setup local](#5-setup-local)
6. [Variables de entorno](#6-variables-de-entorno)
7. [Checklist de accesos para onboarding](#7-checklist-de-accesos-para-onboarding)
8. [Trabajar desde un equipo nuevo](#8-trabajar-desde-un-equipo-nuevo)
9. [Base de datos](#9-base-de-datos)
10. [Sistema de roles y permisos](#10-sistema-de-roles-y-permisos)
11. [API endpoints](#11-api-endpoints)
12. [Deploy en producción](#12-deploy-en-producción)
13. [Planes y monetización](#13-planes-y-monetización)
14. [Sprints completados](#14-sprints-completados)
15. [Roadmap pendiente](#15-roadmap-pendiente)
16. [Flujo de trabajo y convenciones](#16-flujo-de-trabajo-y-convenciones)

---

## 1. Descripción general

Matchia es una plataforma web que permite analizar hojas de vida (CVs) usando inteligencia artificial. El sistema extrae texto de archivos PDF, los envía a la API de **Google Gemini 2.5 Flash** y devuelve un análisis detallado con puntuaciones, fortalezas, áreas de mejora y recomendaciones.

### Enfoque actual del desarrollo

> **El foco de desarrollo activo es el Dashboard Empresarial (plan Business).** El plan Individual Pro ya tiene su base funcional (análisis, historial, límites) pero sus funcionalidades premium (export PDF, reescritura inteligente, dropdowns de enfoque) se implementarán **después** de que el plan Business esté completo, en producción estable y generando ingresos. El botón "Actualizar a Pro" del dashboard personal redirige a `/coming-soon` con una waitlist activa mientras tanto.

### Casos de uso — Plan Individual (Free)
- Análisis de CV propio con puntuación general y por categorías
- Historial de análisis anteriores
- 3 análisis gratuitos por cuenta (igual para registro por email u OAuth)

### Casos de uso — Plan Business (en desarrollo activo)
- Subida masiva de hasta 20 CVs simultáneos
- Rankeo automático de candidatos contra descripción del puesto (IA)
- Gestión de puestos de trabajo (crear, editar, exportar a PDF/texto)
- Sistema de entrevistas internas con feedback y evaluación por estrellas
- Pool de talento reutilizable con filtros avanzados
- Campañas de mailing masivo a candidatos descartados (Resend)
- Dashboard compartido por equipo con sistema de roles
- Notas e historial por candidato

---

## 2. Stack tecnológico

| Capa | Tecnología | Servicio de deploy |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript | Netlify |
| Backend | Node.js + Express.js | AWS EC2 (Ubuntu 24) |
| Base de datos | PostgreSQL + Prisma ORM | Supabase |
| IA | **Google Gemini 2.5 Flash** | Google AI Studio |
| Autenticación | NextAuth.js | — |
| Envío de emails | Resend (dominio verificado matchia.co) | — |
| Servidor web | Nginx + Certbot (SSL) | AWS EC2 |
| Proceso manager | PM2 | AWS EC2 |
| DNS / Dominio | Hostgator (zona DNS) | matchia.co |

### Proveedores OAuth configurados
- Google
- Twitter / X (OAuth 1.0a)
- LinkedIn (OpenID Connect)

---

## 3. Arquitectura

```
Usuario
  │
  ▼
Netlify (matchia.co)
  │  Next.js 14 — SSR/SSG
  │  NextAuth.js — autenticación OAuth
  │
  ▼  HTTPS (axios)
AWS EC2 (18.227.7.206.nip.io)
  │  Nginx — reverse proxy SSL
  │  Express.js — API REST en puerto 5000
  │  PM2 — process manager
  │  Multer — manejo de archivos PDF
  │
  ├──► Supabase (PostgreSQL)
  │     Prisma ORM — queries y migraciones
  │
  ├──► Google Gemini 2.5 Flash API
  │     Análisis individual y masivo de CVs
  │     Rankeo de candidatos vs descripción de puesto
  │
  └──► Resend API
        Envío de campañas de mailing masivo
        Dominio verificado: matchia.co
```

---

## 4. Estructura del proyecto

```
cv_analizer/
├── README.md                    → este archivo
├── frontend/                    → Next.js 14
│   ├── app/
│   │   ├── api/auth/[...nextauth]/
│   │   │   └── route.ts         → NextAuth config (Google, Twitter, LinkedIn)
│   │   ├── auth/                → Login / Registro
│   │   ├── dashboard/           → Dashboard personal (plan individual)
│   │   ├── business/            → Dashboard empresarial (plan business)
│   │   │   ├── components/
│   │   │   │   └── BusinessLayout.tsx
│   │   │   ├── dashboard/       → Vista ejecutiva con KPIs
│   │   │   ├── positions/       → Gestión de vacantes + exportar PDF/texto
│   │   │   ├── candidates/      → Subida masiva y análisis con ranking IA
│   │   │   ├── interviews/      → Sistema de entrevistas internas
│   │   │   ├── pool/            → Pool de talento con filtros
│   │   │   ├── campaigns/       → Campañas de mailing masivo
│   │   │   ├── team/            → Gestión del equipo y roles
│   │   │   ├── reports/         → Reportes y métricas (pendiente)
│   │   │   └── settings/        → Configuración de empresa (pendiente)
│   │   ├── coming-soon/         → Waitlist plan Pro individual
│   │   └── privacy/             → Políticas de privacidad
│   └── lib/
│       └── api.ts               → Instancia axios con interceptor JWT
│
└── server/                      → Node.js + Express
    ├── controllers/
    │   ├── authController.js
    │   ├── analyzeController.js
    │   ├── organizationController.js
    │   ├── jobPositionController.js
    │   ├── candidateController.js   → bulkAnalyze, getPool, addToPosition
    │   ├── interviewController.js
    │   └── campaignController.js    → createCampaign, sendCampaign (Resend)
    ├── routes/
    │   ├── authRoutes.js
    │   ├── analyzeRoutes.js
    │   ├── organizationRoutes.js    → agrupa positions, candidates, pool, interviews, campaigns
    │   └── waitlistRoutes.js
    ├── middleware/
    │   ├── authMiddleware.js
    │   └── fileValidation.js
    ├── services/
    │   └── aiService.js             → Google Gemini 2.5 Flash
    ├── config/
    │   ├── db.js
    │   └── *.sql                    → Schemas SQL de referencia
    ├── prisma/
    │   └── schema.prisma
    └── app.js
```

---

## 5. Setup local

### Requisitos previos
- Node.js v18+
- npm v9+
- Acceso a Supabase, Google AI Studio y Resend (ver sección de accesos)

### 1. Clonar el repositorio
```bash
git clone https://github.com/Basara2024/Cv-analyzer.git
cd Cv-analyzer
```

### 2. Backend
```bash
cd server
npm install
# Crear .env manualmente (ver Variables de entorno)
npx prisma db pull
npx prisma generate
npm run dev
```
Corre en `http://localhost:5000`

### 3. Frontend
```bash
cd ../frontend
npm install
# Crear .env.local manualmente (ver Variables de entorno)
npm run dev
```
Corre en `http://localhost:3000`

---

## 6. Variables de entorno

### Backend — `server/.env`

```env
PORT=5000
NODE_ENV=development

# Supabase PostgreSQL (usar connection pooler puerto 6543)
DATABASE_URL=postgresql://postgres.xxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

JWT_SECRET=clave_secreta_larga_aleatoria
JWT_EXPIRES_IN=7d

# Google Gemini 2.5 Flash
GEMINI_API_KEY=AIza...

# Resend (campañas de mailing)
RESEND_API_KEY=re_xxxxxxxxxxxx

CLIENT_URL=https://matchia.co
```

### Frontend — `frontend/.env.local`

```env
NEXTAUTH_URL=https://matchia.co
NEXTAUTH_SECRET=clave_secreta_larga

NEXT_PUBLIC_API_URL=https://18.227.7.206.nip.io/api

GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...

TWITTER_CLIENT_ID=API_Key
TWITTER_CLIENT_SECRET=API_Key_Secret

LINKEDIN_CLIENT_ID=xxx
LINKEDIN_CLIENT_SECRET=xxx
```

> **Nunca subir `.env` ni `.env.local` a GitHub.** Están protegidos por `.gitignore`.

---

## 7. Checklist de accesos para onboarding

Si una persona nueva (tú en otro equipo, o un colaborador) va a trabajar en el proyecto, esto es lo que necesita según su rol:

### Mínimo para programar (cualquier colaborador técnico)

| Elemento | Cómo se obtiene |
|---|---|
| Repositorio GitHub | Invitación como colaborador en `Basara2024/Cv-analyzer` |
| `server/.env` | Copiar desde un equipo que ya lo tenga — **nunca está en GitHub** |
| `frontend/.env.local` | Copiar desde un equipo que ya lo tenga — **nunca está en GitHub** |

### Si necesita acceso al servidor (SSH)

| Elemento | Cómo se obtiene |
|---|---|
| `cv-analyzer-key.pem` | Copiar por canal seguro (USB, Drive privado) — **nunca por canales públicos** |

### Si necesita modificar infraestructura

| Servicio | Acción recomendada |
|---|---|
| Supabase | Invitar como colaborador del proyecto (no compartir contraseña) |
| Netlify | Invitar como colaborador del sitio |
| AWS | Crear usuario IAM individual (evitar compartir la cuenta root) |
| Resend | Invitar como miembro del team en Resend |
| Hostgator (DNS) | Compartir credenciales con extremo cuidado, o gestionar tú los cambios de DNS directamente |
| Google Cloud Console / Twitter Dev / LinkedIn Dev | Agregar como colaborador del proyecto OAuth si necesita modificar redirects |

**Regla general:** preferir siempre invitaciones de colaborador sobre compartir contraseñas. Los 3 archivos sensibles (`.env`, `.env.local`, `.pem`) son la única excepción real porque no tienen sistema de invitación — deben transferirse manualmente por un canal seguro.

---

## 8. Trabajar desde un equipo nuevo

**1. Copiar la llave SSH**
Transfiere `cv-analyzer-key.pem` desde el equipo original (USB, Drive privado). En Mac/Linux:
```bash
chmod 400 cv-analyzer-key.pem
```

**2. Clonar el repositorio**
```bash
git clone https://github.com/Basara2024/Cv-analyzer.git
cd Cv-analyzer
```

**3. Recrear los archivos de entorno**
Copia manualmente `server/.env` y `frontend/.env.local` desde el equipo original.

**4. Conectarte al servidor**
```bash
ssh -i "ruta/a/cv-analyzer-key.pem" ubuntu@18.227.7.206
```

**5. Instalar dependencias**
```bash
cd server && npm install && npx prisma generate
cd ../frontend && npm install
```

A partir de aquí, el flujo (`git push` desde tu equipo → `git pull` + `pm2 restart` en el servidor) es idéntico sin importar la computadora.

---

## 9. Base de datos

### Tablas principales

| Tabla | Descripción |
|---|---|
| `users` | Usuarios — plan, límites de análisis, provider OAuth |
| `analyses` | Historial de análisis individuales (JSONB) |
| `organizations` | Empresas registradas en plan Business |
| `org_members` | Miembros por organización — roles: `owner`, `admin`, `recruiter` |
| `job_positions` | Puestos de trabajo |
| `candidates` | CVs analizados — score IA, ranking 1-5, estado, `in_pool` |
| `candidate_notes` | Notas del reclutador por candidato |
| `interviews` | Entrevistas — tipo, fecha, entrevistador, feedback, evaluación 1-5 |
| `email_campaigns` | Campañas de mailing masivo |
| `campaign_recipients` | Destinatarios por campaña — estado de envío |
| `waitlist` | Lista de espera para el plan Pro individual |

### Aplicar cambios de esquema

```bash
npx prisma db pull   # sincroniza schema.prisma con la BD
npx prisma generate  # regenera el cliente Prisma
pm2 restart cv-analyzer
```

### Límites de análisis (plan individual)

| Tipo de registro | Análisis gratis | Plan Pro |
|---|---|---|
| Email / contraseña | 3 | Ilimitado *(pendiente Stripe)* |
| OAuth (Google/Twitter/LinkedIn) | 3 | Ilimitado *(pendiente Stripe)* |

Protección activa:
- Rate limit: máximo 5 requests por hora por IP

> Nota: el cooldown de 30 min y el bloqueo de 24h fueron removidos del diseño original — el límite de 3 intentos es suficiente y reduce complejidad innecesaria.

---

## 10. Sistema de roles y permisos

El sistema de roles dentro de una organización (plan Business) tiene **dos niveles reales**:

| Rol | Permisos |
|---|---|
| `owner` / `admin` | Mismo nivel de poder. Acceso total: puestos, candidatos, pool, campañas, entrevistas **y Gestión de Equipo** (agregar/eliminar miembros, cambiar roles) |
| `recruiter` | Acceso completo a todo el proceso operativo de HR (puestos, candidatos, pool, campañas, entrevistas). **Sin acceso** a Gestión de Equipo |

> El rol `viewer` fue **eliminado completamente del sistema** (código, base de datos y CHECK constraints) — el modelo de negocio busca trabajo conjunto donde cada reclutador tiene autonomía operativa total, sin un rol de "solo lectura".

`owner` y `admin` se tratan como equivalentes porque distintos managers de distintas áreas (ej. un manager de Tech y un manager de Ventas) necesitan el mismo nivel de control sobre sus propios procesos de contratación, sin depender de una sola persona (quien originalmente pagó la suscripción).

---

## 11. API endpoints

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/social-login
GET    /api/auth/me
PUT    /api/auth/update-profile
```

### Análisis individual
```
POST   /api/analyze
GET    /api/analyze/history
GET    /api/analyze/:id
DELETE /api/analyze/:id
```

### Organizaciones y equipo
```
POST   /api/organizations
GET    /api/organizations/my
GET    /api/organizations/:orgId/members
POST   /api/organizations/:orgId/members
DELETE /api/organizations/:orgId/members/:userId
PUT    /api/organizations/:orgId/members/:userId/role
```

### Puestos de trabajo
```
GET    /api/organizations/:orgId/positions
POST   /api/organizations/:orgId/positions
PUT    /api/organizations/:orgId/positions/:id
DELETE /api/organizations/:orgId/positions/:id
```

### Candidatos
```
POST   /api/organizations/:orgId/candidates/bulk
GET    /api/organizations/:orgId/candidates
PUT    /api/organizations/:orgId/candidates/:id
POST   /api/organizations/:orgId/candidates/:id/notes
PUT    /api/organizations/:orgId/candidates/:id/add-to-position
```

### Pool de talento
```
GET    /api/organizations/:orgId/pool
```
Filtros soportados (query params): `skill`, `nivel`, `min_experience`, `search`

### Entrevistas
```
POST   /api/organizations/:orgId/interviews
GET    /api/organizations/:orgId/interviews
PUT    /api/organizations/:orgId/interviews/:id
DELETE /api/organizations/:orgId/interviews/:id
```

### Campañas de mailing
```
GET    /api/organizations/:orgId/campaigns
POST   /api/organizations/:orgId/campaigns
POST   /api/organizations/:orgId/campaigns/:id/send
GET    /api/organizations/:orgId/campaigns/suggested-candidates
```

### Waitlist y salud
```
POST   /api/waitlist
GET    /api/health
```

---

## 12. Deploy en producción

### Frontend — Netlify

- Conectado al repositorio GitHub, deploy automático en cada push a `main`
- Build: `npm run build` · Base directory: `frontend`
- Dominio: `matchia.co` y `www.matchia.co` apuntan via DNS a Netlify (ver sección DNS abajo)
- SSL: certificado Let's Encrypt gestionado por Netlify, auto-renovable

### Backend — AWS EC2

**Datos del servidor:**
- IP elástica: `18.227.7.206`
- Dominio SSL: `18.227.7.206.nip.io`
- SO: Ubuntu 24 · Instancia: t3.micro

```bash
# Conectarse
ssh -i "cv-analyzer-key.pem" ubuntu@18.227.7.206

# Actualizar código (forma segura, evita conflictos de stash acumulados)
cd Cv-analyzer/server
git fetch origin
git reset --hard origin/main
npx prisma generate
pm2 restart cv-analyzer

# Logs y estado
pm2 logs cv-analyzer --lines 30
pm2 status
```

> **Importante:** usar `git fetch origin && git reset --hard origin/main` en vez de `git stash && git pull` evita que stashes acumulados causen que archivos no se actualicen correctamente (bug detectado y corregido durante el Sprint 4 — las rutas de campañas no llegaban al servidor por esta razón).

### Base de datos — Supabase
- Proyecto: `jzpcrrfcgvsxvqxvhcaq` · Región: US East
- Usar siempre el **connection pooler** (puerto 6543)

### DNS — Hostgator

El dominio `matchia.co` se administra en la zona DNS de Hostgator. Registros activos:

| Tipo | Nombre | Valor | Propósito |
|---|---|---|---|
| A | `matchia.co` | `75.2.60.5` | Apunta el dominio raíz a Netlify |
| CNAME | `www` | `[proyecto].netlify.app.` | Apunta www a Netlify |
| TXT | `resend._domainkey` | (clave DKIM) | Verificación de dominio en Resend |
| MX | `send` | `feedback-smtp.us-east-1.amazonses.com` | Envío de correos vía Resend |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | SPF para Resend |
| TXT | `_dmarc` | `v=DMARC1; p=none;` | DMARC para Resend |

> **Nota sobre Cloudflare:** existe intención de migrar el DNS a Cloudflare por seguridad adicional, pero los nameservers actuales siguen siendo los de Hostgator. Si se migra en el futuro, estos mismos 6 registros deben recrearse en Cloudflare **antes** de cambiar los nameservers.

### OAuth — Redirects configurados
```
https://matchia.co/api/auth/callback/google
https://matchia.co/api/auth/callback/twitter
https://matchia.co/api/auth/callback/linkedin
```

### Resend — Dominio verificado
`matchia.co` está verificado en Resend (DKIM, SPF, DMARC). Los correos de campañas se envían desde `reclutamiento@matchia.co`.

---

## 13. Planes y monetización

| Plan | Precio mensual | Precio anual | Estado | Características |
|---|---|---|---|---|
| Free | $0 | — | ✅ Activo | 3 análisis gratuitos |
| Individual Pro | $10/mes | $100/año | 🔜 Después del Business | Análisis ilimitados, export PDF, reescritura inteligente |
| Business | $30/mes | $300/año | 🔧 En desarrollo activo | Dashboard empresarial completo |

> **Prioridad de negocio:** Business primero. El botón "Actualizar a Pro" (individual) redirige a `/coming-soon`. Stripe se integrará para ambos planes simultáneamente una vez el Business esté terminado y estable en producción.

---

## 14. Sprints completados

### Sprint 1 — Fundación del dashboard empresarial ✅
- Layout con sidebar colapsable (9 secciones) y header con buscador
- Dashboard ejecutivo con KPIs reales desde la BD

### Sprint 2 — Core del producto ✅
- Vista de Puestos: crear, editar, pausar, cerrar, exportar a PDF/texto
- Vista de Candidatos: subida masiva (20 CVs), análisis con Gemini 2.5 Flash, ranking 1-5, notas, cambio de estado

### Sprint 3 — Valor diferencial ✅
- Sistema de Entrevistas: agendar, tipo (RH/Manager/Técnica), feedback, evaluación por estrellas, visibilidad completa del candidato para el entrevistador
- Pool de Talento: filtros por skill/nivel/experiencia, reutilización con un clic hacia una vacante activa
- Notas e historial por candidato

### Sprint 4 — Comunicación y reportes 🔧 (en progreso)
- ✅ Campañas de mailing masivo (Resend + dominio verificado matchia.co, flujo de 3 pasos: puesto → candidatos sugeridos → mensaje)
- ✅ Gestión de equipo: roles simplificados a `owner`/`admin` (igual poder) y `recruiter`, eliminación completa del rol `viewer`
- ⏳ Reportes y métricas avanzadas — pendiente

### Funcionalidades base (previas a sprints)
- Auth: email/contraseña + OAuth (Google, Twitter, LinkedIn)
- Análisis individual con Gemini, historial, límites por plan
- Validación de PDF en 3 capas, rate limiting por IP
- Coming-soon con waitlist, políticas de privacidad
- Migración completa de MySQL/Sequelize/React+Vite a Supabase/Prisma/Next.js

---

## 15. Roadmap pendiente

### Sprint 4 (cerrar)
- [ ] Reportes avanzados: tiempo promedio de contratación, tasa de conversión, costo por contratación
- [ ] Configuración de la empresa: editar datos, logo, NIT

### Sprint 5 — Monetización y pulido
- [ ] Integración con Stripe (mensual y anual, ambos planes)
- [ ] Popup de registro de empresa al activar plan Business
- [ ] Funcionalidades premium del plan Individual Pro (dropdowns de área/enfoque, export PDF con branding, reescritura inteligente)
- [ ] Búsqueda global en el dashboard empresarial
- [ ] Centro de notificaciones (entrevistas pendientes, candidatos nuevos)
- [ ] CAPTCHA en registro (hCaptcha)
- [ ] Recuperación de contraseña por email
- [ ] Migración completa de DNS a Cloudflare (si se decide)
- [ ] Testing completo (Jest + Playwright)

---

## 16. Flujo de trabajo y convenciones

### Ramas
- `main` — producción (Netlify auto-deploy en cada push)

### Flujo de deploy

```bash
# 1. Cambios locales
git add .
git commit -m "feat: descripción clara del cambio"
git push
# Netlify despliega el frontend automáticamente

# 2. Backend — actualizar en AWS
ssh -i "cv-analyzer-key.pem" ubuntu@18.227.7.206
cd Cv-analyzer/server
git fetch origin && git reset --hard origin/main
npx prisma generate   # solo si hubo cambios de BD
pm2 restart cv-analyzer
```

### Convención de commits

| Prefijo | Uso |
|---|---|
| `feat:` | Nueva funcionalidad |
| `fix:` | Corrección de bug |
| `style:` | Cambios de CSS/diseño |
| `refactor:` | Reorganización de código |
| `docs:` | Documentación |
| `chore:` | Mantenimiento |

---

*Matchia — Next.js, Node.js, Supabase, Google Gemini 2.5 Flash, Resend*
