// src/pages/Panel.jsx  (antes pages/panel.html + js/panel.js + tablero de js/ofertas.js)
// Empresas y organizaciones comparten esta pantalla; el contenido cambia según session.tipo.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getAnuncios, getDonaciones, getAnuncio, getEmpresa, getOrg } from '../services/data.js';
import AnuncioCard from '../components/AnuncioCard.jsx';
import PublicarModal from '../components/PublicarModal.jsx';

const SECCIONES = [
  { id: 'tablero', texto: 'Tablero general' },
  { id: 'mis-anuncios', texto: 'Mis anuncios' },
  { id: 'historial', texto: 'Historial de donaciones' },
];

export default function Panel() {
  const { session } = useAuth();
  const [seccion, setSeccion] = useState('tablero');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [, setVersion] = useState(0); // al publicar, se incrementa para volver a leer los datos
  const refrescar = () => setVersion((v) => v + 1);

  const esEmpresa = session.tipo === 'empresa';

  return (
    <div className="panel-shell">
      <aside className="side">
        <div className="who">{esEmpresa ? 'Empresa donante' : 'Organización social'}</div>
        <div className="who-name">{session.nombre}</div>
        {SECCIONES.map((s) => (
          <a
            key={s.id}
            href="#"
            className={`side-link ${seccion === s.id ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setSeccion(s.id);
            }}
          >
            {s.texto}
          </a>
        ))}
      </aside>

      <main className="main">
        {seccion === 'tablero' && (
          <Tablero onPublicar={() => setModalAbierto(true)} labelPublicar={esEmpresa ? 'Publicar oferta' : 'Publicar solicitud'} />
        )}
        {seccion === 'mis-anuncios' && <MisAnuncios autorId={session.id} />}
        {seccion === 'historial' && <Historial session={session} />}
      </main>

      <PublicarModal abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} onPublicado={refrescar} />
    </div>
  );
}

function Tablero({ onPublicar, labelPublicar }) {
  const [tipo, setTipo] = useState('todos');
  const [texto, setTexto] = useState('');

  let anuncios = getAnuncios().slice().sort((a, b) => b.createdAt - a.createdAt);
  if (tipo !== 'todos') anuncios = anuncios.filter((a) => a.tipo === tipo);
  const q = texto.trim().toLowerCase();
  if (q) {
    anuncios = anuncios.filter(
      (a) =>
        a.titulo.toLowerCase().includes(q) ||
        a.ubicacion.toLowerCase().includes(q) ||
        a.autorNombre.toLowerCase().includes(q)
    );
  }

  return (
    <section className="section-panel">
      <div className="board-toolbar">
        <div className="filters">
          {[
            ['todos', 'Todos'],
            ['oferta', 'Ofertas'],
            ['solicitud', 'Solicitudes'],
          ].map(([valor, label]) => (
            <button key={valor} className={`chip ${tipo === valor ? 'active' : ''}`} onClick={() => setTipo(valor)}>
              {label}
            </button>
          ))}
        </div>
        <div className="search-box">
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar por título, ubicación o nombre..."
          />
        </div>
        <button className="btn gold" onClick={onPublicar}>
          {labelPublicar}
        </button>
      </div>
      <div className="board">
        {anuncios.length ? (
          anuncios.map((a) => <AnuncioCard key={a.id} anuncio={a} />)
        ) : (
          <div className="empty-state">
            No hay anuncios que coincidan con este filtro todavía. Publica el primero desde el botón "Publicar".
          </div>
        )}
      </div>
    </section>
  );
}

function MisAnuncios({ autorId }) {
  const propios = getAnuncios()
    .filter((a) => a.autorId === autorId)
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <section className="section-panel">
      <div className="section-head">
        <h2>Mis anuncios</h2>
      </div>
      <div className="board">
        {propios.length ? (
          propios.map((a) => <AnuncioCard key={a.id} anuncio={a} />)
        ) : (
          <div className="empty-state">Todavía no has publicado ningún anuncio.</div>
        )}
      </div>
    </section>
  );
}

const ESTADO_DON = { en_curso: 'En curso', entregado: 'Entregada, por calificar', calificado: 'Calificada' };

function Historial({ session }) {
  const donaciones = getDonaciones()
    .filter((d) => (session.tipo === 'empresa' ? d.empresaId === session.id : d.orgId === session.id))
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <section className="section-panel">
      <div className="section-head">
        <h2>Historial de donaciones</h2>
      </div>
      {donaciones.length ? (
        donaciones.map((d) => {
          const anuncio = getAnuncio(d.anuncioId);
          const contraparte = session.tipo === 'empresa' ? getOrg(d.orgId)?.nombre : getEmpresa(d.empresaId)?.nombre;
          return (
            <Link key={d.id} className="anuncio-card" to={`/anuncio/${d.anuncioId}`} style={{ marginBottom: 12 }}>
              <span className="a-kind">{ESTADO_DON[d.estado] || d.estado}</span>
              <div className="a-title">{anuncio?.titulo || 'Anuncio eliminado'}</div>
              <div className="a-meta">
                <span>Contraparte: {contraparte || '—'}</span>
                {d.calificacion && (
                  <span>
                    Calificación: {d.calificacion.puntuacion}/5
                    {d.calificacion.deficiente ? ' · reportada como deficiente' : ''}
                  </span>
                )}
              </div>
            </Link>
          );
        })
      ) : (
        <div className="empty-state">Todavía no tienes donaciones en curso ni completadas.</div>
      )}
    </section>
  );
}
