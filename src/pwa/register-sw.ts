export const registerSW = async () => {
  try {
    const registration = await navigator.serviceWorker.register(
      new URL('./service-worker.ts', import.meta.url),
      { type: 'module' }
    );
    if ('pushManager' in registration) {
      // TODO: implementar suscripción Web Push (depende de backend y claves VAPID)
    }
  } catch (error) {
    console.error('Error registrando Service Worker', error);
  }
};
