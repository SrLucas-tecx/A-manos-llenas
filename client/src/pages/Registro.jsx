// src/pages/Registro.jsx
// Crea la cuenta en el backend (POST /api/auth/register) y deja la sesión iniciada.

import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { registrarCuenta } from '../services/auth.js';

export default function Registro() {
  const { session, login } = useAuth();
  const navigate = useNavigate();
  const [rol, setRol] = useState('empresa'); // 'empresa' | 'organizacion'
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  if (session) return <Navigate to="/panel" replace />;

  const enviar = async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target).entries());
    setError('');
    setCargando(true);
    try {
      const nueva = await registrarCuenta({
        nombre_entidad: f.nombre_entidad,
        nombre_encargado: f.nombre_encargado,
        email: f.email,
        password: f.password,
        rol,
        direccion: f.direccion || undefined,
        contacto: f.numero_telefonico ? { numero_telefonico: f.numero_telefonico } : undefined,
      });
      login(nueva);
      navigate('/panel');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const cambiarRol = (r) => {
    setRol(r);
    setError('');
  };

  const esEmpresa = rol === 'empresa';

  return (
    <section>
      <div className="wrap form-shell">
        <div className="card">
          <h2>Crea tu cuenta</h2>
          <div className="tabs">
            <div className={`tab ${esEmpresa ? 'active' : ''}`} onClick={() => cambiarRol('empresa')}>
              Soy empresa
            </div>
            <div className={`tab ${!esEmpresa ? 'active' : ''}`} onClick={() => cambiarRol('organizacion')}>
              Soy organización social
            </div>
          </div>

          <div className={`form-msg ${error ? 'show error' : ''}`}>{error}</div>

          <form onSubmit={enviar}>
            <Campo
              id="nombre_entidad"
              label={esEmpresa ? 'Nombre de la empresa' : 'Nombre de la organización'}
              placeholder={esEmpresa ? 'Panificadora Trigo Dorado' : 'Centro de Acopio Pelusas'}
            />
            <Campo id="nombre_encargado" label="Nombre completo del encargado" placeholder="Laura Martínez Ruiz" minLength={10} />
            <Campo id="email" type="email" label="Correo" placeholder="contacto@ejemplo.mx" />
            <Campo
              id="password"
              type="password"
              label="Contraseña"
              minLength={8}
              ayuda="Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo."
            />
            <Campo
              id="numero_telefonico"
              label="Teléfono (10 dígitos)"
              placeholder="5512345678"
              pattern="\d{10}"
              required={false}
            />
            <Campo id="direccion" label="Dirección" placeholder="Calle, número, ciudad, estado" minLength={10} required={false} />
            <button className="btn" type="submit" style={{ width: '100%' }} disabled={cargando}>
              {cargando ? 'Registrando…' : esEmpresa ? 'Registrar empresa' : 'Registrar organización'}
            </button>
          </form>

          <p className="helper">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>.
          </p>
        </div>
      </div>
    </section>
  );
}

function Campo({ id, label, type = 'text', required = true, ayuda, ...rest }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} name={id} type={type} required={required} {...rest} />
      {ayuda && <small className="helper">{ayuda}</small>}
    </div>
  );
}
