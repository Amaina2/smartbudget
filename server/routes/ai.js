const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/authMiddleware');

router.get('/forecast', auth, async (req, res) => {
  const result = await db.query(
    `SELECT EXTRACT(DAY FROM date)::int AS day, AVG(amount) AS avg_spend
     FROM transactions
     WHERE user_id = $1 AND transaction_type = 'expense'
     GROUP BY EXTRACT(DAY FROM date)
     ORDER BY day`,
    [req.user.id]
  );

  const rows = result.rows.map((r) => ({
    day: Number(r.day),
    avg_spend: Number(r.avg_spend),
  }));

  const projectedMonthly = rows.reduce((a, r) => a + Number(r.avg_spend || 0), 0);

  res.json({
    dailyPattern: rows,
    projectedMonthly: Math.round(projectedMonthly * 100) / 100,
    recommendation:
      projectedMonthly > 10000
        ? 'Reduce non-essential spending by 15% to stay within a healthy student budget.'
        : 'Your current spending trend is sustainable.',
  });
});

module.exports = router;
