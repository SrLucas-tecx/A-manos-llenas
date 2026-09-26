// test/authController.test.js
// Registro e inicio de sesión, con el modelo Usuario simulado (sin base de datos).
jest.mock('../models/Usuario', () => require('./helpers').mockUsuarioModel());

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { registrarCuenta, iniciarSesion } = require('../controllers/authController');
const { mockRes, errorValidacion, errorDuplicado } = require('./helpers');

const datosRegistro = {
  nombre_entidad: 'Centro de Acopio Pelusas',
  nombre_encargado: 'Laura Martínez Ruiz',
  email: 'laura@pelusas.org',
  password: 'Segura#123',
  rol: 'organizacion',
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('POST /api/auth/register  (registrarCuenta)', () => {
  test('crea la cuenta, encripta la contraseña y regresa token', async () => {
    Usuario.findOne.mockResolvedValue(null);
    const res = mockRes();

    await registrarCuenta({ body: datosRegistro }, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const { user, token } = res.json.mock.calls[0][0];
    expect(user).toEqual({
      id: 'id_nuevo',
      nombre_entidad: datosRegistro.nombre_entidad,
      nombre_encargado: datosRegistro.nombre_encargado,
      email: datosRegistro.email,
      rol: 'organizacion',
    });
    expect(user.password).toBeUndefined();
    expect(jwt.verify(token, process.env.JWT_SECRET)).toMatchObject({ id: 'id_nuevo', role: 'organizacion' });

    // El documento se validó ANTES de encriptar y se guardó con la contraseña encriptada
    const doc = Usuario.mock.results[0].value;
    expect(doc.validate).toHaveBeenCalled();
    expect(doc.password).not.toBe(datosRegistro.password);
    expect(await bcrypt.compare(datosRegistro.password, doc.password)).toBe(true);
    expect(doc.save).toHaveBeenCalledWith({ validateBeforeSave: false });
  });

  test('busca el correo en minúsculas y sin espacios', async () => {
    Usuario.findOne.mockResolvedValue(null);
    await registrarCuenta({ body: { ...datosRegistro, email: '  LAURA@Pelusas.org ' } }, mockRes());
    expect(Usuario.findOne).toHaveBeenCalledWith({ email: 'laura@pelusas.org' });
  });

  test('sin correo o contraseña responde 400', async () => {
    const res = mockRes();
    await registrarCuenta({ body: { ...datosRegistro, password: '' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(Usuario).not.toHaveBeenCalled();
  });

  test('sin nombre de entidad o encargado responde 400', async () => {
    const res = mockRes();
    await registrarCuenta({ body: { email: 'a@b.com', password: 'Segura#123' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('NO permite registrarse como administrador', async () => {
    const res = mockRes();
    await registrarCuenta({ body: { ...datosRegistro, rol: 'administrador' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(Usuario).not.toHaveBeenCalled();
  });

  test('correo ya registrado responde 409', async () => {
    Usuario.findOne.mockResolvedValue({ _id: 'otro' });
    const res = mockRes();
    await registrarCuenta({ body: datosRegistro }, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('datos que no pasan el modelo responden 400 con el mensaje', async () => {
    Usuario.findOne.mockResolvedValue(null);
    Usuario.mockImplementationOnce(() => ({
      validate: jest.fn().mockRejectedValue(errorValidacion('Asegurate de incluir un símbolo...')),
    }));
    const res = mockRes();
    await registrarCuenta({ body: datosRegistro }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Asegurate de incluir un símbolo...' });
  });

  test('nombre de entidad repetido (índice único) responde 409', async () => {
    Usuario.findOne.mockResolvedValue(null);
    Usuario.mockImplementationOnce(() => ({
      validate: jest.fn().mockResolvedValue(),
      save: jest.fn().mockRejectedValue(errorDuplicado({ nombre_entidad: 'X' })),
    }));
    const res = mockRes();
    await registrarCuenta({ body: datosRegistro }, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('error inesperado responde 500', async () => {
    Usuario.findOne.mockRejectedValue(new Error('BD caída'));
    const res = mockRes();
    await registrarCuenta({ body: datosRegistro }, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('POST /api/auth/login  (iniciarSesion)', () => {
  let usuarioGuardado;

  beforeAll(async () => {
    usuarioGuardado = {
      _id: 'u1',
      nombre_entidad: 'Pelusas',
      nombre_encargado: 'Laura Martínez Ruiz',
      email: 'laura@pelusas.org',
      rol: 'organizacion',
      activo: true,
      password: await bcrypt.hash('Segura#123', 4),
    };
  });

  // findOne(...).select('+password')
  const encontrar = (usuario) => Usuario.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(usuario) });

  test('credenciales correctas: regresa token y usuario sin contraseña', async () => {
    encontrar(usuarioGuardado);
    const res = mockRes();
    await iniciarSesion({ body: { email: ' LAURA@pelusas.org', password: 'Segura#123' } }, res);

    expect(Usuario.findOne).toHaveBeenCalledWith({ email: 'laura@pelusas.org' });
    const { user, token, message } = res.json.mock.calls[0][0];
    expect(message).toBe('Autenticado');
    expect(user.password).toBeUndefined();
    expect(jwt.verify(token, process.env.JWT_SECRET)).toMatchObject({ id: 'u1', role: 'organizacion' });
  });

  test('contraseña incorrecta responde 401', async () => {
    encontrar(usuarioGuardado);
    const res = mockRes();
    await iniciarSesion({ body: { email: 'laura@pelusas.org', password: 'Mala#1234' } }, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Credenciales inválidas' });
  });

  test('correo inexistente responde 401 con el mismo mensaje', async () => {
    encontrar(null);
    const res = mockRes();
    await iniciarSesion({ body: { email: 'nadie@x.com', password: 'Segura#123' } }, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Credenciales inválidas' });
  });

  test('cuenta dada de baja responde 403', async () => {
    encontrar({ ...usuarioGuardado, activo: false });
    const res = mockRes();
    await iniciarSesion({ body: { email: 'laura@pelusas.org', password: 'Segura#123' } }, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test.each([
    ['sin datos', {}],
    ['correo vacío', { email: '', password: 'x' }],
    ['inyección NoSQL', { email: { $ne: null }, password: { $ne: null } }],
  ])('%s responde 400', async (_caso, body) => {
    const res = mockRes();
    await iniciarSesion({ body }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(Usuario.findOne).not.toHaveBeenCalled();
  });

  test('error inesperado responde 500', async () => {
    Usuario.findOne.mockImplementation(() => {
      throw new Error('BD caída');
    });
    const res = mockRes();
    await iniciarSesion({ body: { email: 'a@b.com', password: 'x' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
