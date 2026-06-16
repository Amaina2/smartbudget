import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import api, { downloadPdf } from '../lib/api';

const COLORS = ['#2563eb', '#16a34a', '#ca8a04', '#ea580c', '#9333ea', '#dc2626', '#0891b2'];

export default function Reports() {
  const [breakdown, setBreakdown] = useState([]);
  const [compare, setCompare] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [c, b] = await Promise.all([
          api.get('/reports/category-breakdown'),
          api.get('/reports/budget-comparison'),
        ]);
        if (!cancelled) {
          setBreakdown(c.data.map((r) => ({ name: r.category_name, value: Number(r.total) })));
          setCompare(
            b.data.map((r) => ({
              name: r.category_name,
              spent: r.spent,
              budget: r.budget,
            }))
          );
        }
      } catch (e) {
        if (!cancelled) setErr(e.response?.data?.error || e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 className="sb-page-title">Expense analytics</h1>
      {err && <p className="sb-error">{err}</p>}

      <div style={{ marginBottom: '1rem' }}>
        <button type="button" className="sb-btn" onClick={() => downloadPdf().catch(() => setErr('PDF download failed'))}>
          Download PDF report
        </button>
      </div>

      <div className="sb-grid-2">
        <div className="sb-card">
          <div className="sb-chart-title">Spending by category</div>
          {!breakdown.length ? (
            <p className="sb-muted">No expense data yet.</p>
          ) : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={breakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {breakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `KES ${Number(v).toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="sb-card">
          <div className="sb-chart-title">Budget vs spent (active periods)</div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={compare}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `KES ${Number(v).toFixed(2)}`} />
                <Legend />
                <Bar dataKey="budget" fill="#94a3b8" name="Budget" />
                <Bar dataKey="spent" fill="#2563eb" name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
