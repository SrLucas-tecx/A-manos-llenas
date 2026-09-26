// src/services/auth.js
// Registro, inicio y cierre de sesión con el backend (/api/auth/register y /api/auth/login).

import api, { TOKEN_KEY, mensajeDeError } from './api.js';

const SESSION_KEY = 'aml_session';

// Convierte el usuario del backend a la "sesión" que usan las páginas:
//   session.id, session.nombre, session.email, session.rol
//   session.tipo -> 'empresa' | 'organizacion' | 'admin'  (así lo revisan Panel, Header, RequireAuth...)
function aSesion(user) {
  return {
    id: user.id,
    nombre: user.nombre_entidad,
    encargado: user.nombre_encargado,
    email: user.email,
    rol: user.rol,
    tipo: user.rol === 'administrador' ? 'admin' : user.rol,
  };
}

// Guarda token + sesión y regresa la sesión
function guardarSesion(data) {
  const session = aSesion(data.user);
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function iniciarSesion(email, password) {
  try {
    const { data } = await api.post('/auth/login', { email, password });
    return guardarSesion(data);
  } catch (err) {
    throw new Error(mensajeDeError(err));
  }
}

// datos: { nombre_entidad, nombre_encargado, email, password, rol, direccion, contacto }
export async function registrarCuenta(datos) {
  try {
    const { data } = await api.post('/auth/register', datos);
    return guardarSesion(data);
  } catch (err) {
    throw new Error(mensajeDeError(err));
  }
}

export function getSession() {
  try {
    const guardada = localStorage.getItem(SESSION_KEY);
    return guardada && localStorage.getItem(TOKEN_KEY) ? JSON.parse(guardada) : null;
  } catch {
    return null;
  }
}

export function cerrarSesion() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
}
