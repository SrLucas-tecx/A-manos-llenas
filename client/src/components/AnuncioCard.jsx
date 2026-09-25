// src/components/AnuncioCard.jsx
// Tarjeta de un anuncio del tablero (antes cardHTML() en js/ofertas.js).

import { Link } from 'react-router-dom';

export const ESTADO_ANUNCIO = { disponible: 'Disponible', reclamado: 'Reclamado', completado: 'Completado' };

export default function AnuncioCard({ anuncio: a }) {
  return (
    <Link className={`anuncio-card ${a.tipo === 'solicitud' ? 'solicitud' : ''}`} to={`/anuncio/${a.id}`}>
      <span className="a-kind">{a.tipo === 'oferta' ? 'Oferta de donación' : 'Solicitud'}</span>
      <div className="a-title">{a.titulo}</div>
      <div className="a-meta">
        <span>{a.autorNombre}</span>
        <span>{a.ubicacion}</span>
        <span>
          {a.cantidad} {a.unidad} · {a.tiempoEntrega}
        </span>
      </div>
      <div className="a-foot">
        <span className={`badge ${a.estado}`}>{ESTADO_ANUNCIO[a.estado] || a.estado}</span>
      </div>
    </Link>
  );
}
