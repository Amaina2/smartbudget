const router = require('express').Router();
const axios = require('axios');
const db = require('../db');
const auth = require('../middleware/authMiddleware');
const { suggestCategory } = require('../utils/categorize');
const { evaluateBudgetAlerts } = require('../utils/budgetAlerts');

/**
 * STK Push — requires Safaricom Daraja sandbox/production credentials in .env
 */
router.post('/stkpush', auth, async (req, res) => {
  try {
    const { phone, amount } = req.body;
    if (!phone || !amount) {
      return res.status(400).json({ error: 'phone and amount required' });
    }
    const user_id = req.user.id;
    const key = process.env.MPESA_CONSUMER_KEY;
    const secret = process.env.MPESA_CONSUMER_SECRET;
    if (!key || !secret) {
      return res.status(503).json({
        error: 'M-Pesa is not configured. Set MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET.',
      });
    }

    const tokenRes = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      { auth: { username: key, password: secret } }
    );
    const token = tokenRes.data.access_token;

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: process.env.MPESA_PASSWORD,
        Timestamp: process.env.MPESA_TIMESTAMP,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phone,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: `SB-${user_id}`,
        TransactionDesc: 'Budget tracking payment sync',
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    res.json(response.data);
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.status(500).json({ error: 'STK push failed', detail: e.response?.data || e.message });
  }
});

/**
 * Safaricom callback — structure may vary; defensive parsing.
 */
router.post('/callback', async (req, res) => {
  try {
    const body = req.body;
    const stk = body?.Body?.stkCallback || body?.stkCallback;
    if (!stk) {
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Ignored' });
    }

    if (stk.ResultCode !== 0) {
      return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    const items = stk.CallbackMetadata?.Item || [];
    const meta = {};
    items.forEach((i) => {
      if (i.Name) meta[i.Name] = i.Value;
    });
    const amount = meta.Amount;
    const phone = meta.PhoneNumber;

    let userId = null;
    const acct = stk.AccountReference || meta.AccountReference;
    if (acct && String(acct).startsWith('SB-')) {
      userId = parseInt(String(acct).replace('SB-', ''), 10);
    }
    if (!userId && phone) {
      const u = await db.query('SELECT user_id FROM users WHERE phone = $1', [phone]);
      userId = u.rows[0]?.user_id;
    }
    if (!userId) {
      console.warn('M-Pesa callback: could not resolve user; skipping insert');
      return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    const categoryId = await suggestCategory(userId, 'mpesa payment');
    await db.query(
      `INSERT INTO transactions (user_id, amount, description, date, category_id, transaction_type)
       VALUES ($1, $2, $3, CURRENT_DATE, $4, 'expense')`,
      [userId, amount, `M-Pesa payment ${phone || ''}`, categoryId]
    );
    await evaluateBudgetAlerts(userId);
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ResultCode: 1, ResultDesc: 'Error' });
  }
});

module.exports = router;
