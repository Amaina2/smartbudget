const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/authMiddleware');
const { suggestCategory } = require('../utils/categorize');
const { evaluateBudgetAlerts } = require('../utils/budgetAlerts');

router.get('/export/csv', auth, async (req, res) => {
  const result = await db.query(
    `SELECT t.date, t.transaction_type, t.amount, t.description, c.category_name
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.category_id
     WHERE t.user_id = $1
     ORDER BY t.date DESC`,
    [req.user.id]
  );
  const header = 'date,transaction_type,amount,description,category_name\n';
  const lines = result.rows
    .map((row) =>
      [
        row.date,
        row.transaction_type,
        row.amount,
        `"${String(row.description || '').replace(/"/g, '""')}"`,
        `"${String(row.category_name || '').replace(/"/g, '""')}"`,
      ].join(',')
    )
    .join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="smartbudget-transactions.csv"');
  res.send(header + lines);
});

router.post('/import/csv', auth, async (req, res) => {
  const { csv } = req.body;
  if (!csv || typeof csv !== 'string') {
    return res.status(400).json({ error: 'csv string required' });
  }
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    return res.status(400).json({ error: 'CSV must have header and at least one row' });
  }
  let imported = 0;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^([^,]+),([^,]+),([^,]+),(.+)$/);
    if (!m) continue;
    const [, date, transaction_type, amountStr, descriptionRaw] = m;
    const description = descriptionRaw.replace(/^"|"$/g, '').replace(/""/g, '"');
    const amount = parseFloat(amountStr);
    if (Number.isNaN(amount)) continue;
    const category_id = await suggestCategory(req.user.id, description);
    await db.query(
      `INSERT INTO transactions (user_id, amount, description, date, category_id, transaction_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.id, amount, description, date, category_id, transaction_type]
    );
    imported++;
  }
  await evaluateBudgetAlerts(req.user.id);
  res.json({ imported });
});

router.get('/', auth, async (req, res) => {
  const { from, to, category_id, transaction_type } = req.query;
  let sql = `
    SELECT t.*, c.category_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.category_id
    WHERE t.user_id = $1`;
  const params = [req.user.id];
  let i = 2;
  if (from) {
    sql += ` AND t.date >= $${i++}`;
    params.push(from);
  }
  if (to) {
    sql += ` AND t.date <= $${i++}`;
    params.push(to);
  }
  if (category_id) {
    sql += ` AND t.category_id = $${i++}`;
    params.push(category_id);
  }
  if (transaction_type) {
    sql += ` AND t.transaction_type = $${i++}`;
    params.push(transaction_type);
  }
  sql += ' ORDER BY t.date DESC, t.transaction_id DESC';
  const result = await db.query(sql, params);
  res.json(result.rows);
});

router.post('/', auth, async (req, res) => {
  try {
    let {
      amount,
      description,
      date,
      category_id,
      transaction_type,
    } = req.body;
    if (amount == null || !transaction_type) {
      return res.status(400).json({ error: 'amount and transaction_type required' });
    }
    const d = date || new Date().toISOString().slice(0, 10);
    if (!category_id && description) {
      category_id = await suggestCategory(req.user.id, description);
    }
    if (!category_id) {
      category_id = await suggestCategory(req.user.id, 'general');
    }
    const result = await db.query(
      `INSERT INTO transactions (user_id, amount, description, date, category_id, transaction_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, amount, description || '', d, category_id, transaction_type]
    );
    const alerts = await evaluateBudgetAlerts(req.user.id);
    res.status(201).json({ transaction: result.rows[0], budgetAlerts: alerts });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not create transaction' });
  }
});

router.put('/:id', auth, async (req, res) => {
  const { amount, description, date, category_id, transaction_type } = req.body;
  const check = await db.query(
    'SELECT transaction_id FROM transactions WHERE transaction_id = $1 AND user_id = $2',
    [req.params.id, req.user.id]
  );
  if (!check.rows.length) {
    return res.status(404).json({ error: 'Not found' });
  }
  const result = await db.query(
    `UPDATE transactions SET
       amount = COALESCE($1, amount),
       description = COALESCE($2, description),
       date = COALESCE($3, date),
       category_id = COALESCE($4, category_id),
       transaction_type = COALESCE($5, transaction_type)
     WHERE transaction_id = $6 AND user_id = $7
     RETURNING *`,
    [amount, description, date, category_id, transaction_type, req.params.id, req.user.id]
  );
  const alerts = await evaluateBudgetAlerts(req.user.id);
  res.json({ transaction: result.rows[0], budgetAlerts: alerts });
});

router.delete('/:id', auth, async (req, res) => {
  const r = await db.query(
    'DELETE FROM transactions WHERE transaction_id = $1 AND user_id = $2 RETURNING transaction_id',
    [req.params.id, req.user.id]
  );
  if (!r.rows.length) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.json({ deleted: true });
});

module.exports = router;
