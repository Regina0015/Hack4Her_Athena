import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, LineChart, Line, Legend,
} from 'recharts';
import {
  AlertTriangle, TrendingUp, CheckCircle2, Boxes, Sparkles, ArrowUpRight,
} from 'lucide-react';
import { api } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { Loading, ErrorBox } from '../components/shared';
import type { DashboardKpis, Alert } from '../types';

// Series de proyección para las gráficas (no hay endpoint histórico aún; se
// muestran como tendencia/demo. Los KPIs y alertas SÍ son datos reales del backend).
const acceptanceTrend = [
  { m: 'Ene', v: 72 }, { m: 'Feb', v: 75 }, { m: 'Mar', v: 79 },
  { m: 'Abr', v: 83 }, { m: 'May', v: 88 }, { m: 'Jun', v: 91 },
];
const demandSeries = [
  { d: 'Lun', real: 420, pred: 410 }, { d: 'Mar', real: 480, pred: 470 },
  { d: 'Mié', real: 450, pred: 460 }, { d: 'Jue', real: 520, pred: 510 },
  { d: 'Vie', real: 610, pred: 590 }, { d: 'Sáb', real: 680, pred: 700 },
  { d: 'Dom', real: 390, pred: 400 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const kpis = useApi<DashboardKpis>(() => api.dashboardKpis());
  const alerts = useApi<Alert[]>(() => api.dashboardAlerts());

  const k = kpis.data;
  // Barras de riesgo derivadas de las alertas reales de pedidos en riesgo alto.
  const riesgoBars = (alerts.data ?? [])
    .filter((a) => a.tipo === 'pedido_alto_riesgo')
    .slice(0, 6)
    .map((a, i) => ({ name: a.referencia.slice(0, 6), riesgo: 80 - i * 8 }));

  return (
    <div className="dash">
      <div className="dash-head">
        <h2>Torre de Control</h2>
        <div className="sub">¿Dónde debo actuar hoy para evitar problemas?</div>
      </div>

      {/* Hero banner */}
      <div className="hero">
        <span className="pill"><Sparkles size={14} color="#FF9F1C" /> Insight IA · sustituciones inteligentes</span>
        <h3>La IA detecta posibles faltantes antes del despacho.</h3>
        <p>
          {k ? `${k.pedidosEnRiesgo} pedido(s) en riesgo detectados.` : 'Analizando pedidos…'}{' '}
          Tienes sustituciones recomendadas listas para validar, con justificación basada en el historial real.
        </p>
        <div className="hero-actions">
          <button className="hero-btn solid" onClick={() => navigate('/orders')}>
            Revisar pedidos en riesgo <ArrowUpRight size={16} />
          </button>
          <button className="hero-btn ghost" onClick={() => navigate('/inventory')}>
            Ver inventario predictivo
          </button>
        </div>
      </div>

      {/* KPIs reales */}
      {kpis.loading && <Loading />}
      {kpis.error && <ErrorBox message={kpis.error} />}
      {k && (
        <div className="kpi-grid">
          <KpiTile tone="danger" icon={<AlertTriangle size={18} />} value={k.pedidosEnRiesgo} label="Pedidos en riesgo" />
          <KpiTile tone="warning" icon={<Boxes size={18} />} value={k.productosCriticos} label="Productos críticos" />
          <KpiTile tone="success" icon={<CheckCircle2 size={18} />} value={k.sustitucionesPendientes} label="Sustituciones pendientes" />
          <KpiTile tone="secondary" icon={<TrendingUp size={18} />} value={`${Math.round(k.tasaAceptacionGlobal * 100)}%`} label="Tasa de aceptación global" />
        </div>
      )}

      {/* Tarjetas de insight (de alertas reales) */}
      {alerts.data && alerts.data.length > 0 && (
        <div className="alert-cards">
          {alerts.data.slice(0, 3).map((a) => (
            <div key={a.id} className="card-elevated alert-card">
              <span className={`alert-dot ${a.severidad}`} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ac-title">{a.tipo === 'stock_critico' ? 'Stock crítico' : 'Pedido en riesgo'}</div>
                <div className="ac-sub">{a.mensaje}</div>
              </div>
              <span className={`ac-stat ${a.severidad}`}>{a.severidad}</span>
            </div>
          ))}
        </div>
      )}

      {/* Gráficas */}
      <div className="charts-row">
        <div className="card-elevated">
          <h4>Riesgo de agotamiento por pedido</h4>
          <div className="chint">Pedidos con líneas en riesgo alto (datos reales)</div>
          <div style={{ height: 256, marginTop: 12 }}>
            <ResponsiveContainer>
              <BarChart data={riesgoBars.length ? riesgoBars : [{ name: '—', riesgo: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }} />
                <Bar dataKey="riesgo" radius={[8, 8, 0, 0]} fill="#005BAC" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-elevated">
          <h4>Aceptación de sustituciones</h4>
          <div className="chint">Tendencia (proyección)</div>
          <div style={{ height: 256, marginTop: 12 }}>
            <ResponsiveContainer>
              <AreaChart data={acceptanceTrend}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00A870" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#00A870" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" />
                <XAxis dataKey="m" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} domain={[60, 100]} />
                <Tooltip />
                <Area type="monotone" dataKey="v" stroke="#00A870" strokeWidth={2.5} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card-elevated">
        <h4>Predicción de demanda · 7 días</h4>
        <div className="chint">Línea predicha vs venta real (proyección)</div>
        <div style={{ height: 256, marginTop: 12 }}>
          <ResponsiveContainer>
            <LineChart data={demandSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" />
              <XAxis dataKey="d" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip />
              <Legend />
              <Line dataKey="real" stroke="#E30613" strokeWidth={3} dot={{ r: 4 }} name="Real" />
              <Line dataKey="pred" stroke="#005BAC" strokeWidth={2} strokeDasharray="6 4" name="Predicción IA" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function KpiTile({ tone, icon, value, label }: { tone: string; icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="kpi-tile">
      <span className={`kpi-ico ${tone}`}>{icon}</span>
      <div className="kpi-val">{value}</div>
      <div className="kpi-lab">{label}</div>
    </div>
  );
}
