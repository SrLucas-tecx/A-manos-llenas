// src/pages/Login.jsx
// Inicia sesión con el backend (POST /api/auth/login). El rol lo decide el backend, no el formulario.

import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { iniciarSesion } from '../services/auth.js';

export default function Login() {
  const { session, login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  if (session) return <Navigate to={session.tipo === 'admin' ? '/admin' : '/panel'} replace />;

  const enviar = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    setError('');
    setCargando(true);
    try {
      const nueva = await iniciarSesion(fd.get('email'), fd.get('password'));
      login(nueva);
      navigate(nueva.tipo === 'admin' ? '/admin' : '/panel');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <section>
      <div className="wrap form-shell">
        <div className="card">
          <h2>Iniciar sesión</h2>

          <div className={`form-msg ${error ? 'show error' : ''}`}>{error}</div>

          <form onSubmit={enviar}>
            <div className="field">
              <label htmlFor="email">Correo</label>
              <input type="email" id="email" name="email" required placeholder="tucorreo@ejemplo.com" />
            </div>
            <div className="field">
              <label htmlFor="password">Contraseña</label>
              <input type="password" id="password" name="password" required placeholder="••••••••" />
            </div>
            <button className="btn" type="submit" style={{ width: '100%' }} disabled={cargando}>
              {cargando ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <p className="helper">
            ¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link>.
          </p>
        </div>
      </div>
    </section>
  );
}
