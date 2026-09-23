// js/panel.js
// Controlador del panel privado (empresas y organizaciones comparten la
// misma pantalla; el contenido se adapta según session.tipo).

import { seedIfEmpty, getDonaciones, getAnuncio, getEmpresa, getOrg } from './data.js';
import { requerirSesion } from './auth.js';
import { renderHeader } from './nav.js';
import { initTablero, initPublicarModal, renderMisAnuncios } from './ofertas.js';

seedIfEmpty();
const session = requerirSesion(['empresa', 'organizacion']);
if (session) {
  renderHeader();
  document.getElementById('who-tipo').textContent = session.tipo === 'empresa' ? 'Empresa donante' : 'Organización social';
  document.getElementById('who-nombre').textContent = session.nombre;
  document.getElementById('pub-label').textContent = session.tipo === 'empresa' ? 'Publicar oferta' : 'Publicar solicitud';

  initTablero({}); // tablero general (sec-tablero)
  renderMisAnuncios('board-mios', session.id); // sec-mis-anuncios
  initPublicarModal();
  initSecciones(session);
  renderHistorial(session);
  window.addEventListener('aml:anuncios-changed', () => renderHistorial(session));
}

function initSecciones(session) {
  const links = document.querySelectorAll('.side-link[data-section]');
  const secciones = document.querySelectorAll('.section-panel');

  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      links.forEach((l) => l.classList.remove('active'));
      link.classList.add('active');
      secciones.forEach((s) => (s.style.display = s.id === `sec-${link.dataset.section}` ? 'block' : 'none'));
    });
  });
}

function renderHistorial(session) {
  const host = document.getElementById('historial-list');
  if (!host) return;
  const donaciones = getDonaciones().filter((d) =>
    session.tipo === 'empresa' ? d.empresaId === session.id : d.orgId === session.id
  );

  if (!donaciones.length) {
    host.innerHTML = `<div class="empty-state">Todavía no tienes donaciones en curso ni completadas.</div>`;
    return;
  }

  host.innerHTML = donaciones
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((d) => {
      const anuncio = getAnuncio(d.anuncioId);
      const contraparte =
        session.tipo === 'empresa' ? getOrg(d.orgId)?.nombre : getEmpresa(d.empresaId)?.nombre;
      return `
        <a class="anuncio-card" href="oferta-detalle.html?id=${d.anuncioId}" style="margin-bottom:12px;">
          <span class="a-kind">${estadoDonLabel(d.estado)}</span>
          <div class="a-title">${anuncio?.titulo || 'Anuncio eliminado'}</div>
          <div class="a-meta">
            <span>Contraparte: ${contraparte || '—'}</span>
            ${d.calificacion ? `<span>Calificación: ${d.calificacion.puntuacion}/5${d.calificacion.deficiente ? ' · reportada como deficiente' : ''}</span>` : ''}
          </div>
        </a>`;
    })
    .join('');
}

function estadoDonLabel(estado) {
  return { en_curso: 'En curso', entregado: 'Entregada, por calificar', calificado: 'Calificada' }[estado] || estado;
}
