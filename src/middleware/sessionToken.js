const jwt = require('jsonwebtoken');

// Helper: generar token con id y rol del Usuario
// (middleware/auth.js lo lee como req.user = { id, role })
const generateToken = (usuario) => {
  const payload = {
    id: usuario._id.toString(),
    role: usuario.rol
  };
  const expiresIn = process.env.TOKEN_EXPIRES_IN || '3h';
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

module.exports = { generateToken };
