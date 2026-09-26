// test/setup.js
// Variables de entorno para las pruebas (no se usa el .env real ni Mongo Atlas).
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'clave_de_pruebas';
process.env.TOKEN_EXPIRES_IN = '1h';
