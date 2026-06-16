import { useEffect, useState } from 'react';
import api from '../lib/api';
import BudgetAlert from '../components/BudgetAlert';

function monthRange() {
  const n = new Date();
  const start = new Date(n.getFullYear(), n.getMonth(), 1);
  const end = new Date(n.getFullYear(), n.getMonth() + 1, 0);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { start_date: fmt(start), end_date: fmt(end) };
}

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category_id, setCategoryId] = useState('');
  const [amount_limit, setAmountLimit] = useState('');
  const [period_type, setPeriodType] = useState('monthly');
  const [start_date, setStartDate] = useState(monthRange().start_date);
  const [end_date, setEndDate] = useState(monthRange().end_date);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    const [b, c] = await Promise.all([api.get('/budgets'), api.get('/categories')]);
    setBudgets(b.data);
    setCategories(c.data);
    if (!category_id && c.data.length) {
      setCategoryId(String(c.data[0].category_id));
    }
  };

  useEffect(() => {
    load().catch((e) => setErr(e.response?.data?.error || e.message));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      await api.post('/budgets', {
        category_id: parseInt(category_id, 10),
        amount_limit: parseFloat(amount_limit),
        period_type,
        start_date,
        end_date,
      });
      setAmountLimit('');
      setMsg('Budget created.');
      await load();
      const { data } = await api.post('/budgets/check-alerts');
      if (data.alerts?.length) {
        setMsg(`Budget saved. ${data.alerts.length} threshold alert(s) evaluated.`);
      }
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this budget?')) return;
    try {
      await api.delete(`/budgets/${id}`);
      await load();
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    }
  };

  return (
    <div>
      <h1 className="sb-page-title">Budgets</h1>
      {err && <p className="sb-error">{err}</p>}
      {msg && <p className="sb-muted">{msg}</p>}

      <div className="sb-card" style={{ marginBottom: '1.5rem' }}>
        <h2>Create budget</h2>
        <form className="sb-form sb-form--inline" onSubmit={submit}>
          <div>
            <label className="sb-label">Category</label>
            <select className="sb-select" value={category_id} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.category_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="sb-label">Limit (KES)</label>
            <input
              className="sb-input"
              type="number"
              step="0.01"
              value={amount_limit}
              onChange={(e) => setAmountLimit(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="sb-label">Period</label>
            <select className="sb-select" value={period_type} onChange={(e) => setPeriodType(e.target.value)}>
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div>
            <label className="sb-label">Start</label>
            <input className="sb-input" type="date" value={start_date} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="sb-label">End</label>
            <input className="sb-input" type="date" value={end_date} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div>
            <button className="sb-btn" type="submit">
              Save budget
            </button>
          </div>
        </form>
      </div>

      <div className="sb-card" style={{ marginBottom: '1.5rem' }}>
        <h2>Active utilization</h2>
        <BudgetAlert budgets={budgets} />
      </div>

      <div className="sb-table-wrap">
        <table className="sb-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Period</th>
              <th>Limit</th>
              <th>Spent</th>
              <th>%</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {budgets.map((b) => (
              <tr key={b.budget_id}>
                <td>{b.category_name}</td>
                <td>{b.period_type}</td>
                <td>KES {Number(b.amount_limit).toFixed(2)}</td>
                <td>KES {Number(b.spent ?? 0).toFixed(2)}</td>
                <td>{Number(b.percentage ?? 0).toFixed(1)}%</td>
                <td>
                  <button type="button" className="sb-btn sb-btn--ghost sb-btn--small" onClick={() => remove(b.budget_id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
