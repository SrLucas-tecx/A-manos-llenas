const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { soloRol } = require('../middleware/auth');

const {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  // Pendientes (aún no existen en el controlador; descomentar cuando se programen):
  // getPerfilPublico, // devuelve solo campos públicos; ver sección 11.4 del CLAUDE.md
  // cambiarPassword,
  // verificarCorreo,
  // desuscribir
} = require('../controllers/usuarioController');

// Rutas estáticas antes que /:id para evitar conflictos de matching

// GET /api/usuarios — admin, organizaciones, empresas (lista con filtros de rol)
router.get('/', auth, getUsuarios);

// GET /api/usuarios/:id — admin, organizacion, empresa, propio
router.get('/:id', auth, getUsuarioById);

// POST /api/usuarios — admin; creación manual de cuenta con rol asignado (auto-registro va por /api/auth/register)
router.post('/', auth, soloRol('administrador'), createUsuario);

// PUT /api/usuarios/:id — propio (datos personales) o admin
router.put('/:id', auth, updateUsuario);

// DELETE /api/usuarios/:id — soft delete (activo: false); bloqueado para roles asignados sin pasar por admin
router.delete('/:id', auth, soloRol('administrador'), deleteUsuario);

module.exports = router;
