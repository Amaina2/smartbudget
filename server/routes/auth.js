const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const secret = () => process.env.JWT_SECRET || 'dev-secret-change-me';

function signToken(userId) {
  return jwt.sign({ id: userId }, secret(), { expiresIn: '7d' });
}

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email, and password required' });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await db.query(
      `INSERT INTO users (username, email, password_hash, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, username, email, phone, created_at`,
      [username, email, hash, phone || null]
    );
    res.status(201).json(user.rows[0]);
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'Email or username already exists' });
    }
    console.error(e);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!user.rows.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const row = user.rows[0];
    const valid = await bcrypt.compare(password, row.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = signToken(row.user_id);
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.COOKIE_DOMAIN || undefined,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    res.json({
      message: 'Logged in successfully',
      token,
      user: {
        user_id: row.user_id,
        username: row.username,
        email: row.email,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ message: 'Logged out' });
});

module.exports = router;
