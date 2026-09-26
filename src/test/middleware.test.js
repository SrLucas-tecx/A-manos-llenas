// test/middleware.test.js
// auth (verifica el JWT), sessionToken (lo genera) y errorHandler.
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const { generateToken } = require('../middleware/sessionToken');
const errorHandler = require('../middleware/errorHandler');
const { mockRes } = require('./helpers');

const reqCon = (authorization) => ({ headers: authorization === undefined ? {} : { authorization } });

describe('sessionToken.generateToken', () => {
  test('genera un JWT con id y role del usuario', () => {
    const token = generateToken({ _id: 'abc123', rol: 'empresa' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    expect(payload).toMatchObject({ id: 'abc123', role: 'empresa' });
    expect(payload.exp - payload.iat).toBe(3600); // TOKEN_EXPIRES_IN = 1h en test/setup.js
  });

  test('si no hay TOKEN_EXPIRES_IN, dura 3 horas', () => {
    const anterior = process.env.TOKEN_EXPIRES_IN;
    delete process.env.TOKEN_EXPIRES_IN;
    const payload = jwt.decode(generateToken({ _id: 'abc', rol: 'empresa' }));
    process.env.TOKEN_EXPIRES_IN = anterior;
    expect(payload.exp - payload.iat).toBe(3 * 3600);
  });
});

describe('middleware auth', () => {
  test('sin encabezado Authorization responde 401', () => {
    const res = mockRes();
    const next = jest.fn();
    auth(reqCon(undefined), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('encabezado sin "Bearer " responde 401', () => {
    const res = mockRes();
    auth(reqCon('Token abc'), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Sin Token' });
  });

  test('token inválido responde 401', () => {
    const res = mockRes();
    auth(reqCon('Bearer no.es.valido'), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'El Token es inválido o ya expiró.' });
  });

  test('token firmado con otra clave responde 401', () => {
    const falso = jwt.sign({ id: '1', role: 'administrador' }, 'otra-clave');
    const res = mockRes();
    auth(reqCon(`Bearer ${falso}`), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('token expirado responde 401', () => {
    const expirado = jwt.sign({ id: '1', role: 'empresa' }, process.env.JWT_SECRET, { expiresIn: -10 });
    const res = mockRes();
    auth(reqCon(`Bearer ${expirado}`), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('token válido: llena req.user y continúa', () => {
    const req = reqCon(`Bearer ${generateToken({ _id: 'u1', rol: 'administrador' })}`);
    const next = jest.fn();
    auth(req, mockRes(), next);
    expect(req.user).toEqual({ id: 'u1', role: 'administrador' });
    expect(next).toHaveBeenCalled();
  });
});

describe('errorHandler', () => {
  beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  test('JSON mal formado responde 400', () => {
    const res = mockRes();
    errorHandler({ type: 'entity.parse.failed' }, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('error con status propio lo respeta, sin revelar detalles', () => {
    const res = mockRes();
    errorHandler({ status: 404, message: 'ruta secreta' }, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Error del servidor' });
  });

  test('error desconocido responde 500', () => {
    const res = mockRes();
    errorHandler(new Error('detalle interno'), {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
