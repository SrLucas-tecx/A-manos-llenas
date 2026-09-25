// src/components/RequireAuth.jsx
// Protege rutas: si no hay sesión (o el rol no coincide) manda a /login.
// Reemplaza a requerirSesion() de js/auth.js.

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RequireAuth({ roles, children }) {
  const { session } = useAuth();
  if (!session || (roles && !roles.includes(session.tipo))) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
