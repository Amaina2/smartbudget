const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ? [process.env.CLIENT_ORIGIN] : true,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts. Please try again later.' },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded. Slow down and try again.' },
});

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'smartbudget-api' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/budgets', require('./routes/budgets'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/risk', require('./routes/risk'));
app.use('/api/mpesa', require('./routes/mpesa'));
app.use('/api/recurring', require('./routes/recurring'));

const db = require('./db');

const port = process.env.PORT || 5000;

db.query('SELECT NOW()')
  .then((r) => console.log('DB connected:', r.rows[0].now))
  .catch((err) => console.error('DB connection error:', err.message));

app.listen(port, () => console.log(`API running on port ${port}`));
