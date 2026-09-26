// test/usuario.model.test.js
// Validaciones del esquema Usuario. validate() revisa las reglas sin conectarse a la BD.
const Usuario = require('../models/Usuario');

const valido = {
  nombre_entidad: 'Panificadora Trigo Dorado',
  nombre_encargado: 'Laura Pérez Gómez',
  email: 'contacto@trigodorado.mx',
  password: 'Segura#123',
  rol: 'empresa',
};

// Regresa los errores de validación ({} si todo está bien)
const errores = async (datos) => {
  try {
    await new Usuario(datos).validate();
    return {};
  } catch (err) {
    return err.errors;
  }
};

describe('Modelo Usuario', () => {
  test('acepta un usuario válido', async () => {
    expect(await errores(valido)).toEqual({});
  });

  test('valores por defecto: rol organizacion y activo true', () => {
    const { rol, ...sinRol } = valido;
    const u = new Usuario(sinRol);
    expect(u.rol).toBe('organizacion');
    expect(u.activo).toBe(true);
  });

  test.each(['nombre_entidad', 'nombre_encargado', 'email', 'password'])('%s es obligatorio', async (campo) => {
    const { [campo]: _, ...incompleto } = valido;
    expect((await errores(incompleto))[campo]).toBeDefined();
  });

  test('guarda el correo en minúsculas y sin espacios', () => {
    expect(new Usuario({ ...valido, email: '  CONTACTO@Trigo.MX ' }).email).toBe('contacto@trigo.mx');
  });

  test('rechaza un correo mal escrito', async () => {
    expect((await errores({ ...valido, email: 'no-es-correo' })).email).toBeDefined();
  });

  test.each([
    ['sin mayúscula', 'segura#123'],
    ['sin minúscula', 'SEGURA#123'],
    ['sin número', 'Segura#abc'],
    ['sin símbolo', 'Segura1234'],
    ['muy corta', 'Se#1'],
  ])('rechaza contraseña %s', async (_caso, password) => {
    expect((await errores({ ...valido, password })).password).toBeDefined();
  });

  test('rechaza un rol que no existe', async () => {
    expect((await errores({ ...valido, rol: 'hacker' })).rol).toBeDefined();
  });

  test('nombre del encargado necesita al menos 10 caracteres', async () => {
    expect((await errores({ ...valido, nombre_encargado: 'Ana' })).nombre_encargado).toBeDefined();
  });

  test('valida teléfono (10 dígitos) y página web (https)', async () => {
    const e = await errores({ ...valido, contacto: { numero_telefonico: '123', pagina_web: 'http://x.com' } });
    expect(e['contacto.numero_telefonico']).toBeDefined();
    expect(e['contacto.pagina_web']).toBeDefined();

    const ok = await errores({ ...valido, contacto: { numero_telefonico: '5512345678', pagina_web: 'https://x.com' } });
    expect(ok).toEqual({});
  });

  test('la contraseña no se incluye en las consultas por defecto (select: false)', () => {
    expect(Usuario.schema.path('password').options.select).toBe(false);
  });
});
