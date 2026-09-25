// src/pages/Admin.jsx  (antes pages/admin.html + js/admin.js)
// Monitoreo de incumplimientos, bajas de empresas y reporte de impacto.

import { useState } from 'react';
import { getEmpresas, saveEmpresa, getDonaciones, getAnuncios, getOrgs } from '../services/data.js';
import { toast } from '../utils/toast.js';

const LIMITE_INCUMPLIMIENTOS = 3;

export default function Admin() {
  const [, setVersion] = useState(0);
  const [denunciadas, setDenunciadas] = useState([]); // ids con denuncia formal generada

  const empresas = getEmpresas();
  const anuncios = getAnuncios();
  const donaciones = getDonaciones();
  const calificadas = donaciones.filter((d) => d.estado === 'calificado');
  const deficientes = donaciones.filter((d) => d.calificacion?.deficiente);
  const pctDeficiente = calificadas.length
    ? Math.round((calificadas.filter((d) => d.calificacion?.deficiente).length / calificadas.length) * 100)
    : 0;

  const darDeBaja = (empresa) => {
    saveEmpresa({ ...empresa, activa: false });
    toast(`${empresa.nombre} fue dada de baja de la plataforma.`);
    setVersion((v) => v + 1);
  };

  const denunciar = (id) => {
    setDenunciadas((prev) => [...prev, id]);
    toast('Se generó el reporte de denuncia formal para auditoría externa.');
  };

  return (
    <section>
      <div className="wrap">
        <div className="section-head">
          <div>
            <h2>Panel de administración</h2>
            <p className="lede">Monitoreo de incumplimientos, bajas de empresas y reporte de impacto para auditoría externa.</p>
          </div>
        </div>

        <div className="kpi-row">
          <div className="kpi"><b>{anuncios.length}</b><span>Anuncios publicados</span></div>
          <div className="kpi"><b>{donaciones.length}</b><span>Donaciones en gestión</span></div>
          <div className="kpi"><b>{getOrgs().length}</b><span>Organizaciones activas</span></div>
          <div className="kpi"><b>{pctDeficiente}%</b><span>Donaciones reportadas deficientes</span></div>
        </div>

        <h3>Empresas registradas</h3>
        <table style={{ marginBottom: 40 }}>
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Correo</th>
              <th>Incumplimientos</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {empresas.length ? (
              empresas.map((e) => (
                <tr key={e.id} className={e.incumplimientos >= LIMITE_INCUMPLIMIENTOS ? 'flag' : ''}>
                  <td>
                    {e.nombre}
                    <br />
                    <span style={{ color: 'var(--ink-soft)', fontSize: '.78rem' }}>{e.ubicacion}</span>
                  </td>
                  <td>{e.email}</td>
                  <td>
                    <span className={`count-pill ${e.incumplimientos > 0 ? 'warn' : ''}`}>{e.incumplimientos || 0}</span>
                  </td>
                  <td>{e.activa === false ? 'Dada de baja' : 'Activa'}</td>
                  <td>
                    {e.activa === false ? (
                      '—'
                    ) : (
                      <button className="btn small danger" onClick={() => darDeBaja(e)}>Dar de baja</button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>Todavía no hay empresas registradas.</td>
              </tr>
            )}
          </tbody>
        </table>

        <h3>Reportes de donaciones deficientes</h3>
        {deficientes.length ? (
          deficientes.map((d) => {
            const anuncio = anuncios.find((a) => a.id === d.anuncioId);
            const empresa = empresas.find((e) => e.id === d.empresaId);
            const yaDenunciada = denunciadas.includes(d.id);
            return (
              <div key={d.id} className="card" style={{ marginBottom: 12 }}>
                <strong>{anuncio?.titulo || 'Anuncio eliminado'}</strong>
                <p className="lede" style={{ margin: '6px 0' }}>
                  Empresa: {empresa?.nombre || '—'} · Calificación: {d.calificacion.puntuacion}/5
                </p>
                {d.calificacion.comentario && <p className="lede">"{d.calificacion.comentario}"</p>}
                <button className="btn small danger" disabled={yaDenunciada} onClick={() => denunciar(d.id)}>
                  {yaDenunciada ? 'Denuncia formal registrada' : 'Generar denuncia formal'}
                </button>
              </div>
            );
          })
        ) : (
          <div className="empty-state">No hay reportes de donaciones deficientes por ahora.</div>
        )}
      </div>
    </section>
  );
}
