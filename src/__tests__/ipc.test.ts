import { describe, expect, it } from 'vitest';
import { calcularAjusteIPC } from '@/lib/ipc';

describe('IPC helpers', () => {
  it('ajusta monto según índice', () => {
    expect(calcularAjusteIPC(400000, 100, 110)).toBe(440000);
  });

  it('usa base si no hay índice actual', () => {
    expect(calcularAjusteIPC(400000, 100, undefined)).toBe(400000);
  });
});
