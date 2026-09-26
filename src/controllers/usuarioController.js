/* Controlador de usuarios (CRUD). El registro público va por /api/auth/register */
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');

const ROLES = ['administrador', 'empresa', 'organizacion'];

// Campos que cada quien puede mandar (lo demás del body se ignora)
const CAMPOS_PERFIL = ['nombre_entidad', 'nombre_encargado', 'email', 'contacto', 'direccion'];
const CAMPOS_CREACION = [...CAMPOS_PERFIL, 'password', 'rol'];
const CAMPOS_SOLO_ADMIN = ['rol', 'activo'];

/* ---------- Helpers ---------- */

// req.user lo llena el middleware auth: { id, role }
const esAdmin = (req) => req.user?.role === 'administrador';
const esPropio = (req) => String(req.user?.id) === String(req.params.id);
const idValido = (id) => mongoose.Types.ObjectId.isValid(id);

// Copia solo los campos permitidos del body
const elegirCampos = (body = {}, campos) =>
  campos.reduce((datos, campo) => {
    if (body[campo] !== undefined) datos[campo] = body[campo];
    return datos;
  }, {});

// Convierte errores de Mongoose en respuestas claras
const responderError = (res, err) => {
  if (err.name === 'ValidationError') {
    const errores = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: errores[0], errores });
  }
  if (err.code === 11000) {
    const campo = Object.keys(err.keyValue || {})[0] || 'dato';
    return res.status(409).json({ message: `Ya existe una cuenta con ese ${campo}.` });
  }
  console.error(err);
  return res.status(500).json({ message: 'Error del servidor' });
};

/* ---------- Controladores ---------- */

// GET /api/usuarios — admin, organizaciones, empresas (lista con filtros de rol)
// Filtro opcional: ?rol=empresa | organizacion | administrador
exports.getUsuarios = async (req, res) => {
  try {
    const { rol } = req.query;
    if (rol && !ROLES.includes(rol)) {
      return res.status(400).json({ message: `Rol no válido. Usa: ${ROLES.join(', ')}.` });
    }

    const filtro = {};
    if (esAdmin(req)) {
      if (rol) filtro.rol = rol;
    } else {
      // Empresas y organizaciones solo ven cuentas activas de empresas/organizaciones
      if (rol === 'administrador') return res.status(403).json({ message: 'No tienes permiso para ver administradores.' });
      // mongoose.trusted: server.js activa sanitizeFilter y, sin esto, bloquearía nuestros propios $in / $ne
      filtro.rol = rol || mongoose.trusted({ $in: ['empresa', 'organizacion'] });
      filtro.activo = mongoose.trusted({ $ne: false });
    }

    const usuarios = await Usuario.find(filtro).sort({ nombre_entidad: 1 });
    res.json(usuarios);
  } catch (err) {
    responderError(res, err);
  }
};

// GET /api/usuarios/:id — admin, organizacion, empresa, propio
exports.getUsuarioById = async (req, res) => {
  try {
    if (!idValido(req.params.id)) return res.status(400).json({ message: 'Id no válido.' });

    const usuario = await Usuario.findById(req.params.id);
    // A quien no es admin ni dueño de la cuenta, las cuentas dadas de baja o de admin "no existen"
    const oculto = usuario && !esAdmin(req) && !esPropio(req) && (usuario.activo === false || usuario.rol === 'administrador');
    if (!usuario || oculto) return res.status(404).json({ message: 'Usuario no encontrado.' });

    res.json(usuario);
  } catch (err) {
    responderError(res, err);
  }
};

// POST /api/usuarios — admin; creación manual de cuenta con rol asignado (auto-registro va por /api/auth/register)
exports.createUsuario = async (req, res) => {
  try {
    if (!esAdmin(req)) return res.status(403).json({ message: 'Solo un administrador puede crear cuentas.' });

    const datos = elegirCampos(req.body, CAMPOS_CREACION);
    if (!datos.password) return res.status(400).json({ message: 'Se necesita una contraseña.' });

    // Primero se valida con la contraseña en texto plano (el regex del modelo revisa mayúsculas, números y símbolos)...
    const usuario = new Usuario(datos);
    await usuario.validate();

    // ...y ya validada se encripta y se guarda
    usuario.password = await bcrypt.hash(datos.password, 10);
    await usuario.save({ validateBeforeSave: false });

    const { password, ...usuarioSinPassword } = usuario.toObject();
    res.status(201).json({ message: 'Usuario creado', user: usuarioSinPassword });
  } catch (err) {
    responderError(res, err);
  }
};

// PUT /api/usuarios/:id — propio (datos personales) o admin
// La contraseña NO se cambia aquí (va por su propia ruta).
exports.updateUsuario = async (req, res) => {
  try {
    if (!idValido(req.params.id)) return res.status(400).json({ message: 'Id no válido.' });
    if (!esAdmin(req) && !esPropio(req)) {
      return res.status(403).json({ message: 'Solo puedes editar tu propia cuenta.' });
    }

    const campos = esAdmin(req) ? [...CAMPOS_PERFIL, ...CAMPOS_SOLO_ADMIN] : CAMPOS_PERFIL;
    const cambios = elegirCampos(req.body, campos);

    // Evita que un admin se quite a sí mismo el rol o se dé de baja por accidente
    if (esPropio(req) && (('rol' in cambios && cambios.rol !== 'administrador') || cambios.activo === false)) {
      return res.status(400).json({ message: 'No puedes quitarte el rol de administrador ni darte de baja.' });
    }
    if (Object.keys(cambios).length === 0) {
      return res.status(400).json({ message: 'No hay campos válidos para actualizar.' });
    }

    const usuario = await Usuario.findByIdAndUpdate(req.params.id, cambios, {
      returnDocument: 'after',
      runValidators: true,
    });
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado.' });

    res.json({ message: 'Usuario actualizado', user: usuario });
  } catch (err) {
    responderError(res, err);
  }
};

// DELETE /api/usuarios/:id — soft delete (activo: false); bloqueado para roles asignados sin pasar por admin
exports.deleteUsuario = async (req, res) => {
  try {
    if (!esAdmin(req)) return res.status(403).json({ message: 'Solo un administrador puede dar de baja cuentas.' });
    if (!idValido(req.params.id)) return res.status(400).json({ message: 'Id no válido.' });
    if (esPropio(req)) return res.status(400).json({ message: 'No puedes darte de baja a ti mismo.' });

    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { returnDocument: 'after' }
    );
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado.' });

    res.json({ message: 'Usuario dado de baja', user: usuario });
  } catch (err) {
    responderError(res, err);
  }
};
