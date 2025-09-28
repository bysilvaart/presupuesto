import * as Dialog from '@radix-ui/react-dialog';
import { ReactNode } from 'react';

interface ConfirmDialogProps {
  title: string;
  description: string;
  trigger: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
}

const ConfirmDialog = ({ title, description, trigger, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', onConfirm }: ConfirmDialogProps) => (
  <Dialog.Root>
    <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" />
      <Dialog.Content className="fixed left-1/2 top-1/2 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-soft focus:outline-none">
        <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
        <Dialog.Description className="mt-2 text-sm text-slate-400">{description}</Dialog.Description>
        <div className="mt-6 flex justify-end gap-3">
          <Dialog.Close asChild>
            <button type="button" className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">
              {cancelLabel}
            </button>
          </Dialog.Close>
          <Dialog.Close asChild>
            <button
              type="button"
              className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </Dialog.Close>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);

export default ConfirmDialog;
