// src/App.jsx
// Rutas de la aplicación. Cada .html de antes ahora es una página .jsx:
//   index.html          -> /             (Home)
//   login.html          -> /login        (Login)
//   registro.html       -> /registro     (Registro)
//   panel.html          -> /panel        (Panel)        [empresa / organización]
//   oferta-detalle.html -> /anuncio/:id  (Detalle)
//   admin.html          -> /admin        (Admin)        [admin]

import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Registro from './pages/Registro.jsx';
import Panel from './pages/Panel.jsx';
import Detalle from './pages/Detalle.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route
          path="/panel"
          element={
            <RequireAuth roles={['empresa', 'organizacion']}>
              <Panel />
            </RequireAuth>
          }
        />
        <Route path="/anuncio/:id" element={<Detalle />} />
        <Route
          path="/admin"
          element={
            <RequireAuth roles={['admin']}>
              <Admin />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
