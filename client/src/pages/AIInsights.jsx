import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function AIInsights() {
  const [forecast, setForecast] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api
      .get('/ai/forecast')
      .then((r) => setForecast(r.data))
      .catch((e) => setErr(e.response?.data?.error || e.message));
  }, []);

  if (err) {
    return <p className="sb-error">{err}</p>;
  }

  if (!forecast) {
    return (
      <div className="sb-card">
        <p className="sb-muted">Loading AI insights…</p>
      </div>
    );
  }

  return (
    <div className="sb-stack">
      <h1 className="sb-page-title">AI spending forecast</h1>
      <div className="sb-card">
        <h2>Hybrid explainable model</h2>
        <p className="sb-muted" style={{ marginBottom: '1rem' }}>
          Rule-based categorization plus behavioral projection from your history (no black-box model).
        </p>
        <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>
          Projected monthly spend: KES {Number(forecast.projectedMonthly).toFixed(2)}
        </p>
        <p style={{ marginTop: '1rem' }}>{forecast.recommendation}</p>
      </div>
      {forecast.dailyPattern?.length > 0 && (
        <div className="sb-card">
          <h2>Daily pattern (day-of-month averages)</h2>
          <div className="sb-table-wrap">
            <table className="sb-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Avg spend</th>
                </tr>
              </thead>
              <tbody>
                {forecast.dailyPattern.slice(0, 15).map((r) => (
                  <tr key={r.day}>
                    <td>{r.day}</td>
                    <td>KES {Number(r.avg_spend).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
