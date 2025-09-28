export const registerSW = async () => {
  try {
    const registration = await navigator.serviceWorker.register(
      `${import.meta.env.BASE_URL}sw.js`,
      { scope: import.meta.env.BASE_URL }
    );
    if ('pushManager' in registration) {
      // TODO: implementar suscripción Web Push (depende de backend y claves VAPID)
    }
  } catch (error) {
    console.error('Error registrando Service Worker', error);
  }
};
