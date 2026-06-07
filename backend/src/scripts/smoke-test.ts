/**
 * Prueba de humo end-to-end SIN depender de una base externa.
 * Levanta un MongoDB en memoria, inserta datos de muestra, monta la app Express
 * y golpea los endpoints principales. Útil para verificar la cadena completa.
 *
 * Uso: npm run smoke
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import http from 'node:http';
import { Order } from '../models/Order.js';
import { OrderDetail } from '../models/OrderDetail.js';
import { Substitution } from '../models/Substitution.js';
import { Product } from '../models/Product.js';
import { createApp } from '../app.js';

function request(server: http.Server, method: string, path: string, body?: unknown): Promise<{ status: number; json: any }> {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const port = typeof addr === 'object' && addr ? addr.port : 0;
    const data = body ? JSON.stringify(body) : undefined;
    const req = http.request(
      { host: '127.0.0.1', port, path, method, headers: { 'Content-Type': 'application/json' } },
      (res) => {
        let buf = '';
        res.on('data', (c) => (buf += c));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, json: buf ? JSON.parse(buf) : null }));
      },
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function seed() {
  await Order.create({
    idPedido: 'PED-1',
    customerId: 'CLI-1',
    pais: 'México',
    idBusinessUnit: 1,
    businessUnit: 'Bebidas',
    cedis: '3012',
    statusFinal: 'Entregado',
    total: 1570,
  });
  await OrderDetail.create([
    { idLinea: 'L1', idPedido: 'PED-1', skuSolicitado: 'FANTA600', nombreSku: 'Fanta 600ml', quantity: 12, status: 'Entregado' },
    { idLinea: 'L2', idPedido: 'PED-1', skuSolicitado: 'COCA600', nombreSku: 'Coca 600ml', quantity: 6, status: 'Entregado' },
  ]);
  await Substitution.create([
    { idPedido: 'PED-0', customerId: 'CLI-1', skuSolicitado: 'FANTA600', nombreSkuSolicitado: 'Fanta 600ml', skuEntregado: 'SPRITE600', nombreSkuEntregado: 'Sprite 600ml', aceptado: true },
    { idPedido: 'PED-0', customerId: 'CLI-1', skuSolicitado: 'FANTA600', nombreSkuSolicitado: 'Fanta 600ml', skuEntregado: 'SPRITE600', nombreSkuEntregado: 'Sprite 600ml', aceptado: true },
  ]);
  await Product.create([
    { sku: 'FANTA600', nombre: 'Fanta 600ml', categoria: 'Bebidas', businessUnit: 'Bebidas', stockActual: 0, stockMinimo: 30, consumoPromedioSemanal: 40 },
    { sku: 'COCA600', nombre: 'Coca 600ml', categoria: 'Bebidas', businessUnit: 'Bebidas', stockActual: 200, stockMinimo: 30, consumoPromedioSemanal: 30 },
    { sku: 'SPRITE600', nombre: 'Sprite 600ml', categoria: 'Bebidas', businessUnit: 'Bebidas', stockActual: 150, stockMinimo: 30, consumoPromedioSemanal: 20 },
  ]);
}

async function main() {
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await seed();

  const server = createApp().listen(0);
  let ok = 0;
  let fail = 0;
  const check = (name: string, cond: boolean, extra?: unknown) => {
    if (cond) { ok++; console.log(`  ✅ ${name}`); }
    else { fail++; console.log(`  ❌ ${name}`, extra ?? ''); }
  };

  try {
    const health = await request(server, 'GET', '/api/health');
    check('GET /health', health.status === 200 && health.json.data.status === 'ok');

    const kpis = await request(server, 'GET', '/api/dashboard/kpis');
    check('GET /dashboard/kpis', kpis.status === 200 && typeof kpis.json.data.pedidosEnRiesgo === 'number', kpis.json);

    const alerts = await request(server, 'GET', '/api/dashboard/alerts');
    check('GET /dashboard/alerts', alerts.status === 200 && Array.isArray(alerts.json.data));

    const orders = await request(server, 'GET', '/api/orders');
    check('GET /orders devuelve riskScore', orders.status === 200 && orders.json.data[0]?.riskScore >= 0, orders.json);

    const detail = await request(server, 'GET', '/api/orders/PED-1');
    const lineaRiesgo = detail.json.data.lineas.find((l: any) => l.skuSolicitado === 'FANTA600');
    check('GET /orders/:id detalle con FANTA600 en riesgo alto', lineaRiesgo?.riskBand === 'alto', lineaRiesgo);

    const recs = await request(server, 'GET', '/api/orders/PED-1/recommendations');
    const rec = recs.json.data[0];
    check('GET /recommendations devuelve sustituto + probabilidad + explicación',
      recs.status === 200 && !!rec?.skuRecomendado && typeof rec?.probabilidadAceptacion === 'number' && !!rec?.explicacion,
      rec);
    check('Recomendación cae al fallback heurístico (sin GEMINI_API_KEY)', rec?.fuente === 'heuristico', rec?.fuente);

    const approve = await request(server, 'POST', '/api/orders/PED-1/substitutions/L1/approve', {
      skuSustituto: 'SPRITE600', nombreSustituto: 'Sprite 600ml',
    });
    check('POST approve', approve.status === 200 && approve.json.data.substitutionStatus === 'approved', approve.json);

    const profile = await request(server, 'GET', '/api/customers/CLI-1/profile');
    check('GET /customers/:id/profile con preferencias aprendidas',
      profile.status === 200 && profile.json.data.preferencias.length > 0, profile.json.data);

    const inv = await request(server, 'GET', '/api/inventory');
    check('GET /inventory', inv.status === 200 && inv.json.data.length === 3);

    const critical = await request(server, 'GET', '/api/inventory/critical');
    check('GET /inventory/critical incluye FANTA600', critical.json.data.some((i: any) => i.sku === 'FANTA600'), critical.json.data.map((i: any) => i.sku));

    console.log(`\n${fail === 0 ? '🎉' : '⚠️'} Resultado: ${ok} OK, ${fail} fallos`);
  } finally {
    server.close();
    await mongoose.disconnect();
    await mongod.stop();
  }

  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('Error en smoke test:', err);
  process.exit(1);
});
