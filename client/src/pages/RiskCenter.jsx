import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function RiskCenter() {
  const [risk, setRisk] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api
      .get('/risk/anomalies')
      .then((r) => setRisk(r.data))
      .catch((e) => setErr(e.response?.data?.error || e.message));
  }, []);

  if (err) {
    return <p className="sb-error">{err}</p>;
  }

  if (!risk) {
    return (
      <div className="sb-card">
        <p className="sb-muted">Loading risk insights…</p>
      </div>
    );
  }

  return (
    <div className="sb-stack">
      <h1 className="sb-page-title">Risk intelligence</h1>
      <div className="sb-card">
        <p>
          Average expense (recent sample):{' '}
          <strong>KES {Number(risk.averageSpend).toFixed(2)}</strong>
        </p>
        <p style={{ marginTop: '0.75rem' }}>{risk.recommendation}</p>
      </div>

      <div className="sb-card">
        <h2>High — unusual spikes</h2>
        {!risk.anomalies?.length ? (
          <p className="sb-muted">None flagged.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {risk.anomalies.map((a, i) => (
              <li key={i} style={{ marginBottom: '0.5rem' }}>
                KES {Number(a.amount).toFixed(2)} — {a.reason} ({a.date})
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="sb-card">
        <h2>Medium — possible duplicates</h2>
        {!risk.duplicates?.length ? (
          <p className="sb-muted">None flagged.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {risk.duplicates.map((d, i) => (
              <li key={i} style={{ marginBottom: '0.5rem' }}>
                KES {Number(d.amount).toFixed(2)} — {d.reason} — {d.description}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
