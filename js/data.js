// js/data.js
// Capa de datos simulada (mock). En el prototipo no hay backend real:
// todo se guarda en localStorage para que la navegación se sienta funcional.

const KEYS = {
  empresas: 'aml_empresas',
  orgs: 'aml_organizaciones',
  anuncios: 'aml_anuncios',
  donaciones: 'aml_donaciones',
  notificaciones: 'aml_notificaciones',
  session: 'aml_session',
  seeded: 'aml_seeded_v1',
};

const LIMITE_INCUMPLIMIENTOS = 3;

function uid(prefix) {
  return prefix + '_' + Math.random().toString(36).slice(2, 9);
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ---------------- Empresas ---------------- */
export function getEmpresas() {
  return readJSON(KEYS.empresas, []);
}
export function getEmpresa(id) {
  return getEmpresas().find((e) => e.id === id) || null;
}
export function saveEmpresa(empresa) {
  const list = getEmpresas();
  const i = list.findIndex((e) => e.id === empresa.id);
  if (i >= 0) list[i] = empresa;
  else list.push(empresa);
  writeJSON(KEYS.empresas, list);
  return empresa;
}
export function addEmpresa(data) {
  const empresa = {
    id: uid('emp'),
    tipo: 'empresa',
    nombre: data.nombre,
    email: data.email,
    password: data.password,
    contacto: data.contacto,
    ubicacion: data.ubicacion,
    incumplimientos: 0,
    activa: true,
    createdAt: Date.now(),
  };
  return saveEmpresa(empresa);
}

/* ---------------- Organizaciones ---------------- */
export function getOrgs() {
  return readJSON(KEYS.orgs, []);
}
export function getOrg(id) {
  return getOrgs().find((o) => o.id === id) || null;
}
export function saveOrg(org) {
  const list = getOrgs();
  const i = list.findIndex((o) => o.id === org.id);
  if (i >= 0) list[i] = org;
  else list.push(org);
  writeJSON(KEYS.orgs, list);
  return org;
}
export function addOrg(data) {
  const org = {
    id: uid('org'),
    tipo: 'organizacion',
    nombre: data.nombre,
    email: data.email,
    password: data.password,
    contacto: data.contacto,
    ubicacion: data.ubicacion,
    capacidad: data.capacidad,
    createdAt: Date.now(),
  };
  return saveOrg(org);
}

/* ---------------- Cuentas (login) ---------------- */
export function findCuentaPorEmail(email, tipo) {
  if (tipo === 'empresa') return getEmpresas().find((e) => e.email === email) || null;
  if (tipo === 'organizacion') return getOrgs().find((o) => o.email === email) || null;
  if (tipo === 'admin') return ADMIN_ACCOUNTS.find((a) => a.email === email) || null;
  return null;
}

export const ADMIN_ACCOUNTS = [
  { id: 'admin_1', tipo: 'admin', nombre: 'Administración A Manos Llenas', email: 'admin@amanosllenas.org', password: 'admin123' },
];

/* ---------------- Anuncios (ofertas / solicitudes) ---------------- */
export function getAnuncios() {
  return readJSON(KEYS.anuncios, []);
}
export function getAnuncio(id) {
  return getAnuncios().find((a) => a.id === id) || null;
}
export function saveAnuncio(anuncio) {
  const list = getAnuncios();
  const i = list.findIndex((a) => a.id === anuncio.id);
  if (i >= 0) list[i] = anuncio;
  else list.push(anuncio);
  writeJSON(KEYS.anuncios, list);
  return anuncio;
}
export function addAnuncio(data) {
  const anuncio = {
    id: uid('an'),
    tipo: data.tipo, // 'oferta' | 'solicitud'
    autorId: data.autorId,
    autorTipo: data.autorTipo, // 'empresa' | 'organizacion'
    autorNombre: data.autorNombre,
    titulo: data.titulo,
    uso: data.uso,
    cantidad: data.cantidad,
    unidad: data.unidad,
    ubicacion: data.ubicacion,
    tiempoEntrega: data.tiempoEntrega,
    estado: 'disponible', // disponible | reclamado | completado
    createdAt: Date.now(),
  };
  return saveAnuncio(anuncio);
}

/* ---------------- Donaciones (match entre anuncio y contraparte) ---------------- */
export function getDonaciones() {
  return readJSON(KEYS.donaciones, []);
}
export function getDonacion(id) {
  return getDonaciones().find((d) => d.id === id) || null;
}
export function saveDonacion(don) {
  const list = getDonaciones();
  const i = list.findIndex((d) => d.id === don.id);
  if (i >= 0) list[i] = don;
  else list.push(don);
  writeJSON(KEYS.donaciones, list);
  return don;
}
export function crearDonacionDesdeAnuncio(anuncio, contraparte) {
  const empresaId = anuncio.autorTipo === 'empresa' ? anuncio.autorId : contraparte.id;
  const orgId = anuncio.autorTipo === 'organizacion' ? anuncio.autorId : contraparte.id;
  const don = {
    id: uid('don'),
    anuncioId: anuncio.id,
    empresaId,
    orgId,
    estado: 'en_curso', // en_curso | entregado | calificado
    calificacion: null,
    createdAt: Date.now(),
  };
  saveDonacion(don);
  anuncio.estado = 'reclamado';
  saveAnuncio(anuncio);
  return don;
}
export function calificarDonacion(donId, calificacion) {
  const don = getDonacion(donId);
  if (!don) return null;
  don.calificacion = calificacion; // { puntuacion, comentario, deficiente }
  don.estado = 'calificado';
  saveDonacion(don);

  const anuncio = getAnuncio(don.anuncioId);
  if (anuncio) {
    anuncio.estado = 'completado';
    saveAnuncio(anuncio);
  }

  if (calificacion.deficiente) {
    const empresa = getEmpresa(don.empresaId);
    if (empresa) {
      empresa.incumplimientos = (empresa.incumplimientos || 0) + 1;
      if (empresa.incumplimientos >= LIMITE_INCUMPLIMIENTOS) {
        empresa.activa = false;
      }
      saveEmpresa(empresa);
      notificarAdmins(
        'Donación reportada como deficiente',
        `${empresa.nombre} acumula ${empresa.incumplimientos} incumplimiento(s).`
      );
      if (!empresa.activa) {
        notificarAdmins('Empresa dada de baja automáticamente', `${empresa.nombre} superó el límite de incumplimientos.`);
      }
    }
  }
  return don;
}

/* ---------------- Notificaciones ---------------- */
export function getNotificaciones(destinatarioId) {
  return readJSON(KEYS.notificaciones, []).filter((n) => n.destinatarioId === destinatarioId)
    .sort((a, b) => b.createdAt - a.createdAt);
}
export function addNotificacion({ destinatarioId, titulo, mensaje }) {
  const list = readJSON(KEYS.notificaciones, []);
  list.push({
    id: uid('not'),
    destinatarioId,
    titulo,
    mensaje,
    leida: false,
    createdAt: Date.now(),
  });
  writeJSON(KEYS.notificaciones, list);
}
export function marcarNotificacionesLeidas(destinatarioId) {
  const list = readJSON(KEYS.notificaciones, []);
  list.forEach((n) => {
    if (n.destinatarioId === destinatarioId) n.leida = true;
  });
  writeJSON(KEYS.notificaciones, list);
}
export function notificarAdmins(titulo, mensaje) {
  ADMIN_ACCOUNTS.forEach((a) => addNotificacion({ destinatarioId: a.id, titulo, mensaje }));
}

/* ---------------- Sesión ---------------- */
export function getSession() {
  return readJSON(KEYS.session, null);
}
export function setSession(session) {
  writeJSON(KEYS.session, session);
}
export function clearSession() {
  localStorage.removeItem(KEYS.session);
}

/* ---------------- Seed de datos de ejemplo ---------------- */
export function seedIfEmpty() {
  if (localStorage.getItem(KEYS.seeded)) return;

  const emp1 = addEmpresa({
    nombre: 'Panificadora Trigo Dorado',
    email: 'contacto@trigodorado.mx',
    password: '123456',
    contacto: '55 1234 5678',
    ubicacion: 'Naucalpan, Estado de México',
  });
  const emp2 = addEmpresa({
    nombre: 'Distribuidora Frutos del Valle',
    email: 'ventas@frutosdelvalle.mx',
    password: '123456',
    contacto: '55 8765 4321',
    ubicacion: 'Toluca, Estado de México',
  });

  const org1 = addOrg({
    nombre: 'Centro de Acopio Pelusas',
    email: 'laura@pelusas.org',
    password: '123456',
    contacto: '722 111 2233',
    ubicacion: 'Toluca, Estado de México',
    capacidad: '200 kg / semana',
  });
  const org2 = addOrg({
    nombre: 'Comedor Comunitario Esperanza',
    email: 'contacto@esperanza.org',
    password: '123456',
    contacto: '722 444 5566',
    ubicacion: 'Metepec, Estado de México',
    capacidad: '80 kg / semana',
  });

  addAnuncio({
    tipo: 'oferta',
    autorId: emp1.id,
    autorTipo: 'empresa',
    autorNombre: emp1.nombre,
    titulo: 'Pan de caja excedente de producción',
    uso: 'Consumo directo, apto para comedores comunitarios.',
    cantidad: 120,
    unidad: 'piezas',
    ubicacion: emp1.ubicacion,
    tiempoEntrega: 'Recolección en 24 horas',
  });
  addAnuncio({
    tipo: 'oferta',
    autorId: emp2.id,
    autorTipo: 'empresa',
    autorNombre: emp2.nombre,
    titulo: 'Fruta y verdura de segunda calidad',
    uso: 'Consumo inmediato, revisar antes de repartir.',
    cantidad: 300,
    unidad: 'kg',
    ubicacion: emp2.ubicacion,
    tiempoEntrega: 'Disponible hoy, entrega en 48 horas',
  });
  addAnuncio({
    tipo: 'solicitud',
    autorId: org1.id,
    autorTipo: 'organizacion',
    autorNombre: org1.nombre,
    titulo: 'Se buscan abarrotes no perecederos',
    uso: 'Despensas mensuales para 40 familias.',
    cantidad: 150,
    unidad: 'kg',
    ubicacion: org1.ubicacion,
    tiempoEntrega: 'Cualquier fecha del mes',
  });
  addAnuncio({
    tipo: 'solicitud',
    autorId: org2.id,
    autorTipo: 'organizacion',
    autorNombre: org2.nombre,
    titulo: 'Ingredientes para comedor comunitario',
    uso: 'Preparación de comidas calientes diarias.',
    cantidad: 100,
    unidad: 'kg',
    ubicacion: org2.ubicacion,
    tiempoEntrega: 'Entregas semanales',
  });

  localStorage.setItem(KEYS.seeded, '1');
}
