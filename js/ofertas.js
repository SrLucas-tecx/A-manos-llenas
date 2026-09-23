// js/ofertas.js
// Lógica del tablero de anuncios: listar, filtrar y publicar
// ofertas (empresas) o solicitudes (organizaciones).

import { getAnuncios, addAnuncio, getSession } from './data.js';
import { toast } from './toast.js';

let estadoFiltro = { tipo: 'todos', texto: '' };

export function initTablero({ soloDe } = {}) {
  const board = document.getElementById('board');
  if (!board) return;

  document.querySelectorAll('.chip[data-tipo]').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip[data-tipo]').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      estadoFiltro.tipo = chip.dataset.tipo;
      render();
    });
  });

  const buscador = document.getElementById('buscador');
  if (buscador) {
    buscador.addEventListener('input', () => {
      estadoFiltro.texto = buscador.value.trim().toLowerCase();
      render();
    });
  }

  function render() {
    let anuncios = getAnuncios().slice().sort((a, b) => b.createdAt - a.createdAt);

    if (soloDe) anuncios = anuncios.filter((a) => a.autorId === soloDe);
    if (estadoFiltro.tipo !== 'todos') anuncios = anuncios.filter((a) => a.tipo === estadoFiltro.tipo);
    if (estadoFiltro.texto) {
      anuncios = anuncios.filter(
        (a) =>
          a.titulo.toLowerCase().includes(estadoFiltro.texto) ||
          a.ubicacion.toLowerCase().includes(estadoFiltro.texto) ||
          a.autorNombre.toLowerCase().includes(estadoFiltro.texto)
      );
    }

    if (!anuncios.length) {
      board.innerHTML = `<div class="empty-state">No hay anuncios que coincidan con este filtro todavía. Publica el primero desde el botón "Publicar".</div>`;
      return;
    }

    board.innerHTML = anuncios.map(cardHTML).join('');
  }

  render();
  window.addEventListener('aml:anuncios-changed', render);
}

/** Lista simple (sin filtros) de los anuncios publicados por un autor — usada en "Mis anuncios". */
export function renderMisAnuncios(containerId, autorId) {
  const host = document.getElementById(containerId);
  if (!host) return;
  function render() {
    const propios = getAnuncios()
      .filter((a) => a.autorId === autorId)
      .sort((a, b) => b.createdAt - a.createdAt);
    host.innerHTML = propios.length
      ? propios.map(cardHTML).join('')
      : `<div class="empty-state">Todavía no has publicado ningún anuncio.</div>`;
  }
  render();
  window.addEventListener('aml:anuncios-changed', render);
}

function cardHTML(a) {
  return `
    <a class="anuncio-card ${a.tipo === 'solicitud' ? 'solicitud' : ''}" href="oferta-detalle.html?id=${a.id}">
      <span class="a-kind">${a.tipo === 'oferta' ? 'Oferta de donación' : 'Solicitud'}</span>
      <div class="a-title">${a.titulo}</div>
      <div class="a-meta">
        <span>${a.autorNombre}</span>
        <span>${a.ubicacion}</span>
        <span>${a.cantidad} ${a.unidad} · ${a.tiempoEntrega}</span>
      </div>
      <div class="a-foot">
        <span class="badge ${a.estado}">${estadoLabel(a.estado)}</span>
      </div>
    </a>
  `;
}

function estadoLabel(estado) {
  return { disponible: 'Disponible', reclamado: 'Reclamado', completado: 'Completado' }[estado] || estado;
}

/* ---------------- Modal para publicar un anuncio ---------------- */
export function initPublicarModal() {
  const modalBg = document.getElementById('modal-publicar');
  const abrirBtn = document.getElementById('abrir-publicar');
  const cerrarBtn = document.getElementById('cerrar-publicar');
  const form = document.getElementById('form-publicar');
  if (!modalBg || !form) return;

  const session = getSession();
  const tipoSelect = document.getElementById('pub-tipo');

  // Una empresa solo puede publicar ofertas; una organización solo solicitudes.
  if (session?.tipo === 'empresa') {
    tipoSelect.value = 'oferta';
    tipoSelect.disabled = true;
  } else if (session?.tipo === 'organizacion') {
    tipoSelect.value = 'solicitud';
    tipoSelect.disabled = true;
  }

  abrirBtn?.addEventListener('click', () => modalBg.classList.add('open'));
  cerrarBtn?.addEventListener('click', () => modalBg.classList.remove('open'));
  modalBg.addEventListener('click', (e) => {
    if (e.target === modalBg) modalBg.classList.remove('open');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!session) return;
    const fd = new FormData(form);
    addAnuncio({
      tipo: fd.get('tipo'),
      autorId: session.id,
      autorTipo: session.tipo,
      autorNombre: session.nombre,
      titulo: fd.get('titulo'),
      uso: fd.get('uso'),
      cantidad: Number(fd.get('cantidad')),
      unidad: fd.get('unidad'),
      ubicacion: fd.get('ubicacion'),
      tiempoEntrega: fd.get('tiempoEntrega'),
    });
    form.reset();
    if (session.tipo === 'empresa') tipoSelect.value = 'oferta';
    if (session.tipo === 'organizacion') tipoSelect.value = 'solicitud';
    modalBg.classList.remove('open');
    toast('Anuncio publicado correctamente.');
    window.dispatchEvent(new Event('aml:anuncios-changed'));
  });
}
