import { useState } from 'react';
import api from '../lib/api';

export default function Mpesa() {
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setResult(null);
    try {
      const { data } = await api.post('/mpesa/stkpush', {
        phone,
        amount: parseFloat(amount),
      });
      setResult(data);
    } catch (e) {
      setErr(e.response?.data?.error || e.response?.data?.detail || e.message);
    }
  };

  return (
    <div>
      <h1 className="sb-page-title">M-Pesa (Daraja)</h1>
      <p className="sb-muted" style={{ marginBottom: '1rem' }}>
        STK Push uses Safaricom sandbox credentials in server <code>.env</code>. Callback URL must be reachable for
        auto-posted expenses.
      </p>

      <div className="sb-card" style={{ maxWidth: 420 }}>
        <form className="sb-form" onSubmit={submit}>
          <div>
            <label className="sb-label">Phone (254…)</label>
            <input
              className="sb-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="2547XXXXXXXX"
              required
            />
          </div>
          <div>
            <label className="sb-label">Amount (KES)</label>
            <input
              className="sb-input"
              type="number"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <button className="sb-btn" type="submit">
            Initiate STK Push
          </button>
        </form>
        {err && <p className="sb-error" style={{ marginTop: '1rem' }}>{String(err)}</p>}
        {result && (
          <pre
            style={{
              marginTop: '1rem',
              fontSize: '0.8rem',
              overflow: 'auto',
              background: '#f8fafc',
              padding: '0.75rem',
              borderRadius: 8,
            }}
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
