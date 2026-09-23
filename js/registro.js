// js/registro.js
// Controlador de la página de registro: pestañas empresa / organización.

import { seedIfEmpty, getSession } from './data.js';
import { registrarEmpresa, registrarOrganizacion } from './auth.js';
import { renderHeader } from './nav.js';

seedIfEmpty();
renderHeader();

if (getSession()) {
  window.location.href = 'panel.html';
}

const tabs = document.querySelectorAll('.tab');
const panelEmpresa = document.getElementById('panel-empresa');
const panelOrg = document.getElementById('panel-org');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    const esEmpresa = tab.dataset.tab === 'empresa';
    panelEmpresa.style.display = esEmpresa ? 'block' : 'none';
    panelOrg.style.display = esEmpresa ? 'none' : 'block';
  });
});

function manejarSubmit(formId, msgId, accion) {
  const form = document.getElementById(formId);
  const msg = document.getElementById(msgId);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    try {
      accion(data);
      window.location.href = 'panel.html';
    } catch (err) {
      msg.textContent = err.message;
      msg.className = 'form-msg show error';
    }
  });
}

manejarSubmit('form-empresa', 'msg-empresa', registrarEmpresa);
manejarSubmit('form-org', 'msg-org', registrarOrganizacion);
