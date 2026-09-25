/* Conexión a la base de datos */
const mongoose = require('mongoose');

const connectDB = async (uri = process.env.MONGO_URI) => {
  try {
    await mongoose.connect(uri); /* obtenido de MongoAtlas */
    console.log('¡Conexión exitosa a la base de datos!');
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error.message);
    process.exit(1); /* Cierra si hay algo mal */
  }
};

module.exports = { connectDB };
