// js/detalle-page.js
// Arranque de la página oferta-detalle.html: siembra datos de ejemplo,
// dibuja el encabezado y delega el resto en js/detalle.js.

import { seedIfEmpty } from './data.js';
import { renderHeader } from './nav.js';
import { initDetalle } from './detalle.js';

seedIfEmpty();
renderHeader();
initDetalle();
