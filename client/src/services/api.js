// src/services/api.js
// Cliente de axios para hablar con el backend.
// En desarrollo, Vite reenvía todo lo que empiece con /api a http://localhost:3000 (ver vite.config.js).

import axios from 'axios';

const TOKEN_KEY = 'aml_token';

const api = axios.create({ baseURL: '/api' });

// Agrega el token a cada petición si hay sesión iniciada
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Saca el mensaje de error que manda el backend ({ message: '...' })
export function mensajeDeError(err) {
  if (err.response?.data?.message) return err.response.data.message;
  if (err.response) return 'Ocurrió un error en el servidor.';
  return 'No se pudo conectar con el servidor. ¿Está corriendo el backend?';
}

export { TOKEN_KEY };
export default api;
