// src/pages/Registro.jsx  (antes pages/registro.html + js/registro.js)

import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { registrarEmpresa, registrarOrganizacion } from '../services/auth.js';

export default function Registro() {
  const { session, login } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('empresa');
  const [error, setError] = useState('');

  if (session) return <Navigate to="/panel" replace />;

  const enviar = (accion) => (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    try {
      login(accion(data));
      navigate('/panel');
    } catch (err) {
      setError(err.message);
    }
  };

  const cambiarTab = (t) => {
    setTab(t);
    setError('');
  };

  return (
    <section>
      <div className="wrap form-shell">
        <div className="card">
          <h2>Crea tu cuenta</h2>
          <div className="tabs">
            <div className={`tab ${tab === 'empresa' ? 'active' : ''}`} onClick={() => cambiarTab('empresa')}>
              Soy empresa
            </div>
            <div className={`tab ${tab === 'organizacion' ? 'active' : ''}`} onClick={() => cambiarTab('organizacion')}>
              Soy organización social
            </div>
          </div>

          <div className={`form-msg ${error ? 'show error' : ''}`}>{error}</div>

          {tab === 'empresa' ? (
            <form onSubmit={enviar(registrarEmpresa)}>
              <Campo id="e-nombre" name="nombre" label="Nombre de la empresa" placeholder="Panificadora Trigo Dorado" />
              <Campo id="e-email" name="email" type="email" label="Correo" placeholder="contacto@empresa.mx" />
              <Campo id="e-password" name="password" type="password" label="Contraseña" minLength={4} />
              <Campo id="e-contacto" name="contacto" label="Teléfono de contacto" placeholder="55 1234 5678" />
              <Campo id="e-ubicacion" name="ubicacion" label="Ubicación" placeholder="Ciudad, estado" />
              <button className="btn" type="submit" style={{ width: '100%' }}>Registrar empresa</button>
            </form>
          ) : (
            <form onSubmit={enviar(registrarOrganizacion)}>
              <Campo id="o-nombre" name="nombre" label="Nombre de la organización" placeholder="Centro de Acopio Pelusas" />
              <Campo id="o-email" name="email" type="email" label="Correo" placeholder="contacto@organizacion.org" />
              <Campo id="o-password" name="password" type="password" label="Contraseña" minLength={4} />
              <Campo id="o-contacto" name="contacto" label="Teléfono de contacto" placeholder="722 111 2233" />
              <Campo id="o-ubicacion" name="ubicacion" label="Ubicación" placeholder="Ciudad, estado" />
              <Campo id="o-capacidad" name="capacidad" label="Capacidad de recepción" placeholder="Ej. 200 kg / semana" />
              <button className="btn" type="submit" style={{ width: '100%' }}>Registrar organización</button>
            </form>
          )}

          <p className="helper">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>.
          </p>
        </div>
      </div>
    </section>
  );
}

function Campo({ id, label, type = 'text', ...rest }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} required {...rest} />
    </div>
  );
}
