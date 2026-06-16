const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, async (req, res) => {
  const result = await db.query(
    `SELECT category_id, category_name, keywords, is_default
     FROM categories
     WHERE user_id IS NULL OR user_id = $1
     ORDER BY category_name`,
    [req.user.id]
  );
  res.json(result.rows);
});

router.post('/', auth, async (req, res) => {
  const { category_name, keywords } = req.body;
  if (!category_name) {
    return res.status(400).json({ error: 'category_name required' });
  }
  const result = await db.query(
    `INSERT INTO categories (category_name, keywords, user_id, is_default)
     VALUES ($1, $2, $3, FALSE)
     RETURNING *`,
    [category_name, keywords || '', req.user.id]
  );
  res.status(201).json(result.rows[0]);
});

module.exports = router;
