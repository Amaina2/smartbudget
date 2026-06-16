const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/authMiddleware');

router.get('/anomalies', auth, async (req, res) => {
  const result = await db.query(
    `SELECT amount, description, date, category_id
     FROM transactions
     WHERE user_id = $1 AND transaction_type = 'expense'
     ORDER BY date DESC
     LIMIT 100`,
    [req.user.id]
  );

  const tx = result.rows.map((r) => ({ ...r, amount: Number(r.amount) }));
  const avg = tx.reduce((a, b) => a + b.amount, 0) / Math.max(tx.length, 1);

  const anomalies = tx
    .filter((t) => t.amount > avg * 2.5)
    .map((t) => ({
      ...t,
      risk: 'HIGH',
      reason: 'Expense significantly above your normal pattern',
    }));

  const duplicateMap = new Map();
  tx.forEach((t) => {
    const key = `${t.description}-${t.amount}`;
    duplicateMap.set(key, (duplicateMap.get(key) || 0) + 1);
  });

  const duplicates = tx
    .filter((t) => duplicateMap.get(`${t.description}-${t.amount}`) > 1)
    .map((t) => ({
      ...t,
      risk: 'MEDIUM',
      reason: 'Possible duplicate charge',
    }));

  res.json({
    averageSpend: Math.round(avg * 100) / 100,
    anomalies,
    duplicates,
    recommendation:
      anomalies.length > 0
        ? 'Large unusual expenses detected. Review recent lifestyle or emergency spending.'
        : 'No abnormal expense risks detected.',
  });
});

module.exports = router;
