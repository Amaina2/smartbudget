import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function Recurring() {
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category_id, setCategoryId] = useState('');
  const [transaction_type, setTransactionType] = useState('expense');
  const [frequency, setFrequency] = useState('monthly');
  const [next_due_date, setNextDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [processing, setProcessing] = useState(false);

  const load = async () => {
    const [r, c] = await Promise.all([api.get('/recurring'), api.get('/categories')]);
    setRows(r.data);
    setCategories(c.data);
    if (!category_id && c.data.length) {
      setCategoryId(String(c.data[0].category_id));
    }
  };

  useEffect(() => {
    load().catch((e) => setErr(e.response?.data?.error || e.message));
  }, []);

  const createRecurring = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      await api.post('/recurring', {
        amount: parseFloat(amount),
        description,
        category_id: category_id ? parseInt(category_id, 10) : undefined,
        transaction_type,
        frequency,
        next_due_date,
      });
      setAmount('');
      setDescription('');
      setMsg('Recurring transaction added.');
      await load();
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    }
  };

  const processDue = async () => {
    setProcessing(true);
    setErr('');
    setMsg('');
    try {
      const { data } = await api.post('/recurring/process-due');
      setMsg(`Processed ${data.dueCount} due schedule(s), created ${data.created} transaction(s).`);
      await load();
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setProcessing(false);
    }
  };

  const toggleActive = async (item) => {
    setErr('');
    try {
      await api.put(`/recurring/${item.recurring_id}`, { active: !item.active });
      await load();
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    }
  };

  const deactivate = async (id) => {
    if (!confirm('Deactivate this recurring schedule?')) return;
    setErr('');
    try {
      await api.delete(`/recurring/${id}`);
      await load();
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <h1 className="sb-page-title">Recurring Transactions</h1>
      {err && <p className="sb-error">{err}</p>}
      {msg && <p className="sb-muted">{msg}</p>}

      <div className="sb-card" style={{ marginBottom: '1.5rem' }}>
        <h2>Create schedule</h2>
        <form className="sb-form sb-form--inline" onSubmit={createRecurring}>
          <div>
            <label className="sb-label">Description</label>
            <input className="sb-input" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div>
            <label className="sb-label">Amount</label>
            <input
              className="sb-input"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="sb-label">Type</label>
            <select className="sb-select" value={transaction_type} onChange={(e) => setTransactionType(e.target.value)}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div>
            <label className="sb-label">Frequency</label>
            <select className="sb-select" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div>
            <label className="sb-label">Next due</label>
            <input className="sb-input" type="date" value={next_due_date} onChange={(e) => setNextDueDate(e.target.value)} />
          </div>
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
            <button className="sb-btn" type="submit">Add schedule</button>
          </div>
        </form>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <button type="button" className="sb-btn sb-btn--ghost" onClick={processDue} disabled={processing}>
          {processing ? 'Processing...' : 'Process Due Now'}
        </button>
      </div>

      <div className="sb-table-wrap">
        <table className="sb-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Frequency</th>
              <th>Category</th>
              <th>Next due</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const overdue = r.active && String(r.next_due_date).slice(0, 10) <= today;
              return (
                <tr key={r.recurring_id}>
                  <td>{r.description}</td>
                  <td className={r.transaction_type === 'income' ? 'sb-text-income' : 'sb-text-expense'}>
                    KES {Number(r.amount).toFixed(2)}
                  </td>
                  <td>{r.transaction_type}</td>
                  <td>{r.frequency}</td>
                  <td>{r.category_name || '—'}</td>
                  <td>{String(r.next_due_date).slice(0, 10)}</td>
                  <td>
                    {r.active ? (overdue ? 'Overdue' : 'Active') : 'Inactive'}
                  </td>
                  <td>
                    <button type="button" className="sb-btn sb-btn--ghost sb-btn--small" onClick={() => toggleActive(r)}>
                      {r.active ? 'Pause' : 'Resume'}
                    </button>{' '}
                    <button type="button" className="sb-btn sb-btn--ghost sb-btn--small" onClick={() => deactivate(r.recurring_id)}>
                      Deactivate
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
