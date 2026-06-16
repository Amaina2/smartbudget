import { useEffect, useState } from 'react';
import api, { downloadCsv } from '../lib/api';

export default function Transactions() {
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [transaction_type, setTransactionType] = useState('expense');
  const [category_id, setCategoryId] = useState('');
  const [importText, setImportText] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const load = async () => {
    const [t, c] = await Promise.all([api.get('/transactions'), api.get('/categories')]);
    setRows(t.data);
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
      const body = {
        amount: parseFloat(amount),
        description,
        date,
        transaction_type,
        category_id: category_id ? parseInt(category_id, 10) : undefined,
      };
      if (editId) {
        await api.put(`/transactions/${editId}`, body);
        setMsg('Transaction updated.');
      } else {
        await api.post('/transactions', body);
        setMsg('Transaction saved.');
      }
      setEditId(null);
      setAmount('');
      setDescription('');
      await load();
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      await load();
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    }
  };

  const startEdit = (row) => {
    setEditId(row.transaction_id);
    setAmount(String(row.amount));
    setDescription(row.description || '');
    setDate(String(row.date).slice(0, 10));
    setTransactionType(row.transaction_type);
    setCategoryId(row.category_id ? String(row.category_id) : '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditId(null);
    setAmount('');
    setDescription('');
    setDate(new Date().toISOString().slice(0, 10));
  };

  const doImport = async () => {
    setErr('');
    setMsg('');
    try {
      const { data } = await api.post('/transactions/import/csv', { csv: importText });
      setMsg(`Imported ${data.imported} rows.`);
      setImportText('');
      await load();
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    }
  };

  const filteredRows = rows.filter((r) => {
    const bySearch =
      !search ||
      String(r.description || '').toLowerCase().includes(search.toLowerCase()) ||
      String(r.category_name || '').toLowerCase().includes(search.toLowerCase());
    const byType = filterType === 'all' || r.transaction_type === filterType;
    const byFrom = !fromDate || String(r.date).slice(0, 10) >= fromDate;
    const byTo = !toDate || String(r.date).slice(0, 10) <= toDate;
    return bySearch && byType && byFrom && byTo;
  });

  return (
    <div>
      <h1 className="sb-page-title">Transactions</h1>
      {err && <p className="sb-error">{err}</p>}
      {msg && <p className="sb-muted">{msg}</p>}

      <div className="sb-card" style={{ marginBottom: '1.5rem' }}>
        <h2>{editId ? 'Edit transaction' : 'Add transaction'}</h2>
        <form className="sb-form sb-form--inline" onSubmit={submit}>
          <div>
            <label className="sb-label">Date</label>
            <input className="sb-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label className="sb-label">Amount (KES)</label>
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
            <label className="sb-label">Category</label>
            <select className="sb-select" value={category_id} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.category_name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="sb-label">Description</label>
            <input
              className="sb-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Uber to campus"
            />
          </div>
          <div>
            <button className="sb-btn" type="submit">
              {editId ? 'Update' : 'Save'}
            </button>
          </div>
          {editId && (
            <div>
              <button type="button" className="sb-btn sb-btn--ghost" onClick={cancelEdit}>
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>

      <div className="sb-card" style={{ marginBottom: '1.5rem' }}>
        <h2>Filter transactions</h2>
        <div className="sb-form sb-form--inline">
          <div>
            <label className="sb-label">Search description/category</label>
            <input
              className="sb-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. uber, food"
            />
          </div>
          <div>
            <label className="sb-label">Type</label>
            <select className="sb-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">All</option>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div>
            <label className="sb-label">From</label>
            <input className="sb-input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <label className="sb-label">To</label>
            <input className="sb-input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div>
            <button
              type="button"
              className="sb-btn sb-btn--ghost"
              onClick={() => {
                setSearch('');
                setFilterType('all');
                setFromDate('');
                setToDate('');
              }}
            >
              Reset filters
            </button>
          </div>
        </div>
        <p className="sb-muted">
          Showing {filteredRows.length} of {rows.length} transactions.
        </p>
      </div>

      <div className="sb-card" style={{ marginBottom: '1.5rem' }}>
        <h2>Import CSV</h2>
        <p className="sb-muted" style={{ fontSize: '0.85rem' }}>
          Header: <code>date,transaction_type,amount,description</code> — one row per line after header.
        </p>
        <textarea
          className="sb-input"
          rows={5}
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="date,transaction_type,amount,description&#10;2026-01-15,expense,250,uber ride"
          style={{ fontFamily: 'ui-monospace, monospace', marginTop: '0.5rem' }}
        />
        <button type="button" className="sb-btn sb-btn--ghost" style={{ marginTop: '0.5rem' }} onClick={doImport}>
          Import
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button type="button" className="sb-btn sb-btn--ghost" onClick={() => downloadCsv().catch(() => setErr('Export failed'))}>
          Export CSV
        </button>
      </div>

      <div className="sb-table-wrap">
        <table className="sb-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Type</th>
              <th>Amount</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r) => (
              <tr key={r.transaction_id}>
                <td>{r.date}</td>
                <td>{r.description}</td>
                <td>{r.category_name || '—'}</td>
                <td>{r.transaction_type}</td>
                <td className={r.transaction_type === 'income' ? 'sb-text-income' : 'sb-text-expense'}>
                  KES {Number(r.amount).toFixed(2)}
                </td>
                <td>
                  <button type="button" className="sb-btn sb-btn--ghost sb-btn--small" onClick={() => startEdit(r)}>
                    Edit
                  </button>{' '}
                  <button type="button" className="sb-btn sb-btn--ghost sb-btn--small" onClick={() => remove(r.transaction_id)}>
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
