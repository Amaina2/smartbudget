function alertStyle(pct) {
  if (pct >= 100) return { label: 'Budget exceeded', className: 'sb-alert sb-alert--danger' };
  if (pct >= 90) return { label: 'Approaching limit', className: 'sb-alert sb-alert--orange' };
  if (pct >= 80) return { label: 'Budget warning', className: 'sb-alert sb-alert--warn' };
  return { label: 'On track', className: 'sb-alert sb-alert--ok' };
}

export default function BudgetAlert({ budgets }) {
  if (!budgets?.length) {
    return <p className="sb-muted">No active budgets for this period.</p>;
  }

  return (
    <div className="sb-budget-alerts">
      {budgets.map((b) => {
        const pct = Number(b.percentage || 0);
        const { label, className } = alertStyle(pct);
        return (
          <div key={b.budget_id} className={className}>
            <div className="sb-budget-row">
              <strong>{b.category_name || 'Category'}</strong>
              <span>{label}</span>
            </div>
            <div className="sb-progress">
              <div
                className="sb-progress__bar"
                style={{
                  width: `${Math.min(100, pct)}%`,
                  backgroundColor:
                    pct >= 100 ? '#dc2626' : pct >= 90 ? '#ea580c' : pct >= 80 ? '#ca8a04' : '#16a34a',
                }}
              />
            </div>
            <div className="sb-budget-meta">
              KES {Number(b.spent || 0).toFixed(2)} / KES {Number(b.amount_limit).toFixed(2)} ·{' '}
              {pct.toFixed(1)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}
