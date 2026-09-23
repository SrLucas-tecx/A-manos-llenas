// js/nav.js
// Dibuja el encabezado del sitio (varía según si hay sesión activa) y
// el panel de notificaciones (campana) compartido entre paneles.

import { getSession } from './data.js';
import { cerrarSesion } from './auth.js';
import { getNotificaciones, marcarNotificacionesLeidas } from './data.js';

export function renderHeader(target = '#site-header') {
  const host = document.querySelector(target);
  if (!host) return;
  const session = getSession();

  const publicNav = `
    <a href="index.html#como-funciona">Cómo funciona</a>
    <a href="index.html#impacto">Impacto</a>
  `;

  const panelHref = session?.tipo === 'admin' ? 'admin.html' : 'panel.html';
  const rightSide = session
    ? `
      <div class="bell-wrap" id="bell-wrap"></div>
      <a class="btn secondary small" href="${panelHref}">Mi panel</a>
      <button class="btn small" id="logout-btn" type="button">Salir</button>
    `
    : `
      <a class="btn secondary small" href="login.html">Iniciar sesión</a>
      <a class="btn small" href="registro.html">Registrarme</a>
    `;

  host.innerHTML = `
    <div class="wrap">
      <a class="brand" href="index.html"><span class="brand-mark"></span>A Manos Llenas</a>
      <nav class="main-nav">${session ? '' : publicNav}</nav>
      <div class="nav-right">${rightSide}</div>
    </div>
  `;

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', cerrarSesion);

  if (session) renderBell(session.id);
}

function renderBell(destinatarioId) {
  const wrap = document.getElementById('bell-wrap');
  if (!wrap) return;

  function draw() {
    const notifs = getNotificaciones(destinatarioId);
    const sinLeer = notifs.filter((n) => !n.leida).length;
    wrap.innerHTML = `
      <button class="bell-btn" id="bell-btn" type="button" aria-label="Notificaciones">
        🔔${sinLeer ? `<span class="bell-dot">${sinLeer}</span>` : ''}
      </button>
      <div class="bell-panel" id="bell-panel">
        ${
          notifs.length
            ? notifs
                .map(
                  (n) => `
              <div class="notif-item ${n.leida ? '' : 'unread'}">
                <b>${n.titulo}</b>
                ${n.mensaje}
                <span class="notif-time">${new Date(n.createdAt).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>`
                )
                .join('')
            : '<div class="notif-empty">No tienes notificaciones todavía.</div>'
        }
      </div>
    `;
    document.getElementById('bell-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const panel = document.getElementById('bell-panel');
      panel.classList.toggle('open');
      if (panel.classList.contains('open')) {
        marcarNotificacionesLeidas(destinatarioId);
        setTimeout(draw, 300); // refresca el contador tras leer
      }
    });
  }

  draw();
  document.addEventListener('click', () => {
    const panel = document.getElementById('bell-panel');
    if (panel) panel.classList.remove('open');
  });
}
