// js/detalle.js
// Controlador de la página oferta-detalle.html: muestra la información
// completa de un anuncio y las acciones disponibles según el rol de la
// persona que tiene sesión iniciada (reclamar, marcar entregado, calificar).

import {
  getAnuncio,
  getEmpresa,
  getOrg,
  getDonaciones,
  crearDonacionDesdeAnuncio,
  calificarDonacion,
  getSession,
  addNotificacion,
} from './data.js';
import { toast } from './toast.js';

export function initDetalle() {
  const params = new URLSearchParams(window.location.search);
  const anuncioId = params.get('id');
  const anuncio = getAnuncio(anuncioId);
  const session = getSession();

  const contenedor = document.getElementById('detalle-contenido');
  if (!contenedor) return;

  if (!anuncio) {
    contenedor.innerHTML = `<div class="empty-state">Este anuncio ya no existe o fue eliminado.</div>`;
    return;
  }

  pintarInfo(anuncio);
  pintarMapa(anuncio);
  pintarAcciones(anuncio, session);
}

function pintarInfo(a) {
  document.getElementById('det-kind').textContent = a.tipo === 'oferta' ? 'Oferta de donación' : 'Solicitud';
  document.getElementById('det-title').textContent = a.titulo;
  document.getElementById('det-badge').textContent = { disponible: 'Disponible', reclamado: 'Reclamado', completado: 'Completado' }[a.estado];
  document.getElementById('det-badge').className = `badge ${a.estado}`;

  document.getElementById('det-list').innerHTML = `
    <li><span>Publicado por</span><span>${a.autorNombre}</span></li>
    <li><span>Uso recomendado</span><span>${a.uso}</span></li>
    <li><span>Cantidad</span><span>${a.cantidad} ${a.unidad}</span></li>
    <li><span>Ubicación</span><span>${a.ubicacion}</span></li>
    <li><span>Tiempo de entrega</span><span>${a.tiempoEntrega}</span></li>
    <li><span>Publicado el</span><span>${new Date(a.createdAt).toLocaleDateString('es-MX', { dateStyle: 'long' })}</span></li>
  `;
}

function pintarMapa(a) {
  const mapa = document.getElementById('det-mapa');
  if (!mapa) return;
  const q = encodeURIComponent(a.ubicacion);
  mapa.innerHTML = `<iframe loading="lazy" src="https://maps.google.com/maps?q=${q}&output=embed" title="Ubicación de ${a.autorNombre}"></iframe>`;
}

function pintarAcciones(anuncio, session) {
  const panel = document.getElementById('det-acciones');
  if (!session) {
    panel.innerHTML = `
      <p class="lede">Inicia sesión para reclamar este anuncio o dar seguimiento a la donación.</p>
      <a class="btn" href="login.html">Iniciar sesión</a>
    `;
    return;
  }

  const esAutor = session.id === anuncio.autorId;
  const puedeReclamar =
    !esAutor &&
    anuncio.estado === 'disponible' &&
    ((anuncio.tipo === 'oferta' && session.tipo === 'organizacion') ||
      (anuncio.tipo === 'solicitud' && session.tipo === 'empresa'));

  if (puedeReclamar) {
    panel.innerHTML = `
      <p class="lede">${anuncio.tipo === 'oferta' ? 'Reclama esta oferta para coordinar la entrega con la empresa donante.' : 'Ofrece cubrir esta solicitud y coordina la entrega con la organización.'}</p>
      <button class="btn" id="btn-reclamar">${anuncio.tipo === 'oferta' ? 'Reclamar oferta' : 'Cubrir solicitud'}</button>
    `;
    document.getElementById('btn-reclamar').addEventListener('click', () => {
      const donacion = crearDonacionDesdeAnuncio(anuncio, session);
      const destinatarioId = anuncio.autorId;
      addNotificacion({
        destinatarioId,
        titulo: anuncio.tipo === 'oferta' ? 'Tu oferta fue reclamada' : 'Tu solicitud fue aceptada',
        mensaje: `${session.nombre} dio seguimiento a "${anuncio.titulo}".`,
      });
      toast('Listo, quedó registrada la donación en curso.');
      pintarInfo(anuncio);
      pintarAcciones(anuncio, session);
      // guarda referencia para mostrar el flujo de entrega/calificación de una vez
      panel.dataset.donId = donacion.id;
      pintarFlujoDonacion(donacion, session);
    });
    return;
  }

  const donacion = getDonaciones().find((d) => d.anuncioId === anuncio.id);
  if (donacion) {
    pintarFlujoDonacion(donacion, session);
    return;
  }

  if (esAutor) {
    panel.innerHTML = `<p class="lede">Este es tu anuncio. Cuando alguien lo reclame, verás aquí el seguimiento de la donación.</p>`;
    return;
  }

  panel.innerHTML = `<p class="lede">Este anuncio ya no está disponible.</p>`;
}

function pintarFlujoDonacion(donacion, session) {
  const panel = document.getElementById('det-acciones');
  const anuncio = getAnuncio(donacion.anuncioId);
  const esEmpresa = session.tipo === 'empresa' && session.id === donacion.empresaId;
  const esOrg = session.tipo === 'organizacion' && session.id === donacion.orgId;

  if (!esEmpresa && !esOrg) {
    panel.innerHTML = `<p class="lede">Seguimiento de esta donación: <strong>${estadoDonLabel(donacion.estado)}</strong>.</p>`;
    return;
  }

  if (donacion.estado === 'en_curso') {
    panel.innerHTML = `
      <p class="lede">Donación en curso entre ${getEmpresa(donacion.empresaId)?.nombre} y ${getOrg(donacion.orgId)?.nombre}.</p>
      ${esOrg ? '<button class="btn" id="btn-entregado">Marcar como recibido</button>' : '<p class="lede">Esperando confirmación de recepción por parte de la organización.</p>'}
    `;
    document.getElementById('btn-entregado')?.addEventListener('click', () => {
      donacion.estado = 'entregado';
      panel.dataset.estado = 'entregado';
      addNotificacion({
        destinatarioId: donacion.empresaId,
        titulo: 'Donación recibida',
        mensaje: `${session.nombre} confirmó la recepción de "${anuncio.titulo}".`,
      });
      toast('Marcado como recibido. Ahora puedes calificar la donación.');
      pintarFlujoDonacion(donacion, session);
    });
    return;
  }

  if (donacion.estado === 'entregado' && esOrg) {
    panel.innerHTML = `
      <p class="lede">Califica cómo llegó la donación para mantener la transparencia con la empresa donante.</p>
      <div class="star-row" id="star-row">
        ${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="star" data-v="${n}">★</button>`).join('')}
      </div>
      <label class="checkbox-row"><input type="checkbox" id="chk-deficiente" /> Reportar como deficiente o incompleta</label>
      <div class="field"><textarea id="comentario-calif" placeholder="Comentario (opcional)"></textarea></div>
      <button class="btn" id="btn-calificar">Enviar calificación</button>
    `;
    let puntuacion = 0;
    const stars = panel.querySelectorAll('.star');
    stars.forEach((s) =>
      s.addEventListener('click', () => {
        puntuacion = Number(s.dataset.v);
        stars.forEach((st) => st.classList.toggle('on', Number(st.dataset.v) <= puntuacion));
      })
    );
    document.getElementById('btn-calificar').addEventListener('click', () => {
      if (!puntuacion) {
        toast('Selecciona una calificación en estrellas.', 'err');
        return;
      }
      const deficiente = document.getElementById('chk-deficiente').checked;
      calificarDonacion(donacion.id, {
        puntuacion,
        comentario: document.getElementById('comentario-calif').value,
        deficiente,
      });
      addNotificacion({
        destinatarioId: donacion.empresaId,
        titulo: deficiente ? 'Donación calificada como deficiente' : 'Nueva calificación recibida',
        mensaje: `"${anuncio.titulo}" fue calificada con ${puntuacion}/5.`,
      });
      toast(deficiente ? 'Calificación enviada. Se notificó a la administración.' : 'Gracias por calificar la donación.');
      pintarFlujoDonacion(donacion, session);
    });
    return;
  }

  if (donacion.estado === 'calificado') {
    const c = donacion.calificacion;
    panel.innerHTML = `
      <p class="lede">Donación completada, calificación: <strong>${c.puntuacion}/5</strong>${c.deficiente ? ' · reportada como deficiente' : ''}.</p>
      ${c.comentario ? `<p class="lede">"${c.comentario}"</p>` : ''}
    `;
    return;
  }

  panel.innerHTML = `<p class="lede">Estado actual: ${estadoDonLabel(donacion.estado)}.</p>`;
}

function estadoDonLabel(estado) {
  return { en_curso: 'en curso', entregado: 'entregada, pendiente de calificar', calificado: 'calificada' }[estado] || estado;
}
