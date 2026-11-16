// Aviso de "agregar a inicio". Safari en iPhone no tiene botón de instalar: solo se puede explicar el gesto.
// Edge y Chrome ofrecen un evento (beforeinstallprompt) y ahí sí hay botón.

// 'ios' = explicar el gesto · 'prompt' = botón de instalar · null = no mostrar nada.
export function tipoAviso({ ua = '', plataforma = '', puntos = 0, standalone = false, hayPrompt = false, cerrado = false }) {
  if (standalone || cerrado) return null;
  if (hayPrompt) return 'prompt';
  const ios = /iPhone|iPad|iPod/.test(ua) || (plataforma === 'MacIntel' && puntos > 1); // iPadOS se hace pasar por Mac
  return ios ? 'ios' : null;
}

export function estaInstalada() {
  return navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
}

// Escucha el evento de instalación y guarda el pedido para usarlo cuando el usuario toque el botón.
export function crearInstalador(alCambiar) {
  let pedido = null;
  addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); pedido = e; alCambiar(); });
  addEventListener('appinstalled', () => { pedido = null; alCambiar(); });
  return {
    hayPrompt: () => !!pedido,
    async instalar() {
      if (!pedido) return;
      pedido.prompt();
      await pedido.userChoice.catch(() => {});
      pedido = null;
      alCambiar();
    },
  };
}
