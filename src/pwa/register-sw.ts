export const registerSW = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return;
  }

  if (!('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    const base = import.meta.env.BASE_URL;

    navigator.serviceWorker
      .register(`${base}sw.js`, { scope: base })
      .catch((error) => {
        console.error('Error registrando Service Worker', error);
      });
  });
};
