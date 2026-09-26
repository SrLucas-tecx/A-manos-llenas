/* Rutas para autenticación de sesión y token */
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');
const { generateToken } = require('../middleware/sessionToken');

// Roles que se pueden elegir al registrarse. "administrador" NUNCA se acepta desde el registro público.
const ROLES_REGISTRO = ['empresa', 'organizacion'];

// Datos públicos del usuario que se regresan al front (sin contraseña)
const datosUsuario = (user) => ({
  id: user._id,
  nombre_entidad: user.nombre_entidad,
  nombre_encargado: user.nombre_encargado,
  email: user.email,
  rol: user.rol,
});

// POST /api/auth/register
exports.registrarCuenta = async (req, res) => {
  // Revisa los datos ingresados en el formulario de registro
  try {
    const { nombre_encargado, email, password, rol, nombre_entidad, contacto, direccion } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Se necesita un correo y contraseña.' });
    if (!nombre_encargado || !nombre_entidad) {
      return res.status(400).json({ message: 'Se necesita el nombre de la entidad y el nombre del encargado.' });
    }
    if (rol !== undefined && !ROLES_REGISTRO.includes(rol)) {
      return res.status(400).json({ message: 'El rol debe ser "empresa" u "organizacion".' });
    }

    // Revisa que no exista una cuenta con el mismo correo
    const existing = await Usuario.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) return res.status(409).json({ message: 'Ya hay una cuenta con este correo.' });

    // Valida todos los campos con el modelo ANTES de encriptar
    // (así el regex de la contraseña revisa la contraseña real, no el hash)
    const user = new Usuario({ nombre_encargado, nombre_entidad, email, password, rol, contacto, direccion });
    await user.validate();

    // Encriptación de contraseña
    const salt = await bcrypt.genSalt(10); //caracteres random
    user.password = await bcrypt.hash(password, salt);

    // Guarda la cuenta y genera un token
    await user.save({ validateBeforeSave: false });
    const token = generateToken(user);

    res.status(201).json({
      message: 'Usuario creado',
      user: datosUsuario(user),
      token,
    });

    // Si algo falla, regresa error
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(err.errors)[0].message });
    }
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Ya hay una cuenta con ese nombre de entidad o correo.' });
    }
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// POST /api/auth/login
exports.iniciarSesion = async (req, res) => {
  // Revisa los datos ingresados en el formulario de login
  try {
    const { email, password } = req.body;
    // typeof evita que manden objetos como { "$ne": null } (inyección NoSQL)
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return res.status(400).json({ message: 'Se necesita correo y contraseña' });
    }

    // Si el usuario se equivoca en la contraseña o la cuenta no existe
    // (mismo mensaje en ambos casos para no revelar qué correos están registrados)
    const user = await Usuario.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Credenciales inválidas' });

    // Cuenta dada de baja por un administrador
    if (user.activo === false) {
      return res.status(403).json({ message: 'Esta cuenta fue dada de baja. Contacta a la administración.' });
    }

    // Crea un token
    const token = generateToken(user);
    res.json({
      message: 'Autenticado',
      user: datosUsuario(user),
      token,
    });

    // Si algo falla, regresa error
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};
