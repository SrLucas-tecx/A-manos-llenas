// src/components/Header.jsx
// Encabezado del sitio + campana de notificaciones (antes js/nav.js).

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getNotificaciones, marcarNotificacionesLeidas } from '../services/data.js';

export default function Header() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const salir = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="wrap">
        <Link className="brand" to="/">
          <span className="brand-mark"></span>A Manos Llenas
        </Link>
        <nav className="main-nav">
          {!session && (
            <>
              <Link to="/#como-funciona">Cómo funciona</Link>
              <Link to="/#impacto">Impacto</Link>
            </>
          )}
        </nav>
        <div className="nav-right">
          {session ? (
            <>
              <Bell destinatarioId={session.id} />
              <Link className="btn secondary small" to={session.tipo === 'admin' ? '/admin' : '/panel'}>
                Mi panel
              </Link>
              <button className="btn small" type="button" onClick={salir}>
                Salir
              </button>
            </>
          ) : (
            <>
              <Link className="btn secondary small" to="/login">Iniciar sesión</Link>
              <Link className="btn small" to="/registro">Registrarme</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function Bell({ destinatarioId }) {
  const [abierto, setAbierto] = useState(false);
  const [notifs, setNotifs] = useState(() => getNotificaciones(destinatarioId));
  const sinLeer = notifs.filter((n) => !n.leida).length;

  // Cierra el panel al hacer clic en cualquier otro lado
  useEffect(() => {
    const cerrar = () => setAbierto(false);
    document.addEventListener('click', cerrar);
    return () => document.removeEventListener('click', cerrar);
  }, []);

  const toggle = (e) => {
    e.stopPropagation();
    if (!abierto) {
      setNotifs(getNotificaciones(destinatarioId)); // recarga al abrir
      marcarNotificacionesLeidas(destinatarioId);
      setTimeout(() => setNotifs(getNotificaciones(destinatarioId)), 300);
    }
    setAbierto(!abierto);
  };

  return (
    <div className="bell-wrap">
      <button className="bell-btn" type="button" aria-label="Notificaciones" onClick={toggle}>
        🔔{sinLeer > 0 && <span className="bell-dot">{sinLeer}</span>}
      </button>
      <div className={`bell-panel ${abierto ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
        {notifs.length ? (
          notifs.map((n) => (
            <div key={n.id} className={`notif-item ${n.leida ? '' : 'unread'}`}>
              <b>{n.titulo}</b>
              {n.mensaje}
              <span className="notif-time">
                {new Date(n.createdAt).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>
          ))
        ) : (
          <div className="notif-empty">No tienes notificaciones todavía.</div>
        )}
      </div>
    </div>
  );
}
