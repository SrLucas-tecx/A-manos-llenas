// src/main.jsx
// Punto de entrada de React: index.html carga este archivo (<script src="/src/main.jsx">).

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { seedIfEmpty } from './services/data.js';
import App from './App.jsx';
import './styles/styles.css';

seedIfEmpty(); // datos de ejemplo la primera vez (antes se llamaba en cada página)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
