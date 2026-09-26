/* Middleware de autenticación para la página */
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  // Revisa el encabezado de la petición y obtiene el token de la sesión
  // (si no viene el encabezado, se usa '' para no tronar)
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  // Si no hay token (por ejemplo, un usuario anónimo hace una petición)
  // se prohibe la acción y se sale de la función.
  if (!token) return res.status(401).json({ message: 'Sin Token' });

  // Compara el token con la llave JWT_SECRET para autenticar y revisar expiración
  try {
    // Extrae la información del token
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // payload contiene { id, role, iat, exp }

    // Se lee el usuario de la petición y su rol
    req.user = { id: payload.id, role: payload.role };

    // Continua la acción o pasa el controlador de la ruta
    next();

    // Si por alguna razón el token está mal, regresa error
  } catch (err) {
    return res.status(401).json({ message: 'El Token es inválido o ya expiró.' });
  }
};

// Restringe una ruta a ciertos roles. Se usa DESPUÉS de auth:
//   router.post('/', auth, soloRol('administrador'), createUsuario);
const soloRol = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'No tienes permiso para realizar esta acción.' });
  }
  next();
};

module.exports = auth;
module.exports.soloRol = soloRol;
