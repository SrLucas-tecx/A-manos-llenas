const mongoose = require('mongoose')

const usuarioSchema = new mongoose.Schema({
  nombre_entidad: {
    type: String,
    trim: true,
    minlength: 1,
    maxlength: 100,
    required: true,
    unique: true
  },

  email: {
    type: String,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/],
    trim: true,
    lowercase: true,
    minlength: 6,
    maxlength: 100,
    required: true,
    unique: true  
  },

  // contraseña
  password: {
    type: String,
    // Regex — 1 mayúscula, 1 minúscula, 1 número y un símbolo
    match: [/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/,
      'Asegurate de incluir un símbolo, un número, letras mayúsculas y minúsculas.'],
    minlength: 8,
    maxlength: 100,
    required: true,
    select: false
  },

  nombre_encargado: {
    type: String,
    trim: true,
    minlength: 10,
    maxlength: 150,
    required: true
  },


  // contexto_id: ID de la orfganización o empresa:
  rol: {
    // Referencia polimórfica — Empresa u Organización según contexto_tipo
    type: String,
    enum: ['administrador', 'empresa', 'organizacion'],
    required: true,
    default: 'organizacion'
  },

  contacto: {
    correo_publico: {
      type: String,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/],
      trim: true,
      lowercase: true,
      minlength: 6,
      maxlength: 100,
    },
    pagina_web: {
      type: String,
      match: [/^https:\/\/./],
      trim: true,
      lowercase: true,
    },
    numero_telefonico: {
      type: String,
      match: [/^\d{10}$/],
      trim: true,
      lowercase: true,
      minlength: 6,
      maxlength: 100,
    },
    redes_sociales: {
      facebook: { type: String },
      instagram: { type: String },
      tiktok: { type: String },
      pagina_web: { type: String },
      otro: { type: String }
    },
  },

  direccion: {
    type: String,
    trim: true,
    minlength: 10,
    maxlength: 500,
  },

  // Soft delete: un admin da de baja la cuenta sin borrarla (activo: false)
  activo: {
    type: Boolean,
    default: true
  }
},
  { collection: 'usuarios' }
)

module.exports = mongoose.model('Usuario', usuarioSchema);