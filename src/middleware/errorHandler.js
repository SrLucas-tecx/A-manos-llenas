/* Manejo de errores que no atrapó ningún controlador (último middleware en server.js) */

// Express reconoce un manejador de errores porque recibe 4 parámetros
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // JSON mal escrito en el body de la petición
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'El JSON enviado no es válido.' });
  }

  console.error(err);
  // Nunca se manda el detalle del error al cliente
  res.status(err.status || 500).json({ message: 'Error del servidor' });
};

module.exports = errorHandler;
