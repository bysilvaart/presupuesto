import { ReactElement, cloneElement, useCallback, useEffect, useId, useMemo, useState, MouseEvent } from 'react';
import { createPortal } from 'react-dom';

type TriggerElement = ReactElement<{ onClick?: (event: MouseEvent<HTMLElement>) => void }>;

interface ConfirmDialogProps {
  title: string;
  description: string;
  trigger: TriggerElement;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
}

const ConfirmDialog = ({
  title,
  description,
  trigger,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm
}: ConfirmDialogProps) => {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dialogId = useId();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!open || typeof document === 'undefined') {
      return;
    }

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const close = useCallback(() => setOpen(false), []);
  const confirm = useCallback(() => {
    onConfirm();
    setOpen(false);
  }, [onConfirm]);

  const overlay = useMemo(() => {
    if (!mounted || !open || typeof document === 'undefined') {
      return null;
    }

    const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        close();
      }
    };

    return createPortal(
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        role="presentation"
        onClick={handleOverlayClick}
      >
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${dialogId}-title`}
          aria-describedby={`${dialogId}-description`}
          className="relative z-10 w-[90vw] max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-soft focus:outline-none"
        >
          <h2 id={`${dialogId}-title`} className="text-lg font-semibold">
            {title}
          </h2>
          <p id={`${dialogId}-description`} className="mt-2 text-sm text-slate-400">
            {description}
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
              onClick={close}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              onClick={confirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }, [mounted, open, dialogId, title, description, cancelLabel, confirmLabel, close, confirm]);

  const triggerWithHandlers = useMemo(() => {
    return cloneElement(trigger, {
      onClick: (event: MouseEvent<HTMLElement>) => {
        trigger.props.onClick?.(event);
        setOpen(true);
      },
      'aria-haspopup': 'dialog',
      'aria-expanded': open,
      'aria-controls': open ? dialogId : undefined
    });
  }, [trigger, open, dialogId]);

  return (
    <>
      {triggerWithHandlers}
      {overlay}
    </>
  );
};

export default ConfirmDialog;
