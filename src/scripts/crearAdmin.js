/* Script para crear (o reparar) la cuenta de administrador.
 * Uso (desde la carpeta src):  npm run crear-admin
 *
 * Lee del .env:
 *   ADMIN_EMAIL, ADMIN_PASSWORD           (obligatorios)
 *   ADMIN_NOMBRE_ENTIDAD, ADMIN_ENCARGADO (opcionales)
 *
 * - Si no existe una cuenta con ese correo, la crea con rol "administrador".
 * - Si ya existe, la convierte en administrador, la reactiva y le pone la contraseña del .env.
 * El registro público (/api/auth/register) NUNCA crea administradores; esta es la única forma.
 */
const dotenv = require('dotenv');
dotenv.config({ quiet: true });

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');

const {
  MONGO_URI,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ADMIN_NOMBRE_ENTIDAD = 'Administración A Manos Llenas',
  ADMIN_ENCARGADO = 'Administrador de la plataforma',
} = process.env;

// Muestra el primer error de validación de Mongoose de forma legible
const mensajeValidacion = (err) => Object.values(err.errors)[0].message;

async function crearAdmin() {
  // 1. Revisar variables de entorno
  const faltan = ['MONGO_URI', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'].filter((v) => !process.env[v]);
  if (faltan.length) {
    throw new Error(`Faltan variables en el .env: ${faltan.join(', ')}`);
  }

  // 2. Validar la contraseña en texto plano con las reglas del modelo (antes de encriptarla)
  try {
    await new Usuario({ password: ADMIN_PASSWORD }).validate(['password']);
  } catch (err) {
    throw new Error(`ADMIN_PASSWORD no es válida: ${mensajeValidacion(err)}`, { cause: err });
  }
  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);

  // 3. Conectar a la base de datos
  await mongoose.connect(MONGO_URI);

  const email = ADMIN_EMAIL.toLowerCase().trim();
  const existente = await Usuario.findOne({ email });

  if (existente) {
    // 4a. Ya existe: se convierte en admin, se reactiva y se actualiza la contraseña
    existente.rol = 'administrador';
    existente.activo = true;
    existente.password = hashed;
    await existente.save({ validateModifiedOnly: true });
    console.log(`La cuenta ${email} ya existía: ahora es administrador y su contraseña se actualizó.`);
  } else {
    // 4b. No existe: se valida con todos los campos y se crea
    const admin = new Usuario({
      nombre_entidad: ADMIN_NOMBRE_ENTIDAD,
      nombre_encargado: ADMIN_ENCARGADO,
      email,
      password: ADMIN_PASSWORD,
      rol: 'administrador',
    });
    try {
      await admin.validate();
    } catch (err) {
      throw new Error(`Datos del admin no válidos: ${mensajeValidacion(err)}`, { cause: err });
    }
    admin.password = hashed;
    await admin.save({ validateBeforeSave: false });
    console.log(`Cuenta de administrador creada: ${email}`);
  }
}

crearAdmin()
  .then(() => process.exitCode = 0)
  .catch((err) => {
    if (err.code === 11000) {
      console.error('Ya existe otra cuenta con ese nombre de entidad. Cambia ADMIN_NOMBRE_ENTIDAD en el .env.');
    } else {
      console.error(`No se pudo crear el administrador: ${err.message}`);
    }
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
