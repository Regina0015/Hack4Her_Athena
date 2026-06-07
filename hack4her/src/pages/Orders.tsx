import { useState } from 'react';
import {
  AlertTriangle, CheckCircle2, Sparkles, ArrowRightLeft, ChevronRight, X,
} from 'lucide-react';
import { api } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { Loading, ErrorBox } from '../components/shared';
import type { OrderSummary, OrderDetail, Recommendation } from '../types';

const RISK_LABEL: Record<string, string> = { alto: 'Riesgo Alto', medio: 'Riesgo Medio', bajo: 'Validado' };

/** Acorta un ID largo en notación científica para mostrarlo legible. */
function shortId(id: string) {
  return id.length > 10 ? id.slice(0, 8) + '…' : id;
}

export default function Orders() {
  const [selected, setSelected] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<string>('Todos');
  const orders = useApi<OrderSummary[]>(() => api.orders());

  const data = (orders.data ?? []).filter((o) => {
    if (filtro === 'Todos') return true;
    if (filtro === 'Riesgo Alto') return o.riskBand === 'alto';
    if (filtro === 'En riesgo') return o.riskBand !== 'bajo';
    return true;
  });

  return (
    <div className="dash">
      <div className="dash-head">
        <h2>Gestión de Pedidos</h2>
        <div className="sub">¿Cómo evitamos una sustitución inesperada?</div>
      </div>

      {/* Filtros */}
      <div className="card-elevated" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', padding: 12 }}>
        {['Todos', 'En riesgo', 'Riesgo Alto'].map((c) => (
          <button
            key={c}
            onClick={() => setFiltro(c)}
            style={{
              height: 38, padding: '0 14px', borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: filtro === c ? '#0f172a' : '#f1f2f4',
              color: filtro === c ? '#fff' : '#334155',
            }}
          >
            {c}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 12.5, color: '#6B7280' }}>
          {orders.data ? `${orders.data.length} pedidos` : ''}
        </div>
      </div>

      {orders.loading && <Loading />}
      {orders.error && <ErrorBox message={orders.error} />}

      {orders.data && (
        <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th className="r">Líneas</th>
                  <th className="r">Valor</th>
                  <th className="r">Riesgo</th>
                  <th className="r">Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 50).map((o) => (
                  <tr key={o.idPedido} className="clickable" onClick={() => setSelected(o.idPedido)}>
                    <td style={{ fontWeight: 600 }}>{shortId(o.idPedido)}</td>
                    <td style={{ color: '#475569' }}>{shortId(o.customerId)}</td>
                    <td className="r tabnums">{o.lineasEnRiesgo}</td>
                    <td className="r tabnums" style={{ fontWeight: 600 }}>${o.total.toFixed(2)}</td>
                    <td className="r tabnums">{o.riskScore}</td>
                    <td className="r">
                      <span className={`status-chip ${o.riskBand}`}>
                        {o.riskBand === 'bajo' ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                        {RISK_LABEL[o.riskBand]}
                      </span>
                    </td>
                    <td className="r" style={{ color: '#94a3b8' }}><ChevronRight size={16} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && <OrderDrawer idPedido={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function OrderDrawer({ idPedido, onClose }: { idPedido: string; onClose: () => void }) {
  const detail = useApi<OrderDetail>(() => api.order(idPedido), [idPedido]);
  const [recs, setRecs] = useState<Recommendation[] | null>(null);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function loadRecs() {
    setLoadingRecs(true);
    setMsg(null);
    try {
      setRecs(await api.recommendations(idPedido));
    } catch (e) {
      const err = e as { message?: string };
      setMsg(err?.message ?? 'Error al obtener recomendaciones');
    } finally {
      setLoadingRecs(false);
    }
  }

  async function approve(r: Recommendation) {
    await api.approve(idPedido, r.idLinea, r.skuRecomendado, r.nombreRecomendado);
    setMsg(`✅ Sustitución aprobada: ${r.nombreRecomendado}`);
  }

  async function reject(r: Recommendation) {
    await api.reject(idPedido, r.idLinea);
    setMsg(`Sustitución rechazada para la línea ${r.idLinea}`);
  }

  // Líneas afectadas (en riesgo) para la sección "Productos solicitados".
  const lineas = detail.data?.lineas ?? [];

  return (
    <div className="drawer-overlay">
      <div className="drawer-bg" onClick={onClose} />
      <aside className="drawer">
        <div className="drawer-head">
          <div>
            <div className="lab">Pedido</div>
            <div className="id">{shortId(idPedido)} · Cliente {shortId(detail.data?.customerId ?? '')}</div>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
        </div>

        <div className="drawer-body">
          {detail.loading && <Loading />}
          {detail.error && <ErrorBox message={detail.error} />}

          {detail.data && (
            <>
              <section>
                <h4>Productos del pedido</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {lineas.slice(0, 6).map((l) => (
                    <div key={l.idLinea} className="line-card">
                      <div className="lc-top">
                        <div className="lc-name">{l.nombreSku || 'Producto'}</div>
                        <div className="lc-sku">SKU {shortId(l.skuSolicitado)}</div>
                      </div>
                      <div className="line-cells">
                        <div className="line-cell"><div className="cl">Cantidad</div><div className="cv">{l.quantity}</div></div>
                        <div className="line-cell"><div className="cl">Stock</div><div className="cv">{l.stockActual}</div></div>
                        <div className="line-cell">
                          <div className="cl">Riesgo</div>
                          <div className={`cv ${l.riskBand === 'alto' ? 'danger' : l.riskBand === 'bajo' ? 'success' : ''}`}>{l.riskScore}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {lineas.length === 0 && <p className="muted">Este pedido no tiene líneas registradas.</p>}
                </div>
              </section>

              {/* Motor de sustitución */}
              <section className="reco-panel">
                <div className="rp-head"><Sparkles size={15} /> MOTOR DE SUSTITUCIÓN INTELIGENTE</div>

                {!recs && (
                  <div style={{ marginTop: 14 }}>
                    <button className="btn-approve" style={{ width: '100%' }} onClick={loadRecs} disabled={loadingRecs}>
                      {loadingRecs ? 'Consultando IA…' : 'Generar recomendación con IA'}
                    </button>
                  </div>
                )}

                {recs && recs.length === 0 && (
                  <p className="reco-reason">Este pedido no tiene líneas que requieran sustitución.</p>
                )}

                {recs && recs.map((r) => (
                  <div key={r.idLinea} style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(0,91,172,0.12)' }}>
                    <div className="reco-swap">
                      <ProductChip name={r.nombreSolicitado} color="#FF7A1A" />
                      <ArrowRightLeft size={18} color="#005BAC" />
                      <ProductChip name={r.nombreRecomendado} color="#3FB54A" />
                      <span className="reco-prob">
                        <b>{Math.round(r.probabilidadAceptacion * 100)}%</b>{' '}
                        <span className="muted">aceptación</span>
                      </span>
                    </div>
                    <p className="reco-reason">
                      {r.explicacion}{' '}
                      <span className={`reco-src ${r.fuente}`}>{r.fuente === 'gemini' ? 'IA Gemini' : 'histórico'}</span>
                    </p>
                    <div className="reco-actions">
                      <button className="btn-approve" onClick={() => approve(r)}>Aprobar sugerencia</button>
                      <button className="btn-reject" onClick={() => reject(r)}>Rechazar</button>
                    </div>
                  </div>
                ))}
              </section>

              {msg && <div className="drawer-msg">{msg}</div>}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function ProductChip({ name, color }: { name: string; color: string }) {
  const short = name.length > 28 ? name.slice(0, 26) + '…' : name;
  return (
    <div className="chip-prod">
      <span className="dot" style={{ background: color }}>{name[0]?.toUpperCase() ?? '?'}</span>
      <span>{short}</span>
    </div>
  );
}
