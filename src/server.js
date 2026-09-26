// Variables de entorno
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

// Bases de Datos y Almacenamiento
const { connectDB } = require('./config/database');
// const cloudinary = require('./config/cloudinary'); // TODO: crear config/cloudinary.js antes de activarlo

// Manejo de errores
const errorHandler = require('./middleware/errorHandler');

// Limpia filtros de consultas con operadores tipo {"$ne": null} -> protege contra inyección NoSQL
mongoose.set('sanitizeFilter', true);

const app = express();
const PORT = process.env.PORT;

// Middlewares
app.use(cors());
app.use(express.json());

// Conectar DB (en pruebas no: Jest usa su propia base de datos)
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// Rutas existentes API
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/usuarios', require('./routes/usuarioRoutes'));
/*
app.use('/api/nombre', require('./routes/nombreRoutes'));
*/

// Ruta /api que no existe
app.use('/api', (req, res) => res.status(404).json({ message: 'Ruta no encontrada' }));

// En producción, Express sirve la app de React ya compilada (client/dist).
// En desarrollo NO hace falta: Vite sirve el front en http://localhost:5173
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));

  // Ruta raíz y cualquier otra -> index.html, y React Router decide qué página mostrar
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Errores que no atrapó ningún controlador (siempre al final)
app.use(errorHandler);

// Si se ejecuta en modo de desarrollo o producción, manda mensaje de confirmación
// y ejecuta en el puerto asignado
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
  });
}

module.exports = app;
