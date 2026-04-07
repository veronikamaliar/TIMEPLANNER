const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Токен відсутній' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => { // ← user → decoded
    if (err) {
      return res.status(403).json({ error: 'Недійсний або прострочений токен' });
    }

    req.user = { id: decoded.userId, role: decoded.role }; // ← decoded вже доступний

    next();
  });
};

module.exports = { authenticateToken };