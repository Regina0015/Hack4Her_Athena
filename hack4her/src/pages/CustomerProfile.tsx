import { useState } from 'react';
import { ShoppingBag, TrendingUp, ArrowRightLeft, Sparkles, Package } from 'lucide-react';
import { api } from '../lib/api';
import { Loading, ErrorBox } from '../components/shared';
import type { CustomerProfile as Profile } from '../types';

function shortId(id: string) {
  return id.length > 10 ? id.slice(0, 8) + '…' : id;
}

export default function CustomerProfile() {
  const [input, setInput] = useState('');
  const [data, setData] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    try {
      setData(await api.customerProfile(input.trim()));
    } catch (e) {
      const err = e as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dash">
      <div className="dash-head">
        <h2>Perfil Inteligente del Cliente</h2>
        <div className="sub">¿Qué prefiere este cliente cuando hay que sustituir?</div>
      </div>

      <div className="card-elevated">
        <div className="prof-search">
          <input
            placeholder="customer_id (ej. 5.48364e+18)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
          <button onClick={load}>Cargar perfil</button>
        </div>
        <div className="inv-note" style={{ marginTop: 8 }}>
          Tip: copia un customer_id de la pantalla de Gestión de Pedidos.
        </div>
      </div>

      {loading && <Loading />}
      {error && <ErrorBox message={error} />}

      {data && (
        <>
          <div className="prof-stats">
            <StatTile tone="secondary" icon={<ShoppingBag size={18} />} value={data.totalPedidos} label="Pedidos totales" />
            <StatTile tone="success" icon={<TrendingUp size={18} />} value={`${Math.round(data.tasaAceptacionGlobal * 100)}%`} label="Tasa de aceptación" />
            <StatTile tone="danger" icon={<ArrowRightLeft size={18} />} value={data.totalSustituciones} label="Sustituciones" />
          </div>

          {/* Preferencias detectadas */}
          <div className="card-elevated">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={15} color="#005BAC" /> Preferencias detectadas por IA
            </h4>
            <div className="inv-note" style={{ marginBottom: 12 }}>Pares solicitado → sustituto aprendidos del historial real.</div>
            {data.preferencias.length === 0 ? (
              <p className="prof-empty">Sin preferencias registradas para este cliente.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.preferencias.map((p, i) => (
                  <div key={i} className="prof-pref">
                    <div className="pp-swap">
                      <Chip name={p.skuSolicitado} color="#FF7A1A" />
                      <ArrowRightLeft size={16} color="#005BAC" />
                      <Chip name={p.nombreSustituto || p.skuPreferidoSustituto} color="#3FB54A" />
                    </div>
                    <span className="pp-count">{p.aceptaciones}× elegido</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Productos más solicitados */}
          <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f2f4' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Package size={15} /> Productos más solicitados</h4>
            </div>
            <table className="orders-table">
              <thead><tr><th>Producto</th><th>SKU</th><th className="r">Veces</th></tr></thead>
              <tbody>
                {data.productosMasSolicitados.map((p, i) => (
                  <tr key={i}>
                    <td>{p.nombre}</td>
                    <td style={{ color: '#6B7280' }}>{shortId(p.sku)}</td>
                    <td className="r tabnums" style={{ fontWeight: 600 }}>{p.conteo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Historial de sustituciones */}
          <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f2f4' }}>
              <h4>Historial de sustituciones</h4>
            </div>
            {data.historialSustituciones.length === 0 ? (
              <p className="prof-empty" style={{ padding: 20 }}>Sin sustituciones registradas.</p>
            ) : (
              <table className="orders-table">
                <thead><tr><th>Pedido</th><th>Solicitado</th><th>Entregado</th><th className="r">Estado</th></tr></thead>
                <tbody>
                  {data.historialSustituciones.slice(0, 50).map((s, i) => (
                    <tr key={i}>
                      <td>{shortId(s.idPedido)}</td>
                      <td>{s.nombreSkuSolicitado || shortId(s.skuSolicitado)}</td>
                      <td>{s.nombreSkuEntregado || shortId(s.skuEntregado)}</td>
                      <td className="r"><span className="status-chip bajo">Entregado</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatTile({ tone, icon, value, label }: { tone: string; icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="kpi-tile">
      <span className={`kpi-ico ${tone}`}>{icon}</span>
      <div className="kpi-val">{value}</div>
      <div className="kpi-lab">{label}</div>
    </div>
  );
}

function Chip({ name, color }: { name: string; color: string }) {
  const short = name.length > 26 ? name.slice(0, 24) + '…' : name;
  return (
    <div className="chip-prod">
      <span className="dot" style={{ background: color }}>{name[0]?.toUpperCase() ?? '?'}</span>
      <span>{short}</span>
    </div>
  );
}
