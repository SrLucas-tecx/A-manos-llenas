// src/context/AuthContext.jsx
// Guarda la sesión en un estado de React para que el Header y las páginas
// se actualicen solos al iniciar o cerrar sesión.

import { createContext, useContext, useState } from 'react';
import { getSession, clearSession } from '../services/data.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSessionState] = useState(() => getSession());

  const login = (nuevaSesion) => setSessionState(nuevaSesion);
  const logout = () => {
    clearSession();
    setSessionState(null);
  };

  return <AuthContext.Provider value={{ session, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
