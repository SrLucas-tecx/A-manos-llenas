// src/pages/Admin.jsx
// Panel de administración.
//   - Cuentas: vienen del backend (GET /api/usuarios, DELETE /api/usuarios/:id).
//   - Anuncios, donaciones y reportes: todavía son datos simulados (services/data.js) hasta el Sprint 2/3.

import { useEffect, useState } from 'react';
import api, { mensajeDeError } from '../services/api.js';
import { getDonaciones, getAnuncios } from '../services/data.js';
import { toast } from '../utils/toast.js';

const ROL_TEXTO = { empresa: 'Empresa', organizacion: 'Organización', administrador: 'Administración' };

export default function Admin() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [denunciadas, setDenunciadas] = useState([]); // ids con denuncia formal generada

  const cargarUsuarios = async () => {
    try {
      const { data } = await api.get('/usuarios');
      setUsuarios(data);
      setError('');
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const darDeBaja = async (u) => {
    try {
      await api.delete(`/usuarios/${u._id}`);
      toast(`${u.nombre_entidad} fue dada de baja de la plataforma.`);
      cargarUsuarios();
    } catch (err) {
      toast(mensajeDeError(err), 'err');
    }
  };

  const denunciar = (id) => {
    setDenunciadas((prev) => [...prev, id]);
    toast('Se generó el reporte de denuncia formal para auditoría externa.');
  };

  // Datos simulados (Sprint 2/3)
  const anuncios = getAnuncios();
  const donaciones = getDonaciones();
  const calificadas = donaciones.filter((d) => d.estado === 'calificado');
  const deficientes = donaciones.filter((d) => d.calificacion?.deficiente);
  const pctDeficiente = calificadas.length ? Math.round((deficientes.length / calificadas.length) * 100) : 0;
  const orgsActivas = usuarios.filter((u) => u.rol === 'organizacion' && u.activo !== false).length;

  return (
    <section>
      <div className="wrap">
        <div className="section-head">
          <div>
            <h2>Panel de administración</h2>
            <p className="lede">Monitoreo de cuentas, bajas y reporte de impacto para auditoría externa.</p>
          </div>
        </div>

        <div className="kpi-row">
          <div className="kpi"><b>{anuncios.length}</b><span>Anuncios publicados</span></div>
          <div className="kpi"><b>{donaciones.length}</b><span>Donaciones en gestión</span></div>
          <div className="kpi"><b>{orgsActivas}</b><span>Organizaciones activas</span></div>
          <div className="kpi"><b>{pctDeficiente}%</b><span>Donaciones reportadas deficientes</span></div>
        </div>

        <h3>Cuentas registradas</h3>
        {error && <div className="form-msg show error">{error}</div>}
        <table style={{ marginBottom: 40 }}>
          <thead>
            <tr>
              <th>Entidad</th>
              <th>Tipo</th>
              <th>Correo</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={5}>Cargando…</td></tr>
            ) : usuarios.length ? (
              usuarios.map((u) => (
                <tr key={u._id}>
                  <td>
                    {u.nombre_entidad}
                    <br />
                    <span style={{ color: 'var(--ink-soft)', fontSize: '.78rem' }}>{u.nombre_encargado}</span>
                  </td>
                  <td>{ROL_TEXTO[u.rol] || u.rol}</td>
                  <td>{u.email}</td>
                  <td>{u.activo === false ? 'Dada de baja' : 'Activa'}</td>
                  <td>
                    {u.activo === false || u.rol === 'administrador' ? (
                      '—'
                    ) : (
                      <button className="btn small danger" onClick={() => darDeBaja(u)}>Dar de baja</button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5}>Todavía no hay cuentas registradas.</td></tr>
            )}
          </tbody>
        </table>

        <h3>Reportes de donaciones deficientes</h3>
        {deficientes.length ? (
          deficientes.map((d) => {
            const anuncio = anuncios.find((a) => a.id === d.anuncioId);
            const yaDenunciada = denunciadas.includes(d.id);
            return (
              <div key={d.id} className="card" style={{ marginBottom: 12 }}>
                <strong>{anuncio?.titulo || 'Anuncio eliminado'}</strong>
                <p className="lede" style={{ margin: '6px 0' }}>
                  Empresa: {d.empresaNombre || '—'} · Calificación: {d.calificacion.puntuacion}/5
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
