---
name: project-structure
description: Hack4Her (Pythia/Athena) — layout del repo, cómo correr frontend + backend juntos
metadata:
  type: project
---

Proyecto Hack4Her "Pythia · Arca Continental" (prevención de faltantes y sustitución predictiva).

Dos carpetas activas:
- `backend/` — Express + MongoDB (Mongoose) + Gemini. Corre con `npm run dev` (tsx watch) en **:4000**, expone todo bajo `/api`. Conecta a MongoDB Atlas (URI real en `backend/.env`, que TIENE secretos reales: MONGODB_URI y GEMINI_API_KEY — no commitear/exponer). DTOs en `backend/src/dtos/domain.ts`.
- `supply-harmony/` — frontend **TanStack Start** (React 19, shadcn, Tailwind v4). Corre con `npm run dev` (Vite) en **:8080** (elige otro puerto si está ocupado). Instalar deps con `npm install --legacy-peer-deps` (conflicto Lovable config vs nitro). La carpeta `athena/` original fue eliminada y reemplazada por supply-harmony.

Rutas frontend: `/` = landing de athena (tarjetas Admin→`/dashboard`, Cliente→`/portal`). Panel admin/empresa: `/dashboard`, `/inventory`, `/orders`, `/clients` (layout `_app` con sidebar). Cliente: `/portal`. Login: `/login`.

Integración frontend↔backend: cliente tipado en `supply-harmony/src/lib/api/client.ts` (usa `VITE_API_URL`, default `http://localhost:4000/api`). Todas las vistas usan TanStack Query. CORS del backend permite cualquier origen localhost en dev (ver `backend/src/app.ts`). El chat Pythia (`ChatWidget`) llama `/chat` con `mode` admin|cliente.

Para verificar en navegador hay Playwright disponible vía npx (el módulo resoluble está en la caché de npx, no como dep del proyecto).
