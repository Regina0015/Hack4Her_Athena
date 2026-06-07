# Backend — Plataforma de Sustituciones Inteligentes (Arca Continental)

API REST en **Node.js + Express + TypeScript + Mongoose (MongoDB)** con integración a **Google Gemini** para recomendar sustituciones de producto.

## Arranque

```bash
cd backend
npm install
cp .env.example .env   # edita MONGODB_URI y GEMINI_API_KEY
npm run dev            # http://localhost:4000/api
```

> Sin `GEMINI_API_KEY`, las recomendaciones usan automáticamente el **fallback heurístico** (basado en el historial). El sistema nunca se rompe por Gemini.

## Importar los CSV

Coloca los archivos en `backend/data/` con estos nombres y corre la importación:

```
backend/data/orders.csv
backend/data/orderdetails.csv
backend/data/resultados.csv
```

```bash
npm run import        # carga los 3 CSV a MongoDB + deriva catálogo de productos
npm run seed:stock    # (opcional) fuerza escenarios de stock crítico y sustituciones pendientes para la demo
```

El mapeo de columnas es flexible (tolera encabezados truncados/mayúsculas). Los IDs se guardan como `string` para no perder precisión de la notación científica.

## Verificar sin base externa

```bash
npm run smoke         # levanta MongoDB en memoria, inserta datos y prueba todos los endpoints
```

## Endpoints

| Método | Ruta |
|---|---|
| GET | `/api/health` |
| GET | `/api/dashboard/kpis` |
| GET | `/api/dashboard/alerts` |
| GET | `/api/orders?risk=alto` |
| GET | `/api/orders/:idPedido` |
| GET | `/api/orders/:idPedido/recommendations` |
| POST | `/api/orders/:idPedido/substitutions/:idLinea/approve` |
| POST | `/api/orders/:idPedido/substitutions/:idLinea/reject` |
| GET | `/api/customers/:customerId/profile` |
| GET | `/api/inventory` |
| GET | `/api/inventory/critical` |
| GET | `/api/portal/:customerId/pending` |
| POST | `/api/portal/:customerId/preferences` |

## Arquitectura

```
routes → controllers (thin) → services (lógica) → repositories → Mongoose models
```

- **risk.service**: riesgo de sustitución por línea (0–100) según stock + propensión histórica.
- **recommendation.service**: candidatos + score heurístico, llama a Gemini, hace blend 60/40, con fallback.
- **gemini.service**: salida JSON estructurada con schema.
- **customer.service**: motor de aprendizaje de preferencias desde el historial.
