// Voz: decir un texto en inglés con una voz del dispositivo. Las voces dependen del teléfono o la PC.
// En iPhone solo funciona después de un toque del usuario.
export function crearVoz() {
  const hay = 'speechSynthesis' in globalThis && 'SpeechSynthesisUtterance' in globalThis;
  const voces = () => (hay ? speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en')) : []);
  return {
    // Chrome y Edge cargan las voces tarde: con la lista todavía vacía no se sabe, y no se avisa de más.
    disponible: () => hay && (voces().length > 0 || speechSynthesis.getVoices().length === 0),
    decir(texto, { lengua = 'en-US', velocidad = 0.9 } = {}) {
      if (!hay) return false;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(texto);
      u.lang = lengua;
      u.rate = velocidad;
      const voz = voces().find((v) => v.lang === lengua) || voces()[0];
      if (voz) u.voice = voz;
      speechSynthesis.speak(u);
      return true;
    },
    callar() { if (hay) speechSynthesis.cancel(); },
  };
}
