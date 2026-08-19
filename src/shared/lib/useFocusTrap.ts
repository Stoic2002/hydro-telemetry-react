import { useEffect, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

interface UseFocusTrapOptions {
  isOpen: boolean;
  /** Elemen yang membungkus konten overlay. */
  containerRef: RefObject<HTMLElement | null>;
  /** Menerima fokus saat overlay terbuka. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Saat false, Escape diabaikan; dipakai selama aksi sedang berjalan. */
  canDismiss?: boolean;
  onDismiss: () => void;
}

/**
 * Perilaku standar overlay modal: kunci fokus di dalam container, kunci scroll
 * halaman, tutup dengan Escape, lalu kembalikan fokus ke elemen pemicu.
 *
 * Sebelumnya blok ini disalin utuh di `Sheet` dan `ConfirmDialog`, sehingga
 * setiap perbaikan perilaku fokus harus dikerjakan dua kali.
 */
export function useFocusTrap({
  isOpen,
  containerRef,
  initialFocusRef,
  canDismiss = true,
  onDismiss,
}: UseFocusTrapOptions): void {
  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocusedElement = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    initialFocusRef?.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && canDismiss) {
        event.preventDefault();
        onDismiss();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements =
        containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);

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
  }, [canDismiss, containerRef, initialFocusRef, isOpen, onDismiss]);
}
