import type { RiskBand } from '../types';

export function RiskBadge({ band }: { band: RiskBand }) {
  return <span className={`badge ${band}`}>{band.toUpperCase()}</span>;
}

export function ProbabilityBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="row">
      <div className="prob-bar">
        <div style={{ width: `${pct}%` }} />
      </div>
      <span>{pct}%</span>
    </div>
  );
}

export function Kpi({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="kpi">
      <div className="value">{value}</div>
      <div className="label">{label}</div>
    </div>
  );
}

export function Loading() {
  return <p className="muted">Cargando…</p>;
}

export function ErrorBox({ message }: { message: string }) {
  return <p className="error">⚠️ {message}</p>;
}
