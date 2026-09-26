const express = require('express');
const router = express.Router();

const {
  registrarCuenta,
  iniciarSesion,
} = require('../controllers/authController');

// POST /api/auth/register — sin auth; crea cuenta y envía correo de verificación
router.post('/register', registrarCuenta);

// POST /api/auth/login — sin auth; devuelve JWT con expiración de 3 horas
router.post('/login', iniciarSesion);

module.exports = router;