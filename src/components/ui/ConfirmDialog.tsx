import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Button from '../atoms/Button';
import { useFocusTrap } from '../../shared/lib/useFocusTrap';

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
    icon: 'bg-red-100 text-red-600',
    button: 'danger',
  },
  warning: {
    icon: 'bg-amber-100 text-amber-600',
    button: 'primary',
  },
  primary: {
    icon: 'bg-cyan-100 text-brand-primary-strong',
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

  useFocusTrap({
    isOpen,
    containerRef: dialogRef,
    initialFocusRef: cancelButtonRef,
    canDismiss: !isConfirming,
    onDismiss: onClose,
  });

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-surface-inverse/32 p-4"
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
        className="w-full max-w-[360px] rounded-lg border border-border-subtle bg-surface-raised p-[22px] shadow-dialog"
      >
        <div className={`flex size-11 items-center justify-center rounded-full ${styles.icon}`}>
          {icon ?? <span aria-hidden="true" className="font-mono text-[18px] font-semibold leading-none">!</span>}
        </div>

        <h2 id={titleId} className="mt-3.5 text-base font-semibold text-text-primary">
          {title}
        </h2>
        <div
          id={descriptionId}
          className="mt-1.5 text-[12.5px] leading-[1.6] text-text-muted [&_strong]:font-semibold [&_strong]:text-text-secondary"
        >
          {description}
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
