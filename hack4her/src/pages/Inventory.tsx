import { AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { Loading, ErrorBox } from '../components/shared';
import type { InventoryItem } from '../types';

const RISK_LABEL: Record<string, string> = { alto: 'Alto', medio: 'Medio', bajo: 'Bajo' };
const SKU_COLORS = ['#E30613', '#005BAC', '#00A870', '#FF9F1C', '#7C3AED', '#0EA5E9'];

function colorFor(sku: string) {
  let h = 0;
  for (let i = 0; i < sku.length; i++) h = (h + sku.charCodeAt(i)) % SKU_COLORS.length;
  return SKU_COLORS[h];
}

export default function Inventory() {
  const inv = useApi<InventoryItem[]>(() => api.inventory());

  const data = inv.data ?? [];
  const alto = data.filter((i) => i.riesgoAgotamiento === 'alto').length;
  const medio = data.filter((i) => i.riesgoAgotamiento === 'medio').length;
  const bajo = data.filter((i) => i.riesgoAgotamiento === 'bajo').length;

  return (
    <div className="dash">
      <div className="dash-head">
        <h2>Inventario Predictivo</h2>
        <div className="sub">¿Qué producto debo reponer antes de que cause un problema?</div>
      </div>

      {inv.loading && <Loading />}
      {inv.error && <ErrorBox message={inv.error} />}

      {inv.data && (
        <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="inv-head-row">
            <div>
              <h4>Catálogo monitoreado</h4>
              <div className="inv-note">
                Demanda derivada de pedidos reales · stock estimado (la base no incluye inventario de almacén)
              </div>
            </div>
            <div className="inv-tags">
              <span className="inv-tag" style={{ background: 'rgba(227,6,19,0.1)', color: '#E30613' }}>{alto} alto</span>
              <span className="inv-tag" style={{ background: 'rgba(255,159,28,0.12)', color: '#FF9F1C' }}>{medio} medio</span>
              <span className="inv-tag" style={{ background: 'rgba(0,168,112,0.12)', color: '#00A870' }}>{bajo} bajo</span>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="r">Stock</th>
                  <th className="r">Consumo / sem</th>
                  <th className="r">Semanas rest.</th>
                  <th className="r">Demanda IA</th>
                  <th className="r">Riesgo</th>
                </tr>
              </thead>
              <tbody>
                {data.map((i) => (
                  <tr key={i.sku}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className="inv-sku-badge" style={{ background: colorFor(i.sku) }}>
                          {i.nombre[0]?.toUpperCase() ?? '?'}
                        </span>
                        <div>
                          <div style={{ fontWeight: 500 }}>{i.nombre}</div>
                          <div style={{ fontSize: 12, color: '#6B7280' }}>SKU {i.sku.slice(0, 8)}…</div>
                        </div>
                      </div>
                    </td>
                    <td className="r tabnums" style={{ fontWeight: 600 }}>{i.stockActual.toLocaleString()}</td>
                    <td className="r tabnums">{i.consumoPromedioSemanal}</td>
                    <td className="r tabnums">{i.semanasRestantes ?? '—'}</td>
                    <td className="r tabnums">{i.demandaPredichaSemanal}</td>
                    <td className="r">
                      <span className={`status-chip ${i.riesgoAgotamiento}`}>
                        {i.riesgoAgotamiento === 'alto' && <AlertTriangle size={13} />}
                        {RISK_LABEL[i.riesgoAgotamiento]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
