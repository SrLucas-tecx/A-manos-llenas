// js/auth.js
// Registro, inicio de sesión y control de acceso por rol.
// No hay backend: valida contra los "registros" guardados en localStorage.

import { addEmpresa, addOrg, findCuentaPorEmail, getSession, setSession, clearSession } from './data.js';

export function registrarEmpresa(data) {
  if (findCuentaPorEmail(data.email, 'empresa')) {
    throw new Error('Ya existe una empresa registrada con ese correo.');
  }
  const empresa = addEmpresa(data);
  iniciarSesion(empresa, 'empresa');
  return empresa;
}

export function registrarOrganizacion(data) {
  if (findCuentaPorEmail(data.email, 'organizacion')) {
    throw new Error('Ya existe una organización registrada con ese correo.');
  }
  const org = addOrg(data);
  iniciarSesion(org, 'organizacion');
  return org;
}

export function iniciarSesionConCredenciales(email, password, tipo) {
  const cuenta = findCuentaPorEmail(email, tipo);
  if (!cuenta) throw new Error('No encontramos una cuenta con ese correo para este tipo de usuario.');
  if (cuenta.password !== password) throw new Error('La contraseña no es correcta.');
  if (tipo === 'empresa' && cuenta.activa === false) {
    throw new Error('Esta empresa fue dada de baja por incumplimientos repetidos.');
  }
  iniciarSesion(cuenta, tipo);
  return cuenta;
}

function iniciarSesion(cuenta, tipo) {
  setSession({ id: cuenta.id, tipo, nombre: cuenta.nombre, email: cuenta.email });
}

export function cerrarSesion() {
  clearSession();
  window.location.href = 'index.html';
}

/** Redirige a login.html si no hay sesión activa; si roles se especifica, valida el tipo de cuenta. */
export function requerirSesion(roles) {
  const session = getSession();
  if (!session || (roles && !roles.includes(session.tipo))) {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}
