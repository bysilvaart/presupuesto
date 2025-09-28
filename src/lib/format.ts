import { Suscripcion } from '@/db/dexie';

export const formatCLP = (value: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(value);

export const derivePrecioMesSuscripcion = (suscripcion: Suscripcion) => {
  if (suscripcion.periodicidad === 'Anual') {
    return Math.round(suscripcion.precioCiclo / 12);
  }
  return suscripcion.precioCiclo;
};

export const aporteMensualSinking = (montoAnual: number) => Math.round(montoAnual / 12);
