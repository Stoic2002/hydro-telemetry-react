import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import Button from '../atoms/Button';

type ConfirmDialogVariant = 'danger' | 'warning' | 'primary';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  icon?: ReactNode;
  isConfirming?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const variantStyles: Record<ConfirmDialogVariant, {
  icon: string;
  button: 'danger' | 'primary';
}> = {
  danger: {
    icon: 'bg-red-50 text-red-600 ring-red-100',
    button: 'danger',
  },
  warning: {
    icon: 'bg-amber-50 text-amber-600 ring-amber-100',
    button: 'primary',
  },
  primary: {
    icon: 'bg-cyan-50 text-brand-primary-strong ring-cyan-100',
    button: 'primary',
  },
};

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  variant = 'danger',
  icon,
  isConfirming = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const styles = variantStyles[variant];

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocusedElement = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cancelButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isConfirming) {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocusedElement?.focus();
    };
  }, [isConfirming, isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isConfirming) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-[440px] overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_24px_70px_-20px_rgba(15,23,42,0.45)]"
      >
        <div className="flex items-start gap-4 px-6 pt-6 pb-5">
          <div className={`flex size-11 shrink-0 items-center justify-center rounded-full ring-4 ${styles.icon}`}>
            {icon ?? <AlertTriangle size={21} strokeWidth={2.25} />}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <h2 id={titleId} className="font-display text-lg font-bold tracking-[-0.02em] text-slate-900">
              {title}
            </h2>
            <div id={descriptionId} className="mt-2 text-sm leading-6 text-slate-600">
              {description}
            </div>
          </div>

          <button
            type="button"
            aria-label="Tutup dialog"
            disabled={isConfirming}
            onClick={onClose}
            className="-mr-1 -mt-1 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary-strong/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col-reverse gap-2.5 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex-row sm:justify-end">
          <Button
            ref={cancelButtonRef}
            type="button"
            variant="secondary"
            disabled={isConfirming}
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={styles.button}
            isLoading={isConfirming}
            onClick={onConfirm}
            className="w-full sm:w-auto"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
