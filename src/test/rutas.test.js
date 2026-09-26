// test/rutas.test.js
// Revisa que server.js conecte bien las rutas con auth y los controladores.
// Usa supertest para hacer peticiones HTTP a la app sin levantar el puerto ni conectarse a Atlas.
jest.mock('../models/Usuario', () => require('./helpers').mockUsuarioModel());

const request = require('supertest');
const Usuario = require('../models/Usuario');
const { generateToken } = require('../middleware/sessionToken');
const app = require('../server');

const tokenAdmin = generateToken({ _id: '64b7f0c2a1b2c3d4e5f60001', rol: 'administrador' });
const tokenEmpresa = generateToken({ _id: '64b7f0c2a1b2c3d4e5f60002', rol: 'empresa' });
const ID_OTRO = '64b7f0c2a1b2c3d4e5f60003';

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('Rutas de /api/usuarios (todas piden token)', () => {
  test.each([
    ['get', '/api/usuarios'],
    ['get', `/api/usuarios/${ID_OTRO}`],
    ['post', '/api/usuarios'],
    ['put', `/api/usuarios/${ID_OTRO}`],
    ['delete', `/api/usuarios/${ID_OTRO}`],
  ])('%s %s sin token responde 401', async (metodo, url) => {
    const res = await request(app)[metodo](url);
    expect(res.status).toBe(401);
  });

  test('GET /api/usuarios con token llega al controlador', async () => {
    Usuario.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([{ nombre_entidad: 'A' }]) });
    const res = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ nombre_entidad: 'A' }]);
  });

  test('GET /api/usuarios/:id con token llega al controlador', async () => {
    Usuario.findById.mockResolvedValue(null);
    const res = await request(app).get(`/api/usuarios/${ID_OTRO}`).set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(404);
  });

  test('POST y DELETE: una empresa recibe 403 (el controlador revisa el rol)', async () => {
    const post = await request(app).post('/api/usuarios').set('Authorization', `Bearer ${tokenEmpresa}`).send({});
    const del = await request(app).delete(`/api/usuarios/${ID_OTRO}`).set('Authorization', `Bearer ${tokenEmpresa}`);
    expect(post.status).toBe(403);
    expect(del.status).toBe(403);
  });

  test('PUT de la propia cuenta llega al controlador', async () => {
    Usuario.findByIdAndUpdate.mockResolvedValue({ direccion: 'Calle 123, Toluca' });
    const res = await request(app)
      .put('/api/usuarios/64b7f0c2a1b2c3d4e5f60002')
      .set('Authorization', `Bearer ${tokenEmpresa}`)
      .send({ direccion: 'Calle 123, Toluca' });
    expect(res.status).toBe(200);
  });
});

describe('Rutas de /api/auth', () => {
  test('POST /api/auth/register llega al controlador', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
  });

  test('POST /api/auth/login llega al controlador', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  test('JSON mal escrito responde 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('El JSON enviado no es válido.');
  });
});

test('ruta /api que no existe responde 404', async () => {
  const res = await request(app).get('/api/no-existe');
  expect(res.status).toBe(404);
  expect(res.body).toEqual({ message: 'Ruta no encontrada' });
});

describe('server.js fuera de pruebas', () => {
  test('en producción conecta la BD, levanta el puerto y sirve el front', async () => {
    const anterior = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    jest.spyOn(console, 'log').mockImplementation(() => {});

    let appProd, connectDB, listen, sendFile;
    jest.isolateModules(() => {
      // express "aislado": es la misma copia que usará server.js dentro de este bloque
      const expressAislado = require('express');
      // No levanta un puerto real: solo ejecuta el callback del listen
      listen = jest.spyOn(expressAislado.application, 'listen').mockImplementation((_puerto, cb) => cb());
      // client/dist no existe en las pruebas: en lugar de mandar el archivo, se responde con su ruta
      sendFile = jest.spyOn(expressAislado.response, 'sendFile').mockImplementation(function (ruta) {
        this.send(ruta);
      });
      jest.doMock('../config/database', () => ({ connectDB: jest.fn() }));
      connectDB = require('../config/database').connectDB;
      appProd = require('../server');
    });
    process.env.NODE_ENV = anterior;

    expect(connectDB).toHaveBeenCalled();
    expect(listen).toHaveBeenCalled();

    // Cualquier ruta que no sea /api manda client/dist/index.html (React Router decide la página)
    const res = await request(appProd).get('/login');
    expect(sendFile).toHaveBeenCalled();
    expect(res.text).toMatch(/client[\\/]dist[\\/]index\.html$/);

    jest.restoreAllMocks();
  });
});
