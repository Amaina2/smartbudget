const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
  const fromCookie = req.cookies?.token;
  const fromHeader = req.headers.authorization?.split(' ')[1];
  const token = fromCookie || fromHeader;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, secret);
    req.user = { id: payload.id };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = authMiddleware;
