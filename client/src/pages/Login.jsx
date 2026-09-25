// src/pages/Login.jsx  (antes pages/login.html + js/login.js)

import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { iniciarSesionConCredenciales } from '../services/auth.js';

const ROLES = [
  { valor: 'empresa', texto: 'Empresa' },
  { valor: 'organizacion', texto: 'Organización' },
  { valor: 'admin', texto: 'Administración' },
];

export default function Login() {
  const { session, login } = useAuth();
  const navigate = useNavigate();
  const [rol, setRol] = useState('empresa');
  const [error, setError] = useState('');

  if (session) return <Navigate to={session.tipo === 'admin' ? '/admin' : '/panel'} replace />;

  const enviar = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const nueva = iniciarSesionConCredenciales(fd.get('email'), fd.get('password'), rol);
      login(nueva);
      navigate(rol === 'admin' ? '/admin' : '/panel');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section>
      <div className="wrap form-shell">
        <div className="card">
          <h2>Iniciar sesión</h2>

          {/* Selector de rol: js/login.js lo buscaba pero faltaba en login.html */}
        

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
            <button className="btn" type="submit" style={{ width: '100%' }}>
              Entrar
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
