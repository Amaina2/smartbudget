import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../lib/api';
import SummaryCards from '../components/SummaryCards';
import BudgetAlert from '../components/BudgetAlert';

export default function Dashboard() {
  const [summary, setSummary] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [recent, setRecent] = useState([]);
  const [trend, setTrend] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [goalInput, setGoalInput] = useState('');
  const [goal, setGoal] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, b, t, d, r] = await Promise.all([
          api.get('/reports/summary'),
          api.get('/budgets'),
          api.get('/transactions'),
          api.get('/reports/daily-trend'),
          api.get('/reports/recommendations'),
        ]);
        if (!cancelled) {
          setSummary(s.data);
          setBudgets(b.data);
          setRecent(t.data.slice(0, 5));
          setTrend(d.data);
          setRecommendations(r.data);
        }
      } catch (e) {
        if (!cancelled) setErr(e.response?.data?.error || e.message || 'Failed to load');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const income = summary.find((r) => r.transaction_type === 'income')?.total;
  const expense = summary.find((r) => r.transaction_type === 'expense')?.total;

  const chartData = trend.map((r) => ({
    date: String(r.date).slice(5),
    total: Number(r.total),
  }));

  useEffect(() => {
    const saved = localStorage.getItem('sb-monthly-goal');
    if (saved && !Number.isNaN(Number(saved))) {
      const parsed = Number(saved);
      setGoal(parsed);
      setGoalInput(String(parsed));
    }
  }, []);

  useEffect(() => {
    if (goal == null && recommendations?.recommendation50_30_20?.savings_target) {
      const suggested = Number(recommendations.recommendation50_30_20.savings_target);
      setGoal(suggested);
      setGoalInput(String(suggested));
      localStorage.setItem('sb-monthly-goal', String(suggested));
    }
  }, [goal, recommendations]);

  const currentSavings = Number(recommendations?.monthly?.savings || 0);
  const goalPct = goal && goal > 0 ? Math.max(0, Math.min(100, (currentSavings / goal) * 100)) : 0;
  const goalStatusClass = goalPct >= 100 ? 'sb-goal--ok' : goalPct >= 70 ? 'sb-goal--warn' : 'sb-goal--danger';

  const saveGoal = () => {
    const parsed = Number(goalInput);
    if (Number.isNaN(parsed) || parsed <= 0) {
      setErr('Enter a valid monthly savings goal above 0.');
      return;
    }
    setErr('');
    setGoal(parsed);
    localStorage.setItem('sb-monthly-goal', String(parsed));
  };

  return (
    <div>
      <h1 className="sb-page-title">Dashboard</h1>
      {err && <p className="sb-error">{err}</p>}

      <SummaryCards
        income={income}
        expense={expense}
      />

      <div className="sb-grid-2">
        <div className="sb-card">
          <h2>Budget status</h2>
          <BudgetAlert budgets={budgets} />
        </div>
        <div className="sb-card">
          <h2>Spending trend (30 days)</h2>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {recommendations && (
        <div className="sb-card" style={{ marginTop: '1.5rem' }}>
          <h2>Smart recommendations</h2>
          <p className="sb-muted" style={{ marginBottom: '0.5rem' }}>
            50/30/20 planner based on your current month.
          </p>
          <div className="sb-summary-grid" style={{ marginBottom: '0.5rem' }}>
            <div className="sb-card">
              <div className="sb-card__label">Needs cap (50%)</div>
              <div className="sb-card__value">
                KES {Number(recommendations.recommendation50_30_20.needs_cap).toFixed(2)}
              </div>
            </div>
            <div className="sb-card">
              <div className="sb-card__label">Wants cap (30%)</div>
              <div className="sb-card__value">
                KES {Number(recommendations.recommendation50_30_20.wants_cap).toFixed(2)}
              </div>
            </div>
            <div className="sb-card">
              <div className="sb-card__label">Savings target (20%)</div>
              <div className="sb-card__value">
                KES {Number(recommendations.recommendation50_30_20.savings_target).toFixed(2)}
              </div>
            </div>
          </div>
          {recommendations.top_expense_category && (
            <p className="sb-muted">
              Top spending category this month:{' '}
              <strong>{recommendations.top_expense_category.name}</strong> (KES{' '}
              {Number(recommendations.top_expense_category.total).toFixed(2)})
            </p>
          )}
          <p style={{ marginTop: '0.5rem' }}>{recommendations.nudge}</p>
        </div>
      )}

      {recommendations && (
        <div className="sb-card" style={{ marginTop: '1.5rem' }}>
          <h2>Monthly savings goal tracker</h2>
          <div className="sb-form sb-form--inline" style={{ marginBottom: '0.5rem' }}>
            <div>
              <label className="sb-label">Goal amount (KES)</label>
              <input
                className="sb-input"
                type="number"
                min="1"
                step="0.01"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="Set your monthly savings goal"
              />
            </div>
            <div>
              <button type="button" className="sb-btn" onClick={saveGoal}>
                Save goal
              </button>
            </div>
          </div>
          <div className={`sb-goal-chip ${goalStatusClass}`}>
            {goalPct >= 100
              ? 'Great work — goal achieved.'
              : goalPct >= 70
              ? 'You are close to your target.'
              : 'You are behind target. Consider reducing discretionary spend.'}
          </div>
          <div className="sb-progress" style={{ marginTop: '0.75rem' }}>
            <div className="sb-progress__bar" style={{ width: `${goalPct}%` }} />
          </div>
          <p className="sb-muted" style={{ marginTop: '0.5rem' }}>
            KES {currentSavings.toFixed(2)} saved / KES {Number(goal || 0).toFixed(2)} goal ({goalPct.toFixed(1)}%)
          </p>
        </div>
      )}

      <div className="sb-card" style={{ marginTop: '1.5rem' }}>
        <h2>Recent transactions</h2>
        {!recent.length ? (
          <p className="sb-muted">No transactions yet. Add some under Transactions.</p>
        ) : (
          <div className="sb-table-wrap">
            <table className="sb-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.transaction_id}>
                    <td>{r.date}</td>
                    <td>{r.description}</td>
                    <td>{r.category_name || '—'}</td>
                    <td>{r.transaction_type}</td>
                    <td className={r.transaction_type === 'income' ? 'sb-text-income' : 'sb-text-expense'}>
                      KES {Number(r.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
