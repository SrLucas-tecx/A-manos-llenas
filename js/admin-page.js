// js/admin-page.js
// Arranque de admin.html: exige sesión de tipo "admin" y delega en js/admin.js.

import { seedIfEmpty } from './data.js';
import { requerirSesion } from './auth.js';
import { renderHeader } from './nav.js';
import { initAdmin } from './admin.js';

seedIfEmpty();
const session = requerirSesion(['admin']);
if (session) {
  renderHeader();
  initAdmin();
}
