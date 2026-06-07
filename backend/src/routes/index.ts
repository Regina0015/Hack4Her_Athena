import { Router } from 'express';
import { asyncWrapper } from '../middlewares/asyncWrapper.js';
import * as dashboard from '../controllers/dashboard.controller.js';
import * as orders from '../controllers/order.controller.js';
import * as customers from '../controllers/customer.controller.js';
import * as inventory from '../controllers/inventory.controller.js';
import * as portal from '../controllers/portal.controller.js';
import * as chat from '../controllers/chat.controller.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ data: { status: 'ok', ts: Date.now() } }));

// Dashboard
router.get('/dashboard/kpis', asyncWrapper(dashboard.getKpisHandler));
router.get('/dashboard/alerts', asyncWrapper(dashboard.getAlertsHandler));

// Pedidos
router.get('/orders', asyncWrapper(orders.listOrdersHandler));
router.get('/orders/stats', asyncWrapper(orders.getOrderStatsHandler));
router.get('/orders/:idPedido', asyncWrapper(orders.getOrderHandler));
router.get('/orders/:idPedido/recommendations', asyncWrapper(orders.getRecommendationsHandler));
router.post(
  '/orders/:idPedido/substitutions/:idLinea/approve',
  asyncWrapper(orders.approveHandler),
);
router.post(
  '/orders/:idPedido/substitutions/:idLinea/reject',
  asyncWrapper(orders.rejectHandler),
);

// Clientes
router.get('/customers/:customerId/profile', asyncWrapper(customers.getProfileHandler));

// Inventario
router.get('/inventory', asyncWrapper(inventory.listInventoryHandler));
router.get('/inventory/critical', asyncWrapper(inventory.criticalInventoryHandler));

// Portal del cliente
router.get('/portal/:customerId/pending', asyncWrapper(portal.pendingHandler));
router.get('/portal/:customerId/inventory', asyncWrapper(portal.inventoryHandler));
router.get('/portal/:customerId/growth', asyncWrapper(portal.growthHandler));
router.post('/portal/:customerId/survey', asyncWrapper(portal.surveyHandler));
router.post('/portal/:customerId/preferences', asyncWrapper(portal.savePreferencesHandler));

// Chat Pythia (IA)
router.post('/chat', asyncWrapper(chat.chatHandler));

export default router;
