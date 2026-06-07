import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import CustomerProfile from './pages/CustomerProfile';
import Inventory from './pages/Inventory';
import CustomerPortal from './pages/CustomerPortal';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/orders', label: 'Gestión de Pedidos' },
  { to: '/customer', label: 'Perfil del Cliente' },
  { to: '/inventory', label: 'Inventario Predictivo' },
];

export default function App() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>🥤 Arca · Sustituciones</h1>
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <p className="muted" style={{ marginTop: 24, color: '#7a7d8c' }}>
          Frontend provisional para probar el backend. El diseño final viene de Figma.
        </p>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/customer" element={<CustomerProfile />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/portal" element={<CustomerPortal />} />
        </Routes>
      </main>
    </div>
  );
}
