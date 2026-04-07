const { verifyAccessToken } = require('../utils/jwt')

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Токен відсутній' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = verifyAccessToken(token)

    req.user = {
      id: decoded.userId,
      role: decoded.role,
    }

    console.log('AUTH USER:', req.user)

    next()
  } catch (err) {
    return res.status(401).json({ error: 'Недійсний токен' })
  }
}

function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Доступ заборонено' })
  }
  next()
}

module.exports = {
  authenticate,
  adminMiddleware,
}
