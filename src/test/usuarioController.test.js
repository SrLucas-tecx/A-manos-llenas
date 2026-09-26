// test/usuarioController.test.js
// CRUD de usuarios y reglas de roles, con el modelo Usuario simulado (sin base de datos).
jest.mock('../models/Usuario', () => require('./helpers').mockUsuarioModel());

const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');
const {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
} = require('../controllers/usuarioController');
const { mockRes, errorValidacion, errorDuplicado } = require('./helpers');

// Ids con formato válido de MongoDB
const ID_ADMIN = '64b7f0c2a1b2c3d4e5f60001';
const ID_EMPRESA = '64b7f0c2a1b2c3d4e5f60002';
const ID_OTRO = '64b7f0c2a1b2c3d4e5f60003';

const admin = { id: ID_ADMIN, role: 'administrador' };
const empresa = { id: ID_EMPRESA, role: 'empresa' };

// Arma un "req" de Express con el usuario del token (lo que pone el middleware auth)
const req = (user, { params = {}, query = {}, body = {} } = {}) => ({ user, params, query, body });

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('getUsuarios', () => {
  // Usuario.find(filtro).sort(...)
  const lista = [{ nombre_entidad: 'A' }, { nombre_entidad: 'B' }];
  let sort;
  beforeEach(() => {
    sort = jest.fn().mockResolvedValue(lista);
    Usuario.find.mockReturnValue({ sort });
  });
  const filtroUsado = () => Usuario.find.mock.calls[0][0];

  test('el admin ve a todos, ordenados por nombre', async () => {
    const res = mockRes();
    await getUsuarios(req(admin), res);
    expect(filtroUsado()).toEqual({});
    expect(sort).toHaveBeenCalledWith({ nombre_entidad: 1 });
    expect(res.json).toHaveBeenCalledWith(lista);
  });

  test('el admin puede filtrar por rol (incluso administradores)', async () => {
    await getUsuarios(req(admin, { query: { rol: 'administrador' } }), mockRes());
    expect(filtroUsado()).toEqual({ rol: 'administrador' });
  });

  test('una empresa solo ve empresas y organizaciones activas', async () => {
    await getUsuarios(req(empresa), mockRes());
    const filtro = filtroUsado();
    expect(filtro.rol.$in).toEqual(['empresa', 'organizacion']);
    expect(filtro.activo.$ne).toBe(false);
  });

  test('una empresa puede filtrar por organizacion', async () => {
    await getUsuarios(req(empresa, { query: { rol: 'organizacion' } }), mockRes());
    expect(filtroUsado().rol).toBe('organizacion');
  });

  test('una empresa NO puede pedir administradores (403)', async () => {
    const res = mockRes();
    await getUsuarios(req(empresa, { query: { rol: 'administrador' } }), res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(Usuario.find).not.toHaveBeenCalled();
  });

  test('rol inválido responde 400', async () => {
    const res = mockRes();
    await getUsuarios(req(admin, { query: { rol: 'hacker' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('error de la BD responde 500', async () => {
    sort.mockRejectedValue(new Error('BD caída'));
    const res = mockRes();
    await getUsuarios(req(admin), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('getUsuarioById', () => {

  test('id con formato inválido responde 400', async () => {
    const res = mockRes();
    await getUsuarioById(req(admin, { params: { id: 'abc' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('usuario inexistente responde 404', async () => {
    Usuario.findById.mockResolvedValue(null);
    const res = mockRes();
    await getUsuarioById(req(admin, { params: { id: ID_OTRO } }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('una empresa puede ver a otra cuenta activa', async () => {
    const otro = { rol: 'organizacion', activo: true };
    Usuario.findById.mockResolvedValue(otro);
    const res = mockRes();
    await getUsuarioById(req(empresa, { params: { id: ID_OTRO } }), res);
    expect(res.json).toHaveBeenCalledWith(otro);
  });

  test.each([
    ['una cuenta dada de baja', { rol: 'empresa', activo: false }],
    ['una cuenta de administrador', { rol: 'administrador', activo: true }],
  ])('para una empresa, %s "no existe" (404)', async (_caso, cuenta) => {
    Usuario.findById.mockResolvedValue(cuenta);
    const res = mockRes();
    await getUsuarioById(req(empresa, { params: { id: ID_OTRO } }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('el admin sí ve cuentas dadas de baja', async () => {
    const cuenta = { rol: 'empresa', activo: false };
    Usuario.findById.mockResolvedValue(cuenta);
    const res = mockRes();
    await getUsuarioById(req(admin, { params: { id: ID_OTRO } }), res);
    expect(res.json).toHaveBeenCalledWith(cuenta);
  });

  test('cada quien puede ver su propia cuenta aunque esté dada de baja', async () => {
    const propia = { rol: 'empresa', activo: false };
    Usuario.findById.mockResolvedValue(propia);
    const res = mockRes();
    await getUsuarioById(req(empresa, { params: { id: ID_EMPRESA } }), res);
    expect(res.json).toHaveBeenCalledWith(propia);
  });

  test('error de la BD responde 500', async () => {
    Usuario.findById.mockRejectedValue(new Error('BD caída'));
    const res = mockRes();
    await getUsuarioById(req(admin, { params: { id: ID_OTRO } }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('createUsuario', () => {
  const nuevo = {
    nombre_entidad: 'Comedor Esperanza',
    nombre_encargado: 'Mario López Díaz',
    email: 'contacto@esperanza.org',
    password: 'Segura#123',
    rol: 'administrador',
    campo_raro: 'se ignora',
  };

  test('solo un administrador puede crear cuentas (403)', async () => {
    const res = mockRes();
    await createUsuario(req(empresa, { body: nuevo }), res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(Usuario).not.toHaveBeenCalled();
  });

  test('sin contraseña responde 400', async () => {
    const res = mockRes();
    await createUsuario(req(admin, { body: { ...nuevo, password: undefined } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('el admin crea la cuenta con el rol asignado y la contraseña encriptada', async () => {
    const res = mockRes();
    await createUsuario(req(admin, { body: nuevo }), res);

    // Solo se usan los campos permitidos
    expect(Usuario.mock.calls[0][0]).not.toHaveProperty('campo_raro');

    const doc = Usuario.mock.results[0].value;
    expect(doc.validate).toHaveBeenCalled();
    expect(await bcrypt.compare(nuevo.password, doc.password)).toBe(true);
    expect(doc.save).toHaveBeenCalledWith({ validateBeforeSave: false });

    expect(res.status).toHaveBeenCalledWith(201);
    const { user } = res.json.mock.calls[0][0];
    expect(user.rol).toBe('administrador');
    expect(user.password).toBeUndefined();
  });

  test('datos inválidos responden 400 con la lista de errores', async () => {
    Usuario.mockImplementationOnce(() => ({ validate: jest.fn().mockRejectedValue(errorValidacion('Correo inválido')) }));
    const res = mockRes();
    await createUsuario(req(admin, { body: nuevo }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Correo inválido', errores: ['Correo inválido'] });
  });

  test.each([
    [{ email: 'x@y.com' }, 'Ya existe una cuenta con ese email.'],
    [undefined, 'Ya existe una cuenta con ese dato.'],
  ])('dato repetido responde 409', async (keyValue, mensaje) => {
    Usuario.mockImplementationOnce(() => ({
      validate: jest.fn().mockResolvedValue(),
      save: jest.fn().mockRejectedValue(errorDuplicado(keyValue)),
    }));
    const res = mockRes();
    await createUsuario(req(admin, { body: nuevo }), res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: mensaje });
  });

  test('error inesperado responde 500', async () => {
    Usuario.mockImplementationOnce(() => ({ validate: jest.fn().mockRejectedValue(new Error('BD caída')) }));
    const res = mockRes();
    await createUsuario(req(admin, { body: nuevo }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('updateUsuario', () => {
  const actualizado = { nombre_entidad: 'Nuevo nombre' };
  beforeEach(() => Usuario.findByIdAndUpdate.mockResolvedValue(actualizado));
  const cambiosEnviados = () => Usuario.findByIdAndUpdate.mock.calls[0][1];

  test('id inválido responde 400', async () => {
    const res = mockRes();
    await updateUsuario(req(admin, { params: { id: 'abc' }, body: { direccion: 'x' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('una empresa no puede editar otra cuenta (403)', async () => {
    const res = mockRes();
    await updateUsuario(req(empresa, { params: { id: ID_OTRO }, body: { direccion: 'x' } }), res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(Usuario.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test('una empresa edita sus datos, pero NO su rol, activo ni contraseña', async () => {
    const res = mockRes();
    const body = { nombre_entidad: 'Nuevo nombre', direccion: 'Calle 123, Toluca', rol: 'administrador', activo: false, password: 'Otra#1234' };
    await updateUsuario(req(empresa, { params: { id: ID_EMPRESA }, body }), res);

    expect(cambiosEnviados()).toEqual({ nombre_entidad: 'Nuevo nombre', direccion: 'Calle 123, Toluca' });
    expect(Usuario.findByIdAndUpdate.mock.calls[0][2]).toEqual({ returnDocument: 'after', runValidators: true });
    expect(res.json).toHaveBeenCalledWith({ message: 'Usuario actualizado', user: actualizado });
  });

  test('sin campos válidos responde 400', async () => {
    const res = mockRes();
    await updateUsuario(req(empresa, { params: { id: ID_EMPRESA }, body: { rol: 'administrador' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('el admin puede cambiar el rol y el estado de otra cuenta', async () => {
    await updateUsuario(req(admin, { params: { id: ID_OTRO }, body: { rol: 'empresa', activo: false } }), mockRes());
    expect(cambiosEnviados()).toEqual({ rol: 'empresa', activo: false });
  });

  test.each([
    ['quitarse el rol', { rol: 'empresa' }],
    ['darse de baja', { activo: false }],
  ])('el admin no puede %s a sí mismo (400)', async (_caso, body) => {
    const res = mockRes();
    await updateUsuario(req(admin, { params: { id: ID_ADMIN }, body }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('el admin sí puede editar sus propios datos', async () => {
    const res = mockRes();
    await updateUsuario(req(admin, { params: { id: ID_ADMIN }, body: { rol: 'administrador', direccion: 'Oficina central' } }), res);
    expect(res.json).toHaveBeenCalled();
  });

  test('cuenta inexistente responde 404', async () => {
    Usuario.findByIdAndUpdate.mockResolvedValue(null);
    const res = mockRes();
    await updateUsuario(req(admin, { params: { id: ID_OTRO }, body: { direccion: 'Calle 123' } }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('datos inválidos responden 400', async () => {
    Usuario.findByIdAndUpdate.mockRejectedValue(errorValidacion('Teléfono inválido'));
    const res = mockRes();
    await updateUsuario(req(empresa, { params: { id: ID_EMPRESA }, body: { contacto: { numero_telefonico: '1' } } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('deleteUsuario (soft delete)', () => {
  test('solo el admin puede dar de baja (403)', async () => {
    const res = mockRes();
    await deleteUsuario(req(empresa, { params: { id: ID_EMPRESA } }), res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('id inválido responde 400', async () => {
    const res = mockRes();
    await deleteUsuario(req(admin, { params: { id: 'abc' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('el admin no puede darse de baja a sí mismo (400)', async () => {
    const res = mockRes();
    await deleteUsuario(req(admin, { params: { id: ID_ADMIN } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('marca la cuenta como inactiva en lugar de borrarla', async () => {
    const baja = { activo: false };
    Usuario.findByIdAndUpdate.mockResolvedValue(baja);
    const res = mockRes();
    await deleteUsuario(req(admin, { params: { id: ID_OTRO } }), res);
    expect(Usuario.findByIdAndUpdate).toHaveBeenCalledWith(ID_OTRO, { activo: false }, { returnDocument: 'after' });
    expect(res.json).toHaveBeenCalledWith({ message: 'Usuario dado de baja', user: baja });
  });

  test('cuenta inexistente responde 404', async () => {
    Usuario.findByIdAndUpdate.mockResolvedValue(null);
    const res = mockRes();
    await deleteUsuario(req(admin, { params: { id: ID_OTRO } }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('error de la BD responde 500', async () => {
    Usuario.findByIdAndUpdate.mockRejectedValue(new Error('BD caída'));
    const res = mockRes();
    await deleteUsuario(req(admin, { params: { id: ID_OTRO } }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
