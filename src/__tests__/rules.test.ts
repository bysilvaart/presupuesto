import { describe, expect, it } from 'vitest';
import { isHormiga } from '@/lib/rules';
import { Movimiento } from '@/db/dexie';

describe('rules', () => {
  it('detecta gasto hormiga por categoría y monto', () => {
    const movimiento = {
      id: '1',
      fecha: new Date().toISOString(),
      tipo: 'Gasto',
      categoria: 'Comida fuera',
      monto: 3000,
      mes: '2024-01'
    } as Movimiento;
    expect(isHormiga(movimiento)).toBe(true);
  });

  it('ignora gastos altos', () => {
    const movimiento = {
      id: '2',
      fecha: new Date().toISOString(),
      tipo: 'Gasto',
      categoria: 'Comida fuera',
      monto: 12000,
      mes: '2024-01'
    } as Movimiento;
    expect(isHormiga(movimiento)).toBe(false);
  });
});
