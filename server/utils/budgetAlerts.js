const db = require('../db');

/**
 * Recompute spend vs budgets for current user; set alert flags; return fresh alerts.
 */
async function evaluateBudgetAlerts(userId) {
  const budgets = await db.query(
    `SELECT * FROM budgets
     WHERE user_id = $1
       AND start_date <= CURRENT_DATE
       AND end_date >= CURRENT_DATE`,
    [userId]
  );

  const alerts = [];

  for (const b of budgets.rows) {
    const spentRes = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS spent
       FROM transactions
       WHERE user_id = $1
         AND transaction_type = 'expense'
         AND category_id = $2
         AND date >= $3
         AND date <= $4`,
      [userId, b.category_id, b.start_date, b.end_date]
    );
    const spent = Number(spentRes.rows[0].spent);
    const limit = Number(b.amount_limit);
    const pct = limit > 0 ? (spent / limit) * 100 : 0;

    if (pct >= 100 && !b.alert_100_sent) {
      await db.query(
        'UPDATE budgets SET alert_100_sent = TRUE WHERE budget_id = $1',
        [b.budget_id]
      );
      alerts.push({
        level: 100,
        message: 'Budget exceeded',
        budget_id: b.budget_id,
        category_id: b.category_id,
        percentage: Math.round(pct * 10) / 10,
        spent,
        limit,
      });
    } else if (pct >= 90 && !b.alert_90_sent) {
      await db.query(
        'UPDATE budgets SET alert_90_sent = TRUE WHERE budget_id = $1',
        [b.budget_id]
      );
      alerts.push({
        level: 90,
        message: 'Approaching budget limit',
        budget_id: b.budget_id,
        category_id: b.category_id,
        percentage: Math.round(pct * 10) / 10,
        spent,
        limit,
      });
    } else if (pct >= 80 && !b.alert_80_sent) {
      await db.query(
        'UPDATE budgets SET alert_80_sent = TRUE WHERE budget_id = $1',
        [b.budget_id]
      );
      alerts.push({
        level: 80,
        message: 'Budget warning',
        budget_id: b.budget_id,
        category_id: b.category_id,
        percentage: Math.round(pct * 10) / 10,
        spent,
        limit,
      });
    }
  }

  return alerts;
}

module.exports = { evaluateBudgetAlerts };
