// src/components/PublicarModal.jsx
// Modal para publicar una oferta o solicitud (antes initPublicarModal() en js/ofertas.js).

import { useAuth } from '../context/AuthContext.jsx';
import { addAnuncio } from '../services/data.js';
import { toast } from '../utils/toast.js';

export default function PublicarModal({ abierto, onCerrar, onPublicado }) {
  const { session } = useAuth();
  // Una empresa solo puede publicar ofertas; una organización solo solicitudes.
  const tipo = session?.tipo === 'empresa' ? 'oferta' : 'solicitud';

  const enviar = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    addAnuncio({
      tipo,
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
    e.target.reset();
    toast('Anuncio publicado correctamente.');
    onPublicado?.();
    onCerrar();
  };

  return (
    <div className={`modal-bg ${abierto ? 'open' : ''}`} onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="modal">
        <div className="modal-head">
          <h3 style={{ margin: 0 }}>Publicar anuncio</h3>
          <button className="modal-close" type="button" aria-label="Cerrar" onClick={onCerrar}>
            &times;
          </button>
        </div>
        <form onSubmit={enviar}>
          <div className="field">
            <label htmlFor="pub-tipo">Tipo de anuncio</label>
            <select id="pub-tipo" name="tipo" value={tipo} disabled>
              <option value="oferta">Oferta de donación</option>
              <option value="solicitud">Solicitud</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="pub-titulo">Título</label>
            <input id="pub-titulo" name="titulo" required placeholder="Ej. Pan de caja excedente de producción" />
          </div>
          <div className="field">
            <label htmlFor="pub-uso">Uso recomendado</label>
            <textarea id="pub-uso" name="uso" required placeholder="¿Para qué se puede usar este recurso?"></textarea>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="pub-cantidad">Cantidad</label>
              <input id="pub-cantidad" name="cantidad" type="number" min="1" required />
            </div>
            <div className="field">
              <label htmlFor="pub-unidad">Unidad</label>
              <input id="pub-unidad" name="unidad" required placeholder="kg, piezas, litros..." />
            </div>
          </div>
          <div className="field">
            <label htmlFor="pub-ubicacion">Ubicación</label>
            <input id="pub-ubicacion" name="ubicacion" required placeholder="Ciudad, estado" />
          </div>
          <div className="field">
            <label htmlFor="pub-tiempo">Tiempo estimado de entrega</label>
            <input id="pub-tiempo" name="tiempoEntrega" required placeholder="Ej. Recolección en 24 horas" />
          </div>
          <button className="btn" type="submit" style={{ width: '100%' }}>
            Publicar
          </button>
        </form>
      </div>
    </div>
  );
}
