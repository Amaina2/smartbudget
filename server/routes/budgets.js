const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/authMiddleware');
const { evaluateBudgetAlerts } = require('../utils/budgetAlerts');

router.get('/', auth, async (req, res) => {
  const result = await db.query(
    `SELECT b.*, c.category_name
     FROM budgets b
     LEFT JOIN categories c ON b.category_id = c.category_id
     WHERE b.user_id = $1
     ORDER BY b.start_date DESC`,
    [req.user.id]
  );
  const rows = [];
  for (const b of result.rows) {
    const spentRes = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS spent
       FROM transactions
       WHERE user_id = $1
         AND transaction_type = 'expense'
         AND category_id = $2
         AND date >= $3
         AND date <= $4`,
      [req.user.id, b.category_id, b.start_date, b.end_date]
    );
    const spent = Number(spentRes.rows[0].spent);
    const limit = Number(b.amount_limit);
    const percentage = limit > 0 ? (spent / limit) * 100 : 0;
    rows.push({
      ...b,
      spent,
      remaining: Math.max(0, limit - spent),
      percentage: Math.round(percentage * 10) / 10,
    });
  }
  res.json(rows);
});

router.post('/', auth, async (req, res) => {
  const { category_id, amount_limit, period_type, start_date, end_date } = req.body;
  if (!category_id || amount_limit == null || !period_type || !start_date || !end_date) {
    return res.status(400).json({
      error: 'category_id, amount_limit, period_type, start_date, end_date required',
    });
  }
  const result = await db.query(
    `INSERT INTO budgets (user_id, category_id, amount_limit, period_type, start_date, end_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [req.user.id, category_id, amount_limit, period_type, start_date, end_date]
  );
  res.status(201).json(result.rows[0]);
});

router.put('/:id', auth, async (req, res) => {
  const { category_id, amount_limit, period_type, start_date, end_date } = req.body;
  const r = await db.query(
    `UPDATE budgets SET
       category_id = COALESCE($1, category_id),
       amount_limit = COALESCE($2, amount_limit),
       period_type = COALESCE($3, period_type),
       start_date = COALESCE($4, start_date),
       end_date = COALESCE($5, end_date)
     WHERE budget_id = $6 AND user_id = $7
     RETURNING *`,
    [category_id, amount_limit, period_type, start_date, end_date, req.params.id, req.user.id]
  );
  if (!r.rows.length) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.json(r.rows[0]);
});

router.delete('/:id', auth, async (req, res) => {
  const r = await db.query(
    'DELETE FROM budgets WHERE budget_id = $1 AND user_id = $2 RETURNING budget_id',
    [req.params.id, req.user.id]
  );
  if (!r.rows.length) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.json({ deleted: true });
});

router.post('/check-alerts', auth, async (req, res) => {
  const alerts = await evaluateBudgetAlerts(req.user.id);
  res.json({ alerts });
});

module.exports = router;
