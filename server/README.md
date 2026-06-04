# CV Analyzer 🧠

Aplicación web para analizar CVs con inteligencia artificial.

## Estructura del Proyecto

```
cv-analyzer/
├── client/   → React (Frontend) — por implementar
├── server/   → Node.js (Backend)
└── README.md
```

## Stack Tecnológico

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Base de Datos:** MongoDB (Mongoose)
- **Autenticación:** JWT + bcrypt
- **IA:** Anthropic API (Claude)

---

## Configuración del Backend

### 1. Instalar dependencias

```bash
cd server
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus valores:

| Variable | Descripción |
|---|---|
| `MONGO_URI` | URI de conexión a MongoDB |
| `JWT_SECRET` | Clave secreta para firmar tokens (usa algo largo y aleatorio) |
| `JWT_EXPIRES_IN` | Duración del token (ej: `7d`, `24h`) |
| `ANTHROPIC_API_KEY` | API key de Anthropic (para análisis de CV) |
| `CLIENT_URL` | URL del frontend para CORS |

### 3. Iniciar el servidor

```bash
# Desarrollo (con auto-reload)
npm run dev

# Producción
npm start
```

---

## API Endpoints

### Autenticación

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/register` | Público | Registrar usuario |
| `POST` | `/api/auth/login` | Público | Iniciar sesión |
| `GET` | `/api/auth/me` | Privado | Obtener perfil |
| `PUT` | `/api/auth/update-profile` | Privado | Actualizar perfil |

### Análisis (próximamente)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/api/analyze` | Privado | Analizar CV con IA |

### Health Check

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/health` | Estado del servidor |

---

## Ejemplos de Uso

### Registro
```json
POST /api/auth/register
{
  "name": "Juan Pérez",
  "email": "juan@email.com",
  "password": "miPassword123"
}
```

### Login
```json
POST /api/auth/login
{
  "email": "juan@email.com",
  "password": "miPassword123"
}
```

### Respuesta con token
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "name": "Juan Pérez",
    "email": "juan@email.com",
    "role": "user",
    "analysisCount": 0
  }
}
```

---

## Próximos pasos

- [ ] Frontend React con Login/Register
- [ ] Componente de subida de CV (PDF)
- [ ] Integración con Anthropic API para análisis
- [ ] Dashboard con historial de análisis
