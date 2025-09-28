import { Movimiento } from '@/db/dexie';

const hormigaCategorias = ['Comida fuera', 'Ocio y suscripciones'];

export const isHormiga = (movimiento: Movimiento) => {
  if (movimiento.tipo !== 'Gasto') return false;
  if (movimiento.monto > 8000) return false;
  if (movimiento.categoria && hormigaCategorias.includes(movimiento.categoria)) {
    return true;
  }
  return movimiento.canal === 'Cafetería';
};

export const normalizeMerchant = (value: string) => value.toLowerCase().replace(/\s+/g, '');

export const matchRuleForMerchant = (merchant: string, patrones: string[]) => {
  const normalized = normalizeMerchant(merchant);
  return patrones.find((patron) => normalized.includes(patron));
};
