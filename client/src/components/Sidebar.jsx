import { NavLink, useNavigate } from 'react-router-dom';
import api from '../lib/api';

const linkClass = ({ isActive }) =>
  'sb-nav-link' + (isActive ? ' sb-nav-link--active' : '');

export default function Sidebar({ isDark, onToggleTheme }) {
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore */
    }
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <aside className="sb-sidebar">
      <div className="sb-brand">SmartBudget</div>
      <nav className="sb-nav">
        <NavLink to="/" end className={linkClass}>
          Dashboard
        </NavLink>
        <NavLink to="/transactions" className={linkClass}>
          Transactions
        </NavLink>
        <NavLink to="/budgets" className={linkClass}>
          Budgets
        </NavLink>
        <NavLink to="/reports" className={linkClass}>
          Analytics
        </NavLink>
        <NavLink to="/ai" className={linkClass}>
          AI Insights
        </NavLink>
        <NavLink to="/risk" className={linkClass}>
          Risk Center
        </NavLink>
        <NavLink to="/mpesa" className={linkClass}>
          M-Pesa
        </NavLink>
        <NavLink to="/recurring" className={linkClass}>
          Recurring
        </NavLink>
      </nav>
      <button type="button" className="sb-btn sb-btn--ghost sb-theme-toggle" onClick={onToggleTheme}>
        <span aria-hidden="true" className="sb-theme-icon">{isDark ? '☀️' : '🌙'}</span>{' '}
        {isDark ? 'Light mode' : 'Dark mode'}
      </button>
      <button type="button" className="sb-btn sb-btn--ghost sb-logout" onClick={logout}>
        Log out
      </button>
    </aside>
  );
}
