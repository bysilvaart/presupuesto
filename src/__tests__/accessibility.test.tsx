import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuickAddPage from '@/pages/capturar/QuickAddPage';
import { budgetDB } from '@/db/dexie';

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: () => []
}));

vi.mock('@/hooks/useOfflineQueue', () => ({
  useOfflineQueue: () => ({ pendingCount: 0, enqueue: vi.fn() })
}));

describe('accesibilidad', () => {
  it('mantiene orden de foco en captura rápida', async () => {
    const addMock = vi.spyOn(budgetDB.movimientos, 'add').mockResolvedValue(undefined as any);
    render(<QuickAddPage />);
    const user = userEvent.setup();
    const buttons = screen.getAllByRole('tab');
    expect(buttons[0]).toHaveAccessibleName('Gasto');
    await user.tab();
    expect(document.activeElement).toBe(buttons[0]);
    await user.keyboard('{ArrowRight}');
    expect(buttons[1]).toHaveAttribute('aria-selected', 'true');
    addMock.mockRestore();
  });
});
