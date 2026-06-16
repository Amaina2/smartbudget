import { useEffect, useMemo, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';

function getInitialTheme() {
  const saved = localStorage.getItem('sb-theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function Layout() {
  const token = localStorage.getItem('token');
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sb-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  };

  const isDark = useMemo(() => theme === 'dark', [theme]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="sb-shell">
      <Sidebar isDark={isDark} onToggleTheme={toggleTheme} />
      <main className="sb-main">
        <Outlet />
      </main>
    </div>
  );
}
