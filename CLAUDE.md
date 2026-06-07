# CLAUDE.md — Guía de trabajo para este proyecto

Este archivo define cómo Claude (y cualquier asistente de IA) debe trabajar en
este repositorio. **Léelo antes de hacer cambios.**

---

## ⛔️ REGLA #1 — LA MÁS IMPORTANTE: NO TOQUES LA BASE DE DATOS

**PROHIBIDO cambiar, borrar, agregar, sobrescribir o resetear CUALQUIER cosa en
la base de datos (MongoDB) sin que la usuaria te diga que SÍ, de forma explícita
y clara.**

Esto incluye TODO lo siguiente, sin excepción:
- Borrar documentos o colecciones (`delete`, `deleteOne`, `deleteMany`, `drop`,
  `remove`, etc.).
- Crear o insertar datos (`insert`, `create`, `save`).
- Modificar o actualizar datos (`update`, `updateMany`, `findOneAndUpdate`, etc.).
- Correr scripts que tocan la base (`npm run import`, `npm run seed:stock`,
  cualquier script en `backend/src/scripts/`).
- Conectarte a la base para "probar" algo que escriba o modifique datos.

**Cómo debes pedir permiso (en lenguaje sencillo, no técnico):**

> "Para hacer esto necesito **modificar tu base de datos**. Esto va a [explicar en
> palabras simples qué pasaría, p. ej. 'borrar todos los pedidos' o 'agregar 50
> productos nuevos']. **¿Me das permiso para hacerlo? (sí / no)**"

Y luego **ESPERAS** a que la usuaria responda "sí". Si responde cualquier otra
cosa, o no responde, **NO LO HAGAS**.

Si una tarea parece necesitar tocar la base de datos, primero **avisa y pregunta**.
Nunca asumas que tienes permiso solo porque "tiene sentido" o "es lo lógico".

Leer datos (solo consultar, sin cambiar nada) sí está permitido sin preguntar.

---

## Qué es este proyecto

Plataforma de Sustituciones Inteligentes (Hack4Her / Arca Continental). Dos partes:

- **`backend/`** — API REST. Node + TypeScript (ESM) + Express + MongoDB
  (Mongoose) + Google Gemini. Arquitectura por capas:
  `routes → controllers → services → repositories → models`.
- **`hack4her/`** — Frontend. React 19 + Vite (JSX).

## Reglas de oro (NO negociables)

### 🛑 Base de datos
Ver **REGLA #1** arriba — es la regla más importante del proyecto. En resumen:
- **NUNCA escribas en la base** (borrar, crear, actualizar) sin permiso explícito.
- **NUNCA corras scripts** (`import-csv`, `seed:stock`, etc.) sin permiso explícito.
- Pregunta siempre en lenguaje sencillo y espera un "sí" claro antes de actuar.
- No cambies el `MONGODB_URI` ni apuntes a otra base sin confirmarlo.
- Consultar/leer datos sin modificarlos sí está permitido.

### ✋ Antes de actuar, pregunta
- Antes de **agregar dependencias** nuevas (`npm install ...`), pregunta. Mantén el
  stack actual; no metas librerías que dupliquen algo que ya existe.
- Antes de **agregar archivos, carpetas o endpoints nuevos**, confirma que encajan
  con la arquitectura por capas existente.
- Antes de **cambios grandes o irreversibles** (migrar esquema, renombrar modelos,
  refactors amplios), explica el plan y espera el visto bueno.
- Si tienes dudas sobre el alcance, **pregunta en vez de asumir**. Es mejor una
  pregunta de más que rehacer trabajo.

### 🔐 Secretos y entorno
- **NUNCA** subas a git ni imprimas el contenido de archivos `.env` (contienen la
  `GEMINI_API_KEY` y la URI de Mongo). Usa `.env.example` como referencia.
- No hardcodees claves, URIs ni tokens en el código. Toda config va por variables
  de entorno, validadas en [backend/src/config/env.ts](backend/src/config/env.ts).
- Si necesitas una nueva variable de entorno, agrégala al esquema de Zod **y** a
  `.env.example` (sin el valor real).

### 🌿 Git
- No hagas `commit` ni `push` a menos que el usuario lo pida.
- Nunca trabajes con `--force`, `reset --hard` ni reescribas historial sin permiso.
- Si vas a commitear, hazlo en una rama, no directo sobre cambios sin revisar.

## Buenas prácticas de código

### Backend (TypeScript)
- Respeta las capas: la lógica de negocio va en `services/`, el acceso a datos en
  `repositories/`, las rutas solo orquestan. No metas queries de Mongoose en los
  controllers.
- Usa **imports con extensión `.js`** (es ESM con TypeScript, p. ej.
  `import { env } from './env.js'`). Mantén ese patrón.
- Valida entradas con **Zod** (ya se usa para el entorno y los DTOs).
- Maneja errores con `AppError` + `asyncWrapper` + `errorHandler` que ya existen;
  no inventes otro mecanismo de manejo de errores.
- Las respuestas siguen el formato `{ data: ... }` (mira `/health` en las rutas).
  Mantén la consistencia.
- Gemini es **opcional**: si no hay API key, hay fallback heurístico
  (`isGeminiEnabled`). No rompas ese camino; el sistema debe funcionar sin Gemini.

### Frontend (React + Vite)
- React 19 con JSX. Componentes funcionales + hooks.
- Respeta las reglas de ESLint del proyecto (`npm run lint`).
- No introduzcas TypeScript en el frontend si el resto es JSX, salvo que se pida.

### General
- **Escribe código que se lea como el de alrededor**: mismo estilo, mismos nombres,
  misma densidad de comentarios. Los comentarios del repo están en español — síguelo.
- Cambios pequeños y enfocados. No mezcles refactor + feature en el mismo paso.
- No borres código que no entiendas; pregunta para qué sirve.
- Prefiere reutilizar lo existente antes de crear algo nuevo.

## Comandos útiles

```bash
# Backend (desde backend/)
npm run dev          # servidor en watch (tsx)
npm run build        # compila TypeScript a dist/
npm run start        # corre la versión compilada
npm run import       # ⚠️ importa CSV — destructivo, PEDIR PERMISO
npm run seed:stock   # ⚠️ siembra stock — destructivo, PEDIR PERMISO

# Frontend (desde hack4her/)
npm run dev          # servidor de desarrollo Vite
npm run build        # build de producción
npm run lint         # ESLint
```

## Antes de terminar una tarea
- Verifica que compila (`npm run build` en backend / `npm run lint` en frontend).
- Reporta honestamente: si algo no se probó o falló, dilo claramente.
- No marques algo como "listo" sin haberlo verificado.
