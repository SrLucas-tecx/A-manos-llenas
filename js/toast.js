// js/toast.js
// Utilidad compartida para mostrar mensajes flotantes (toasts).

export function toast(mensaje, tipo = 'ok') {
  let stack = document.querySelector('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  const el = document.createElement('div');
  el.className = 'toast' + (tipo === 'err' ? ' err' : '');
  el.textContent = mensaje;
  stack.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .4s ease';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 400);
  }, 2600);
}
