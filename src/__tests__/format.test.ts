import { describe, expect, it } from 'vitest';
import { derivePrecioMesSuscripcion, formatCLP } from '@/lib/format';
import { Suscripcion } from '@/db/dexie';

describe('format helpers', () => {
  it('formatea CLP sin decimales', () => {
    expect(formatCLP(12500)).toBe('CLP\xa012.500');
  });

  it('calcula precio mensual para anual', () => {
    const suscripcion = {
      id: '1',
      servicio: 'Test',
      periodicidad: 'Anual',
      precioCiclo: 120000,
      categoria: 'Ocio y suscripciones',
      renuevaEl: new Date().toISOString(),
      estado: 'Activa',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Suscripcion;
    expect(derivePrecioMesSuscripcion(suscripcion)).toBe(10000);
  });
});
