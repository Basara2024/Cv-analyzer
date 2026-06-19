# Matchia — Plataforma de Análisis de CV con IA

> Plataforma SaaS de análisis inteligente de hojas de vida para candidatos individuales y equipos de reclutamiento empresarial.

**Producción:** [https://matchia.co](https://matchia.co)

---

## Tabla de contenidos

1. [Descripción general](#1-descripción-general)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Arquitectura](#3-arquitectura)
4. [Estructura del proyecto](#4-estructura-del-proyecto)
5. [Setup local](#5-setup-local)
6. [Variables de entorno](#6-variables-de-entorno)
7. [Base de datos](#7-base-de-datos)
8. [API endpoints](#8-api-endpoints)
9. [Deploy en producción](#9-deploy-en-producción)
10. [Planes y monetización](#10-planes-y-monetización)
11. [Sprints completados](#11-sprints-completados)
12. [Roadmap pendiente](#12-roadmap-pendiente)

---

## 1. Descripción general

Matchia es una plataforma web que permite a usuarios individuales y empresas analizar hojas de vida (CVs) usando inteligencia artificial. El sistema extrae texto de archivos PDF, los envía a la API de Google Gemini 2.5 Flash y devuelve un análisis detallado con puntuaciones, fortalezas, áreas de mejora y recomendaciones personalizadas.

### Casos de uso principales

**Plan Individual (Free / Pro)**
- Análisis de CV propio con puntuación general y por categorías
- Historial de análisis anteriores
- Exportación de resultados

**Plan Business**
- Subida masiva de hasta 20 CVs simultáneos
- Rankeo automático de candidatos contra descripción del puesto (IA)
- Gestión de puestos de trabajo
- Sistema de entrevistas internas con feedback
- Dashboard compartido por equipo con roles
- Pool de talento reutilizable
- Campañas de mailing masivo a candidatos del pool

---

## 2. Stack tecnológico

| Capa | Tecnología | Servicio de deploy |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript | Netlify |
| Backend | Node.js + Express.js | AWS EC2 (Ubuntu 24) |
| Base de datos | PostgreSQL + Prisma ORM | Supabase |
| IA | Google Gemini 2.5 Flash | Google AI Studio |
| Autenticación | NextAuth.js | — |
| Servidor web | Nginx + Certbot (SSL) | AWS EC2 |
| Proceso manager | PM2 | AWS EC2 |

### Proveedores OAuth configurados
- Google
- Twitter / X
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
  └──► Google Gemini 2.0 Flash API
        Análisis individual y masivo de CVs
        Rankeo de candidatos vs descripción de puesto
```

---

## 4. Estructura del proyecto

```
cv_analizer/
├── frontend/                    → Next.js 14
│   ├── app/
│   │   ├── api/auth/[...nextauth]/
│   │   │   └── route.ts         → NextAuth config (Google, Twitter, LinkedIn)
│   │   ├── auth/                → Login / Registro
│   │   ├── dashboard/           → Dashboard personal (plan individual)
│   │   │   ├── components/
│   │   │   │   ├── CVHistory.tsx
│   │   │   │   ├── CVItem.tsx
│   │   │   │   └── AnalysisLimitBanner.tsx
│   │   │   └── page.tsx
│   │   ├── business/            → Dashboard empresarial (plan business)
│   │   │   ├── components/
│   │   │   │   └── BusinessLayout.tsx
│   │   │   ├── dashboard/       → Vista ejecutiva con KPIs
│   │   │   ├── positions/       → Gestión de vacantes
│   │   │   ├── candidates/      → Subida masiva y análisis
│   │   │   ├── interviews/      → Sistema de entrevistas
│   │   │   ├── pool/            → Pool de talento
│   │   │   ├── campaigns/       → Campañas de mailing
│   │   │   ├── team/            → Gestión del equipo
│   │   │   ├── reports/         → Reportes y métricas
│   │   │   └── settings/        → Configuración de empresa
│   │   ├── coming-soon/         → Página waitlist plan Pro
│   │   └── privacy/             → Políticas de privacidad
│   └── lib/
│       └── api.ts               → Instancia axios con interceptor JWT
│
└── server/                      → Node.js + Express
    ├── controllers/
    │   ├── authController.js    → register, login, social-login, me
    │   ├── analyzeController.js → analyze, history, get, delete
    │   ├── organizationController.js
    │   ├── jobPositionController.js
    │   ├── candidateController.js → bulkAnalyze, getCandidates, updateCandidate, addNote
    │   └── interviewController.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── analyzeRoutes.js
    │   ├── organizationRoutes.js
    │   ├── interviewRoutes.js
    │   └── waitlistRoutes.js
    ├── middleware/
    │   ├── authMiddleware.js    → JWT protect
    │   ├── fileValidation.js   → PDF validation (MIME + magic number)
    │   └── analysisLimits.js   → Rate limiting + plan limits
    ├── services/
    │   └── aiService.js        → Google Gemini API calls
    ├── config/
    │   ├── db.js               → Prisma client
    │   └── *.sql               → Schemas SQL de referencia
    ├── prisma/
    │   └── schema.prisma
    └── app.js
```

---

## 5. Setup local

### Requisitos previos
- Node.js v18+
- npm v9+
- Cuenta en Supabase con proyecto creado
- API Key de Google Gemini (aistudio.google.com)

### 1. Clonar el repositorio

```bash
git clone https://github.com/Basara2024/Cv-analyzer.git
cd Cv-analyzer
```

### 2. Configurar el backend

```bash
cd server
npm install
cp .env.example .env
# Edita el .env con tus credenciales reales
npx prisma db pull
npx prisma generate
npm run dev
```

El servidor corre en `http://localhost:5000`

### 3. Configurar el frontend

```bash
cd ../frontend
npm install
# Crea el archivo .env.local con las variables necesarias
npm run dev
```

El frontend corre en `http://localhost:3000`

---

## 6. Variables de entorno

### Backend — `server/.env`

```env
# Servidor
PORT=5000
NODE_ENV=development

# Supabase PostgreSQL (usar connection pooler puerto 6543)
DATABASE_URL=postgresql://postgres.xxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# JWT
JWT_SECRET=clave_secreta_larga_aleatoria
JWT_EXPIRES_IN=7d

# Google Gemini IA
GEMINI_API_KEY=AIza...

# Frontend (CORS)
CLIENT_URL=https://matchia.co
```

### Frontend — `frontend/.env.local`

```env
# NextAuth
NEXTAUTH_URL=https://matchia.co
NEXTAUTH_SECRET=clave_secreta_larga

# Backend API
NEXT_PUBLIC_API_URL=https://18.227.7.206.nip.io/api

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...

# Twitter OAuth 1.0a
TWITTER_CLIENT_ID=API_Key
TWITTER_CLIENT_SECRET=API_Key_Secret

# LinkedIn OAuth (OpenID Connect)
LINKEDIN_CLIENT_ID=xxx
LINKEDIN_CLIENT_SECRET=xxx
```

> **Importante:** Nunca subir los archivos `.env` ni `.env.local` al repositorio. Están protegidos por `.gitignore`.

---

## 7. Base de datos

### Tablas principales

| Tabla | Descripción |
|---|---|
| `users` | Usuarios registrados — plan, límites de análisis, provider OAuth |
| `analyses` | Historial de análisis individuales con resultado en JSONB |
| `organizations` | Empresas registradas en el plan Business |
| `org_members` | Miembros de cada organización con roles (owner/admin/recruiter/viewer) |
| `job_positions` | Puestos de trabajo creados por la empresa |
| `candidates` | CVs analizados vinculados a puestos — score IA y ranking 1-5 |
| `candidate_notes` | Notas del reclutador por candidato |
| `interviews` | Entrevistas agendadas con tipo, fecha, entrevistador, feedback |
| `email_campaigns` | Campañas de mailing masivo |
| `campaign_recipients` | Destinatarios por campaña |
| `waitlist` | Lista de espera para el plan Pro |

### Ejecutar schemas SQL
Los archivos `.sql` en `server/config/` son de referencia. Para aplicar cambios nuevos usar el SQL Editor de Supabase directamente, luego:

```bash
npx prisma db pull   # sincroniza schema.prisma con la BD
npx prisma generate  # regenera el cliente Prisma
pm2 restart cv-analyzer
```

### Límites de análisis por plan

| Tipo de registro | Análisis gratis | Plan Pro |
|---|---|---|
| Email / contraseña | 3 | Ilimitado |
| OAuth (Google/Twitter/LinkedIn) | 3 | Ilimitado |

Protecciones adicionales:
- Rate limit: máximo 5 requests por hora por IP

---

## 8. API endpoints

### Auth
```
POST   /api/auth/register          → Registro con email y contraseña
POST   /api/auth/login             → Login con email y contraseña
POST   /api/auth/social-login      → Login con proveedor OAuth (Google/Twitter/LinkedIn)
GET    /api/auth/me                → Datos del usuario autenticado
PUT    /api/auth/update-profile    → Actualizar perfil
```

### Análisis individual
```
POST   /api/analyze                → Analizar un CV (PDF) — requiere JWT
GET    /api/analyze/history        → Historial de análisis del usuario
GET    /api/analyze/:id            → Obtener análisis específico
DELETE /api/analyze/:id            → Eliminar análisis
```

### Organizaciones
```
POST   /api/organizations                         → Crear organización
GET    /api/organizations/my                      → Obtener organización del usuario
GET    /api/organizations/:orgId/members          → Listar miembros
POST   /api/organizations/:orgId/members          → Agregar miembro
DELETE /api/organizations/:orgId/members/:userId  → Eliminar miembro
```

### Puestos de trabajo
```
GET    /api/organizations/:orgId/positions              → Listar puestos
POST   /api/organizations/:orgId/positions              → Crear puesto
PUT    /api/organizations/:orgId/positions/:id          → Editar puesto
DELETE /api/organizations/:orgId/positions/:id          → Eliminar puesto
```

### Candidatos
```
POST   /api/organizations/:orgId/candidates/bulk        → Subida masiva (hasta 20 CVs)
GET    /api/organizations/:orgId/candidates             → Listar candidatos
PUT    /api/organizations/:orgId/candidates/:id         → Actualizar estado/datos
POST   /api/organizations/:orgId/candidates/:id/notes   → Agregar nota
```

### Entrevistas
```
POST   /api/organizations/:orgId/interviews             → Agendar entrevista
GET    /api/organizations/:orgId/interviews             → Listar entrevistas
PUT    /api/organizations/:orgId/interviews/:id         → Actualizar / agregar feedback
DELETE /api/organizations/:orgId/interviews/:id         → Eliminar entrevista
```

### Waitlist
```
POST   /api/waitlist               → Registrar email en lista de espera
```

### Health check
```
GET    /api/health                 → Estado del servidor
```

---

## 9. Deploy en producción

### Frontend — Netlify

1. Conectar repositorio GitHub en Netlify
2. Configurar build:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend`
3. Agregar variables de entorno en Netlify → Environment variables
4. Archivo `netlify.toml` en la raíz configura el plugin de Next.js

### Backend — AWS EC2

**Datos del servidor:**
- IP elástica: `18.227.7.206`
- Dominio SSL: `18.227.7.206.nip.io`
- SO: Ubuntu 24
- Instancia: t3.micro

**Comandos de mantenimiento:**

```bash
# Conectarse al servidor
ssh -i "C:\Users\AngelDevelop\cv-analyzer-key.pem" ubuntu@18.227.7.206

# Actualizar código
cd Cv-analyzer/server
git stash
git pull
npx prisma generate
pm2 restart cv-analyzer

# Ver logs en tiempo real
pm2 logs cv-analyzer --lines 30

# Ver estado del proceso
pm2 status
```

**Servicios corriendo en el servidor:**
- `nginx` — reverse proxy HTTPS en puerto 443 → 5000
- `pm2` — mantiene el servidor Node.js corriendo 24/7
- `certbot` — SSL automático con Let's Encrypt (renueva cada 90 días)

### Base de datos — Supabase

- Proyecto: `jzpcrrfcgvsxvqxvhcaq`
- Región: US East
- Usar siempre el **connection pooler** (puerto 6543) en el `DATABASE_URL` del servidor

### OAuth — Redirects configurados

Para cada proveedor, las URIs de callback registradas son:
```
https://matchia.co/api/auth/callback/google
https://matchia.co/api/auth/callback/twitter
https://matchia.co/api/auth/callback/linkedin
```

---

## 10. Planes y monetización

| Plan | Precio mensual | Precio anual | Estado | Características principales |
|---|---|---|---|---|
| Free | $0 | — | ✅ Activo | 3 análisis gratuitos |
| Individual Pro | $10/mes | $100/año | 🔜 Próximamente | Análisis ilimitados, export PDF, dropdowns de área/enfoque, reescritura inteligente |
| Business | $30/mes | $300/año | 🔜 Stripe pendiente | Dashboard empresarial completo, subida masiva, rankeo IA, entrevistas, equipo, mailing |

> **Prioridad actual:** El plan Business está en desarrollo activo. El plan Individual Pro se implementará una vez que el Business esté completamente funcional y en producción. El botón "Actualizar a Pro" redirige a `/coming-soon` con waitlist activa.

---

## 11. Sprints completados

### Sprint 1 — Fundación del dashboard empresarial
- Layout base con sidebar colapsable (9 secciones)
- Header con buscador global, notificaciones y usuario
- Dashboard ejecutivo con KPIs reales desde la BD
- Widget de top vacantes y acciones rápidas
- Navegación entre secciones placeholder

### Sprint 2 — Core del producto
- Vista de Puestos: crear, editar, pausar, cerrar vacantes
- Exportar vacante a PDF (con branding) o texto plano para portales de empleo
- Vista de Candidatos con subida masiva (hasta 20 CVs)
- Análisis individual con Gemini + rankeo comparativo 1-5 contra descripción del puesto
- Modal de detalle del candidato: resumen IA, fortalezas, habilidades, cambio de estado, notas del reclutador

### Sprint 3 — Valor diferencial (en progreso)
- Sistema de entrevistas internas: agendar, tipo (RH/Manager/Técnica), asignar entrevistador, notas previas, feedback post-entrevista con estrellas
- Pool de Talento (pendiente)
- Campañas de mailing masivo (pendiente)

### Funcionalidades base (previas a sprints)
- Registro / Login con email y contraseña
- OAuth: Google, Twitter/X, LinkedIn
- Análisis individual de CV con Gemini
- Historial de análisis
- Sistema de límites por plan (1-3 análisis free, cooldown 30min, bloqueo 24h)
- Coming-soon con waitlist conectada a Supabase
- Validación de PDF en 3 capas (MIME, extensión, magic number)
- Rate limiting por IP
- Políticas de privacidad

---

## 12. Roadmap pendiente

### Sprint 3 (en progreso)
- [ ] Pool de Talento con filtros (skill, país, experiencia)
- [ ] Agregar candidato del pool a nueva vacante con un clic
- [ ] Campañas de mailing masivo con Resend
- [ ] Plantilla de correo editable por la empresa

### Sprint 4 — Comunicación y reportes
- [ ] Reportes avanzados: métricas de reclutamiento, tiempo promedio, tasa de conversión
- [ ] Gestión de equipo: agregar/eliminar reclutadores, cambiar roles
- [ ] Configuración de la empresa: editar datos, logo, NIT

### Sprint 5 — Monetización y pulido
- [ ] Integración con Stripe (pagos mensuales y anuales)
- [ ] Popup de registro de empresa al activar plan Business
- [ ] Dropdowns de área objetivo y enfoque en análisis individual
- [ ] Export PDF del análisis individual con branding Matchia
- [ ] Reescritura inteligente de secciones del CV
- [ ] Búsqueda global en el dashboard empresarial
- [ ] Centro de notificaciones (entrevistas pendientes, candidatos nuevos)
- [ ] CAPTCHA en registro (hCaptcha)
- [ ] Recuperación de contraseña por email
- [ ] Testing completo (Jest + Playwright)

---

## Contribución y flujo de trabajo

### Ramas
- `main` — producción (Netlify auto-deploys)
- `feature/nombre` — nuevas funcionalidades

### Flujo de deploy

```bash
# 1. Cambios locales
git add .
git commit -m "feat: descripción clara del cambio"
git push

# 2. Frontend — Netlify despliega automáticamente al hacer push a main

# 3. Backend — actualizar manualmente en AWS
ssh -i "C:\Users\AngelDevelop\cv-analyzer-key.pem" ubuntu@18.227.7.206
cd Cv-analyzer/server
git stash && git pull
npx prisma generate  # solo si hubo cambios en la BD
pm2 restart cv-analyzer
```

### Convención de commits

| Prefijo | Uso |
|---|---|
| `feat:` | Nueva funcionalidad |
| `fix:` | Corrección de bug |
| `style:` | Cambios de CSS/diseño |
| `refactor:` | Reorganización de código |
| `docs:` | Cambios en documentación |
| `chore:` | Tareas de mantenimiento |

---

*Matchia — Desarrollado con Next.js, Node.js, Supabase y Google Gemini*
