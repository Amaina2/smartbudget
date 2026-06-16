export default function SummaryCards({ income, expense }) {
  const inc = Number(income || 0);
  const exp = Number(expense || 0);
  const bal = inc - exp;

  return (
    <div className="sb-summary-grid">
      <div className="sb-card sb-card--accent">
        <div className="sb-card__label">Income</div>
        <div className="sb-card__value">KES {inc.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
      </div>
      <div className="sb-card">
        <div className="sb-card__label">Expenses</div>
        <div className="sb-card__value sb-text-expense">
          KES {exp.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
      </div>
      <div className="sb-card">
        <div className="sb-card__label">Net</div>
        <div className={'sb-card__value ' + (bal >= 0 ? 'sb-text-income' : 'sb-text-expense')}>
          KES {bal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
      </div>
    </div>
  );
}
