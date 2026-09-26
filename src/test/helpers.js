// test/helpers.js
// Utilidades compartidas: respuesta falsa de Express y un modelo Usuario simulado (mock).

// Simula el objeto "res" de Express: guarda el status y el json que se mandan
function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// Crea un modelo Usuario falso. Se usa así en cada archivo de prueba:
//   jest.mock('../models/Usuario', () => require('./helpers').mockUsuarioModel());
function mockUsuarioModel() {
  // "new Usuario(datos)" regresa un documento falso con validate/save/toObject
  const Usuario = jest.fn().mockImplementation((datos) => {
    const doc = {
      _id: 'id_nuevo',
      rol: 'organizacion',
      ...datos,
      validate: jest.fn().mockResolvedValue(),
      save: jest.fn().mockResolvedValue(),
    };
    doc.toObject = () => {
      const { validate, save, toObject, ...plano } = doc;
      return plano;
    };
    return doc;
  });
  Usuario.find = jest.fn();
  Usuario.findOne = jest.fn();
  Usuario.findById = jest.fn();
  Usuario.findByIdAndUpdate = jest.fn();
  return Usuario;
}

// Error de validación como los que lanza Mongoose
function errorValidacion(mensaje) {
  const err = new Error('ValidationError');
  err.name = 'ValidationError';
  err.errors = { campo: { message: mensaje } };
  return err;
}

// Error de índice único (correo o nombre repetido)
function errorDuplicado(keyValue) {
  const err = new Error('E11000 duplicate key');
  err.code = 11000;
  err.keyValue = keyValue;
  return err;
}

module.exports = { mockRes, mockUsuarioModel, errorValidacion, errorDuplicado };
