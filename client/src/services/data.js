// src/services/data.js
// DATOS SIMULADOS (temporal) de anuncios, donaciones y notificaciones, guardados en localStorage.
// Los usuarios y la sesión ya NO están aquí: vienen del backend (ver services/auth.js).
// Cuando se programen los Sprints 2-4 en el backend, estas funciones se cambian por llamadas a /api.

const KEYS = {
  anuncios: 'aml_anuncios',
  donaciones: 'aml_donaciones',
  notificaciones: 'aml_notificaciones',
  seeded: 'aml_seeded_v2',
};

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

function guardarEnLista(key, item) {
  const list = readJSON(key, []);
  const i = list.findIndex((x) => x.id === item.id);
  if (i >= 0) list[i] = item;
  else list.push(item);
  writeJSON(key, list);
  return item;
}

/* ---------------- Anuncios (ofertas / solicitudes) — Sprint 2 ---------------- */
export function getAnuncios() {
  return readJSON(KEYS.anuncios, []);
}
export function getAnuncio(id) {
  return getAnuncios().find((a) => a.id === id) || null;
}
export function saveAnuncio(anuncio) {
  return guardarEnLista(KEYS.anuncios, anuncio);
}
export function addAnuncio(data) {
  return saveAnuncio({
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
  });
}

/* ---------------- Donaciones — Sprint 2 ---------------- */
export function getDonaciones() {
  return readJSON(KEYS.donaciones, []);
}
export function saveDonacion(don) {
  return guardarEnLista(KEYS.donaciones, don);
}
// contraparte = la sesión de quien reclama el anuncio ({ id, nombre })
export function crearDonacionDesdeAnuncio(anuncio, contraparte) {
  const autorEsEmpresa = anuncio.autorTipo === 'empresa';
  const don = saveDonacion({
    id: uid('don'),
    anuncioId: anuncio.id,
    empresaId: autorEsEmpresa ? anuncio.autorId : contraparte.id,
    empresaNombre: autorEsEmpresa ? anuncio.autorNombre : contraparte.nombre,
    orgId: autorEsEmpresa ? contraparte.id : anuncio.autorId,
    orgNombre: autorEsEmpresa ? contraparte.nombre : anuncio.autorNombre,
    estado: 'en_curso', // en_curso | entregado | calificado
    calificacion: null,
    createdAt: Date.now(),
  });
  saveAnuncio({ ...anuncio, estado: 'reclamado' });
  return don;
}
export function calificarDonacion(donId, calificacion) {
  const don = getDonaciones().find((d) => d.id === donId);
  if (!don) return null;
  saveDonacion({ ...don, calificacion, estado: 'calificado' }); // { puntuacion, comentario, deficiente }

  const anuncio = getAnuncio(don.anuncioId);
  if (anuncio) saveAnuncio({ ...anuncio, estado: 'completado' });
  return don;
}

/* ---------------- Notificaciones — Sprint 4 ---------------- */
export function getNotificaciones(destinatarioId) {
  return readJSON(KEYS.notificaciones, [])
    .filter((n) => n.destinatarioId === destinatarioId)
    .sort((a, b) => b.createdAt - a.createdAt);
}
export function addNotificacion({ destinatarioId, titulo, mensaje }) {
  const list = readJSON(KEYS.notificaciones, []);
  list.push({ id: uid('not'), destinatarioId, titulo, mensaje, leida: false, createdAt: Date.now() });
  writeJSON(KEYS.notificaciones, list);
}
export function marcarNotificacionesLeidas(destinatarioId) {
  const list = readJSON(KEYS.notificaciones, []);
  list.forEach((n) => {
    if (n.destinatarioId === destinatarioId) n.leida = true;
  });
  writeJSON(KEYS.notificaciones, list);
}

/* ---------------- Anuncios de ejemplo (solo la primera vez) ---------------- */
export function seedIfEmpty() {
  if (localStorage.getItem(KEYS.seeded)) return;

  const ejemplos = [
    ['oferta', 'empresa', 'Panificadora Trigo Dorado', 'Pan de caja excedente de producción', 'Consumo directo, apto para comedores comunitarios.', 120, 'piezas', 'Naucalpan, Estado de México', 'Recolección en 24 horas'],
    ['oferta', 'empresa', 'Distribuidora Frutos del Valle', 'Fruta y verdura de segunda calidad', 'Consumo inmediato, revisar antes de repartir.', 300, 'kg', 'Toluca, Estado de México', 'Disponible hoy, entrega en 48 horas'],
    ['solicitud', 'organizacion', 'Centro de Acopio Pelusas', 'Se buscan abarrotes no perecederos', 'Despensas mensuales para 40 familias.', 150, 'kg', 'Toluca, Estado de México', 'Cualquier fecha del mes'],
    ['solicitud', 'organizacion', 'Comedor Comunitario Esperanza', 'Ingredientes para comedor comunitario', 'Preparación de comidas calientes diarias.', 100, 'kg', 'Metepec, Estado de México', 'Entregas semanales'],
  ];
  ejemplos.forEach(([tipo, autorTipo, autorNombre, titulo, uso, cantidad, unidad, ubicacion, tiempoEntrega], i) =>
    addAnuncio({ tipo, autorId: `demo_${i}`, autorTipo, autorNombre, titulo, uso, cantidad, unidad, ubicacion, tiempoEntrega })
  );

  localStorage.setItem(KEYS.seeded, '1');
}
