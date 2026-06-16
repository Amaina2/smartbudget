const router = require('express').Router();
const PDFDocument = require('pdfkit');
const db = require('../db');
const auth = require('../middleware/authMiddleware');

router.get('/summary', auth, async (req, res) => {
  const result = await db.query(
    `SELECT transaction_type, COALESCE(SUM(amount), 0) AS total
     FROM transactions
     WHERE user_id = $1
     GROUP BY transaction_type`,
    [req.user.id]
  );
  res.json(result.rows);
});

router.get('/category-breakdown', auth, async (req, res) => {
  const { from, to } = req.query;
  let sql = `
    SELECT c.category_name, COALESCE(SUM(t.amount), 0) AS total
    FROM transactions t
    JOIN categories c ON t.category_id = c.category_id
    WHERE t.user_id = $1 AND t.transaction_type = 'expense'`;
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
  sql += ' GROUP BY c.category_name ORDER BY total DESC';
  const result = await db.query(sql, params);
  res.json(result.rows);
});

router.get('/daily-trend', auth, async (req, res) => {
  const { from, to } = req.query;
  const fromD = from || new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
  const toD = to || new Date().toISOString().slice(0, 10);
  const result = await db.query(
    `SELECT date, COALESCE(SUM(amount), 0) AS total
     FROM transactions
     WHERE user_id = $1
       AND transaction_type = 'expense'
       AND date >= $2
       AND date <= $3
     GROUP BY date
     ORDER BY date`,
    [req.user.id, fromD, toD]
  );
  res.json(result.rows.map((r) => ({ ...r, total: Number(r.total) })));
});

router.get('/budget-comparison', auth, async (req, res) => {
  const budgets = await db.query(
    `SELECT b.*, c.category_name
     FROM budgets b
     LEFT JOIN categories c ON b.category_id = c.category_id
     WHERE b.user_id = $1
       AND b.start_date <= CURRENT_DATE
       AND b.end_date >= CURRENT_DATE`,
    [req.user.id]
  );
  const out = [];
  for (const b of budgets.rows) {
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
    out.push({
      category_name: b.category_name,
      budget: Number(b.amount_limit),
      spent,
    });
  }
  res.json(out);
});

router.get('/recommendations', auth, async (req, res) => {
  const summary = await db.query(
    `SELECT transaction_type, COALESCE(SUM(amount), 0) AS total
     FROM transactions
     WHERE user_id = $1
       AND date >= date_trunc('month', CURRENT_DATE)
     GROUP BY transaction_type`,
    [req.user.id]
  );

  const expensesByCategory = await db.query(
    `SELECT c.category_name, COALESCE(SUM(t.amount), 0) AS total
     FROM transactions t
     JOIN categories c ON t.category_id = c.category_id
     WHERE t.user_id = $1
       AND t.transaction_type = 'expense'
       AND t.date >= date_trunc('month', CURRENT_DATE)
     GROUP BY c.category_name
     ORDER BY total DESC`,
    [req.user.id]
  );

  const income = Number(summary.rows.find((r) => r.transaction_type === 'income')?.total || 0);
  const expense = Number(summary.rows.find((r) => r.transaction_type === 'expense')?.total || 0);
  const savings = income - expense;
  const topCategory = expensesByCategory.rows[0] || null;
  const needsCap = income * 0.5;
  const wantsCap = income * 0.3;
  const savingsTarget = income * 0.2;

  res.json({
    monthly: { income, expense, savings },
    recommendation50_30_20: {
      needs_cap: Math.round(needsCap * 100) / 100,
      wants_cap: Math.round(wantsCap * 100) / 100,
      savings_target: Math.round(savingsTarget * 100) / 100,
    },
    top_expense_category: topCategory
      ? {
          name: topCategory.category_name,
          total: Number(topCategory.total),
        }
      : null,
    nudge:
      savings < savingsTarget
        ? 'Your savings are below the 20% target this month. Reduce discretionary spending by 10-15%.'
        : 'Great job. You are on track with healthy monthly savings behavior.',
  });
});

router.get('/pdf', auth, async (req, res) => {
  const tx = await db.query(
    `SELECT amount, description, date, transaction_type
     FROM transactions
     WHERE user_id = $1
     ORDER BY date DESC
     LIMIT 50`,
    [req.user.id]
  );

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=smartbudget-report.pdf');
  doc.pipe(res);

  doc.fontSize(20).text('SmartBudget Financial Report', { underline: true });
  doc.moveDown();
  doc.fontSize(10).text(`Generated: ${new Date().toISOString().slice(0, 10)}`);
  doc.moveDown();

  tx.rows.forEach((row, i) => {
    doc
      .fontSize(11)
      .text(
        `${i + 1}. ${row.date} | ${String(row.transaction_type).toUpperCase()} | KES ${row.amount} | ${row.description || ''}`
      );
  });

  doc.end();
});

module.exports = router;
