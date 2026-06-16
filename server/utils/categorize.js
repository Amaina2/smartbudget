const db = require('../db');

async function getCategoryIdByName(name) {
  const r = await db.query(
    'SELECT category_id FROM categories WHERE category_name = $1 AND user_id IS NULL LIMIT 1',
    [name]
  );
  return r.rows[0]?.category_id;
}

/**
 * Keyword match against seeded / user categories; returns category_id.
 */
async function suggestCategory(userId, description) {
  const text = (description || '').toLowerCase();
  const { rows } = await db.query(
    `SELECT category_id, category_name, keywords
     FROM categories
     WHERE user_id IS NULL OR user_id = $1
     ORDER BY category_id`,
    [userId]
  );

  for (const row of rows) {
    const kws = (row.keywords || '')
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);
    if (kws.some((k) => k && text.includes(k))) {
      return row.category_id;
    }
  }

  const misc = rows.find((c) => c.category_name === 'Miscellaneous');
  return misc?.category_id ?? rows[0]?.category_id;
}

module.exports = { suggestCategory, getCategoryIdByName };
