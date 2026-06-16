const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/authMiddleware');
const { suggestCategory } = require('../utils/categorize');
const { evaluateBudgetAlerts } = require('../utils/budgetAlerts');

let schemaReady = false;

async function ensureRecurringSchema() {
  if (schemaReady) return;
  await db.query(`
    CREATE TABLE IF NOT EXISTS recurring_transactions (
      recurring_id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      amount DECIMAL(12, 2) NOT NULL,
      description VARCHAR(500) NOT NULL,
      category_id INTEGER REFERENCES categories(category_id),
      transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('income', 'expense')),
      frequency VARCHAR(10) NOT NULL CHECK (frequency IN ('weekly', 'monthly')),
      next_due_date DATE NOT NULL,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await db.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recurring_id INTEGER`);
  await db.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_transactions_recurring'
      ) THEN
        ALTER TABLE transactions
        ADD CONSTRAINT fk_transactions_recurring
        FOREIGN KEY (recurring_id)
        REFERENCES recurring_transactions(recurring_id)
        ON DELETE SET NULL;
      END IF;
    END $$;
  `);
  schemaReady = true;
}

function nextDateFromFrequency(dateStr, frequency) {
  const base = new Date(`${dateStr}T00:00:00Z`);
  const d = new Date(base);
  if (frequency === 'weekly') {
    d.setUTCDate(d.getUTCDate() + 7);
  } else {
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return d.toISOString().slice(0, 10);
}

async function processDueRecurring(userId) {
  await ensureRecurringSchema();
  const due = await db.query(
    `SELECT * FROM recurring_transactions
     WHERE user_id = $1
       AND active = TRUE
       AND next_due_date <= CURRENT_DATE
     ORDER BY next_due_date ASC`,
    [userId]
  );

  let created = 0;
  for (const item of due.rows) {
    const exists = await db.query(
      `SELECT transaction_id
       FROM transactions
       WHERE user_id = $1
         AND recurring_id = $2
         AND date = $3
       LIMIT 1`,
      [userId, item.recurring_id, item.next_due_date]
    );
    if (!exists.rows.length) {
      await db.query(
        `INSERT INTO transactions (user_id, amount, description, date, category_id, transaction_type, recurring_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          item.amount,
          `${item.description} (recurring)`,
          item.next_due_date,
          item.category_id,
          item.transaction_type,
          item.recurring_id,
        ]
      );
      created++;
    }

    const nextDue = nextDateFromFrequency(item.next_due_date, item.frequency);
    await db.query(
      `UPDATE recurring_transactions
       SET next_due_date = $1
       WHERE recurring_id = $2`,
      [nextDue, item.recurring_id]
    );
  }

  if (created > 0) {
    await evaluateBudgetAlerts(userId);
  }

  return { created, dueCount: due.rows.length };
}

router.post('/process-due', auth, async (req, res) => {
  try {
    const result = await processDueRecurring(req.user.id);
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to process recurring transactions' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    await processDueRecurring(req.user.id);
    const result = await db.query(
      `SELECT r.*, c.category_name
       FROM recurring_transactions r
       LEFT JOIN categories c ON r.category_id = c.category_id
       WHERE r.user_id = $1
       ORDER BY r.next_due_date ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load recurring transactions' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    let { amount, description, category_id, transaction_type, frequency, next_due_date } = req.body;
    if (!amount || !description || !transaction_type || !frequency || !next_due_date) {
      return res.status(400).json({ error: 'amount, description, transaction_type, frequency, next_due_date required' });
    }
    if (!category_id) {
      category_id = await suggestCategory(req.user.id, description);
    }
    const result = await db.query(
      `INSERT INTO recurring_transactions
       (user_id, amount, description, category_id, transaction_type, frequency, next_due_date, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
       RETURNING *`,
      [req.user.id, amount, description, category_id, transaction_type, frequency, next_due_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create recurring transaction' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { amount, description, category_id, transaction_type, frequency, next_due_date, active } = req.body;
    const result = await db.query(
      `UPDATE recurring_transactions SET
         amount = COALESCE($1, amount),
         description = COALESCE($2, description),
         category_id = COALESCE($3, category_id),
         transaction_type = COALESCE($4, transaction_type),
         frequency = COALESCE($5, frequency),
         next_due_date = COALESCE($6, next_due_date),
         active = COALESCE($7, active)
       WHERE recurring_id = $8
         AND user_id = $9
       RETURNING *`,
      [amount, description, category_id, transaction_type, frequency, next_due_date, active, req.params.id, req.user.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update recurring transaction' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE recurring_transactions
       SET active = FALSE
       WHERE recurring_id = $1
         AND user_id = $2
       RETURNING recurring_id`,
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ deactivated: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete recurring transaction' });
  }
});

module.exports = router;
