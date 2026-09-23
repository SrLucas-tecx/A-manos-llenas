// js/login.js
// Controlador de la página de inicio de sesión: selector de rol + validación.

import { seedIfEmpty, getSession } from './data.js';
import { iniciarSesionConCredenciales } from './auth.js';
import { renderHeader } from './nav.js';

seedIfEmpty();
renderHeader();

if (getSession()) {
  window.location.href = 'panel.html';
}

let rolActivo = 'empresa';

document.querySelectorAll('.role-toggle button').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.role-toggle button').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    rolActivo = btn.dataset.rol;
  });
});

const form = document.getElementById('form-login');
const msg = document.getElementById('login-msg');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  try {
    iniciarSesionConCredenciales(fd.get('email'), fd.get('password'), rolActivo);
    window.location.href = rolActivo === 'admin' ? 'admin.html' : 'panel.html';
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'form-msg show error';
  }
});
