import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../shared/lib/useFocusTrap';

interface SheetProps {
  isOpen: boolean;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  isDismissible?: boolean;
  onClose: () => void;
}

export default function Sheet({
  isOpen,
  title,
  description,
  children,
  footer,
  isDismissible = true,
  onClose,
}: SheetProps) {
  const titleId = useId();
  const descriptionId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useFocusTrap({
    isOpen,
    containerRef: sheetRef,
    initialFocusRef: closeButtonRef,
    canDismiss: isDismissible,
    onDismiss: onClose,
  });

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex justify-end bg-surface-inverse/32 animate-in fade-in duration-200"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && isDismissible) onClose();
      }}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="flex h-full w-full max-w-[480px] flex-col border-l border-border-subtle bg-surface-raised shadow-[-12px_0_32px_rgb(15_23_42/12%)] animate-in slide-in-from-right duration-300"
      >
        <header className="flex items-start justify-between gap-3 border-b border-border-subtle px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-[15px] font-semibold text-text-primary">
              {title}
            </h2>
            {description && (
              <div id={descriptionId} className="mt-1 text-xs leading-[1.5] text-text-muted">
                {description}
              </div>
            )}
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Tutup panel"
            disabled={!isDismissible}
            onClick={onClose}
            className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-border-subtle text-text-muted transition-colors hover:bg-surface-base hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary-strong/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={15} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {children}
        </div>

        {footer && (
          <footer className="border-t border-border-subtle px-5 py-3.5">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
