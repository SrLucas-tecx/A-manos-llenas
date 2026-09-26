// app.js
// Configuración de Express (middlewares + rutas). No se conecta a la BD ni escucha puerto:
// así las pruebas pueden importar "app" directamente con supertest.

const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const errorHandler = require('./middleware/errorHandler');

// Limpia filtros de consultas con operadores tipo {"$ne": null} -> protege contra inyección NoSQL
mongoose.set('sanitizeFilter', true);

const app = express();

app.use(cors());
app.use(express.json({ limit: '100kb' }));

// ---------- API ----------
app.get('/api/salud', (req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/usuarios', require('./routes/usuarioRoutes'));
// Sprint 2: app.use('/api/anuncios', require('./routes/anuncioRoutes'));

// Ruta /api que no existe
app.use('/api', (req, res) => res.status(404).json({ message: 'Ruta no encontrada' }));

// ---------- Front (solo producción) ----------
// En desarrollo el front lo sirve Vite en http://localhost:5173
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get(/.*/, (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use(errorHandler);

module.exports = app;
