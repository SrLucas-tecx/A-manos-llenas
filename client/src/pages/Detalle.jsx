// src/pages/Detalle.jsx  (antes pages/oferta-detalle.html + js/detalle.js)
// Muestra un anuncio y las acciones según el rol: reclamar, marcar recibido, calificar.

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getAnuncio,
  getDonaciones,
  saveDonacion,
  crearDonacionDesdeAnuncio,
  calificarDonacion,
  addNotificacion,
} from '../services/data.js';
import { toast } from '../utils/toast.js';
import { ESTADO_ANUNCIO } from '../components/AnuncioCard.jsx';

export default function Detalle() {
  const { id } = useParams(); // antes: oferta-detalle.html?id=...
  const { session } = useAuth();
  const [, setVersion] = useState(0);
  const refrescar = () => setVersion((v) => v + 1);

  const anuncio = getAnuncio(id);

  if (!anuncio) {
    return (
      <section>
        <div className="wrap">
          <div className="empty-state">Este anuncio ya no existe o fue eliminado.</div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="wrap">
        <div className="detail-head">
          <span className="a-kind">{anuncio.tipo === 'oferta' ? 'Oferta de donación' : 'Solicitud'}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0 }}>{anuncio.titulo}</h1>
            <span className={`badge ${anuncio.estado}`}>{ESTADO_ANUNCIO[anuncio.estado]}</span>
          </div>
        </div>

        <div className="detail-grid">
          <div>
            <ul className="info-list">
              <li><span>Publicado por</span><span>{anuncio.autorNombre}</span></li>
              <li><span>Uso recomendado</span><span>{anuncio.uso}</span></li>
              <li><span>Cantidad</span><span>{anuncio.cantidad} {anuncio.unidad}</span></li>
              <li><span>Ubicación</span><span>{anuncio.ubicacion}</span></li>
              <li><span>Tiempo de entrega</span><span>{anuncio.tiempoEntrega}</span></li>
              <li>
                <span>Publicado el</span>
                <span>{new Date(anuncio.createdAt).toLocaleDateString('es-MX', { dateStyle: 'long' })}</span>
              </li>
            </ul>
            <h3 style={{ marginTop: 26 }}>Ubicación</h3>
            <div className="map-embed">
              <iframe
                loading="lazy"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(anuncio.ubicacion)}&output=embed`}
                title={`Ubicación de ${anuncio.autorNombre}`}
              ></iframe>
            </div>
          </div>
          <div className="action-card">
            <Acciones anuncio={anuncio} session={session} onCambio={refrescar} />
          </div>
        </div>

        <p style={{ marginTop: 30 }}>
          <Link to="/panel">&larr; Volver al tablero</Link>
        </p>
      </div>
    </section>
  );
}

function Acciones({ anuncio, session, onCambio }) {
  if (!session) {
    return (
      <>
        <p className="lede">Inicia sesión para reclamar este anuncio o dar seguimiento a la donación.</p>
        <Link className="btn" to="/login">Iniciar sesión</Link>
      </>
    );
  }

  const esAutor = session.id === anuncio.autorId;
  const puedeReclamar =
    !esAutor &&
    anuncio.estado === 'disponible' &&
    ((anuncio.tipo === 'oferta' && session.tipo === 'organizacion') ||
      (anuncio.tipo === 'solicitud' && session.tipo === 'empresa'));

  if (puedeReclamar) {
    const reclamar = () => {
      crearDonacionDesdeAnuncio(anuncio, session);
      addNotificacion({
        destinatarioId: anuncio.autorId,
        titulo: anuncio.tipo === 'oferta' ? 'Tu oferta fue reclamada' : 'Tu solicitud fue aceptada',
        mensaje: `${session.nombre} dio seguimiento a "${anuncio.titulo}".`,
      });
      toast('Listo, quedó registrada la donación en curso.');
      onCambio();
    };
    return (
      <>
        <p className="lede">
          {anuncio.tipo === 'oferta'
            ? 'Reclama esta oferta para coordinar la entrega con la empresa donante.'
            : 'Ofrece cubrir esta solicitud y coordina la entrega con la organización.'}
        </p>
        <button className="btn" onClick={reclamar}>
          {anuncio.tipo === 'oferta' ? 'Reclamar oferta' : 'Cubrir solicitud'}
        </button>
      </>
    );
  }

  const donacion = getDonaciones().find((d) => d.anuncioId === anuncio.id);
  if (donacion) return <FlujoDonacion donacion={donacion} anuncio={anuncio} session={session} onCambio={onCambio} />;

  if (esAutor) {
    return <p className="lede">Este es tu anuncio. Cuando alguien lo reclame, verás aquí el seguimiento de la donación.</p>;
  }
  return <p className="lede">Este anuncio ya no está disponible.</p>;
}

const ESTADO_DON = { en_curso: 'en curso', entregado: 'entregada, pendiente de calificar', calificado: 'calificada' };

function FlujoDonacion({ donacion, anuncio, session, onCambio }) {
  const [puntuacion, setPuntuacion] = useState(0);
  const [deficiente, setDeficiente] = useState(false);
  const [comentario, setComentario] = useState('');

  const esEmpresa = session.tipo === 'empresa' && session.id === donacion.empresaId;
  const esOrg = session.tipo === 'organizacion' && session.id === donacion.orgId;

  if (!esEmpresa && !esOrg) {
    return (
      <p className="lede">
        Seguimiento de esta donación: <strong>{ESTADO_DON[donacion.estado] || donacion.estado}</strong>.
      </p>
    );
  }

  if (donacion.estado === 'en_curso') {
    const marcarRecibido = () => {
      // En js/detalle.js esto no se guardaba en localStorage; aquí sí.
      saveDonacion({ ...donacion, estado: 'entregado' });
      addNotificacion({
        destinatarioId: donacion.empresaId,
        titulo: 'Donación recibida',
        mensaje: `${session.nombre} confirmó la recepción de "${anuncio.titulo}".`,
      });
      toast('Marcado como recibido. Ahora puedes calificar la donación.');
      onCambio();
    };
    return (
      <>
        <p className="lede">
          Donación en curso entre {donacion.empresaNombre} y {donacion.orgNombre}.
        </p>
        {esOrg ? (
          <button className="btn" onClick={marcarRecibido}>Marcar como recibido</button>
        ) : (
          <p className="lede">Esperando confirmación de recepción por parte de la organización.</p>
        )}
      </>
    );
  }

  if (donacion.estado === 'entregado' && esOrg) {
    const enviar = () => {
      if (!puntuacion) {
        toast('Selecciona una calificación en estrellas.', 'err');
        return;
      }
      calificarDonacion(donacion.id, { puntuacion, comentario, deficiente });
      addNotificacion({
        destinatarioId: donacion.empresaId,
        titulo: deficiente ? 'Donación calificada como deficiente' : 'Nueva calificación recibida',
        mensaje: `"${anuncio.titulo}" fue calificada con ${puntuacion}/5.`,
      });
      toast(deficiente ? 'Calificación enviada. Se notificó a la administración.' : 'Gracias por calificar la donación.');
      onCambio();
    };
    return (
      <>
        <p className="lede">Califica cómo llegó la donación para mantener la transparencia con la empresa donante.</p>
        <div className="star-row">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" className={`star ${n <= puntuacion ? 'on' : ''}`} onClick={() => setPuntuacion(n)}>
              ★
            </button>
          ))}
        </div>
        <label className="checkbox-row">
          <input type="checkbox" checked={deficiente} onChange={(e) => setDeficiente(e.target.checked)} /> Reportar
          como deficiente o incompleta
        </label>
        <div className="field">
          <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Comentario (opcional)" />
        </div>
        <button className="btn" onClick={enviar}>Enviar calificación</button>
      </>
    );
  }

  if (donacion.estado === 'calificado') {
    const c = donacion.calificacion;
    return (
      <>
        <p className="lede">
          Donación completada, calificación: <strong>{c.puntuacion}/5</strong>
          {c.deficiente ? ' · reportada como deficiente' : ''}.
        </p>
        {c.comentario && <p className="lede">"{c.comentario}"</p>}
      </>
    );
  }

  return <p className="lede">Estado actual: {ESTADO_DON[donacion.estado] || donacion.estado}.</p>;
}
