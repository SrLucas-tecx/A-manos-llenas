// js/admin.js
// Panel de administración: monitoreo de incumplimientos repetidos,
// baja de empresas y reporte de impacto/transparencia.

import { getEmpresas, saveEmpresa, getDonaciones, getAnuncios, getOrgs } from './data.js';
import { toast } from './toast.js';

const LIMITE_INCUMPLIMIENTOS = 3;

export function initAdmin() {
  renderKPIs();
  renderEmpresas();
  renderDenuncias();
}

function renderKPIs() {
  const kpis = document.getElementById('admin-kpis');
  if (!kpis) return;
  const donaciones = getDonaciones();
  const anuncios = getAnuncios();
  const calificadas = donaciones.filter((d) => d.estado === 'calificado');
  const deficientes = calificadas.filter((d) => d.calificacion?.deficiente);
  const pctDeficiente = calificadas.length ? Math.round((deficientes.length / calificadas.length) * 100) : 0;

  kpis.innerHTML = `
    <div class="kpi"><b>${anuncios.length}</b><span>Anuncios publicados</span></div>
    <div class="kpi"><b>${donaciones.length}</b><span>Donaciones en gestión</span></div>
    <div class="kpi"><b>${getOrgs().length}</b><span>Organizaciones activas</span></div>
    <div class="kpi"><b>${pctDeficiente}%</b><span>Donaciones reportadas deficientes</span></div>
  `;
}

function renderEmpresas() {
  const tbody = document.getElementById('admin-empresas-body');
  if (!tbody) return;
  const empresas = getEmpresas();

  if (!empresas.length) {
    tbody.innerHTML = `<tr><td colspan="5">Todavía no hay empresas registradas.</td></tr>`;
    return;
  }

  tbody.innerHTML = empresas
    .map(
      (e) => `
      <tr class="${e.incumplimientos >= LIMITE_INCUMPLIMIENTOS ? 'flag' : ''}">
        <td>${e.nombre}<br><span style="color:var(--ink-soft); font-size:.78rem">${e.ubicacion}</span></td>
        <td>${e.email}</td>
        <td><span class="count-pill ${e.incumplimientos > 0 ? 'warn' : ''}">${e.incumplimientos || 0}</span></td>
        <td>${e.activa === false ? 'Dada de baja' : 'Activa'}</td>
        <td>
          ${
            e.activa === false
              ? '—'
              : `<button class="btn small danger" data-baja="${e.id}">Dar de baja</button>`
          }
        </td>
      </tr>`
    )
    .join('');

  tbody.querySelectorAll('[data-baja]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const empresas2 = getEmpresas();
      const empresa = empresas2.find((e) => e.id === btn.dataset.baja);
      if (!empresa) return;
      empresa.activa = false;
      saveEmpresa(empresa);
      toast(`${empresa.nombre} fue dada de baja de la plataforma.`);
      renderEmpresas();
    })
  );
}

function renderDenuncias() {
  const list = document.getElementById('admin-denuncias');
  if (!list) return;
  const donaciones = getDonaciones().filter((d) => d.calificacion?.deficiente);
  const anuncios = getAnuncios();
  const empresas = getEmpresas();

  if (!donaciones.length) {
    list.innerHTML = `<div class="empty-state">No hay reportes de donaciones deficientes por ahora.</div>`;
    return;
  }

  list.innerHTML = donaciones
    .map((d) => {
      const anuncio = anuncios.find((a) => a.id === d.anuncioId);
      const empresa = empresas.find((e) => e.id === d.empresaId);
      return `
        <div class="card" style="margin-bottom:12px;">
          <strong>${anuncio?.titulo || 'Anuncio eliminado'}</strong>
          <p class="lede" style="margin:6px 0;">Empresa: ${empresa?.nombre || '—'} · Calificación: ${d.calificacion.puntuacion}/5</p>
          ${d.calificacion.comentario ? `<p class="lede">"${d.calificacion.comentario}"</p>` : ''}
          <button class="btn small danger" data-denunciar="${d.id}" ${d.denunciada ? 'disabled' : ''}>
            ${d.denunciada ? 'Denuncia formal registrada' : 'Generar denuncia formal'}
          </button>
        </div>`;
    })
    .join('');

  list.querySelectorAll('[data-denunciar]').forEach((btn) =>
    btn.addEventListener('click', () => {
      btn.textContent = 'Denuncia formal registrada';
      btn.disabled = true;
      toast('Se generó el reporte de denuncia formal para auditoría externa.');
    })
  );
}
