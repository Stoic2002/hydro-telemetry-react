import { X } from 'lucide-react';
import { useNotificationStore } from '../../store/notification-store';

// Garis warna di tepi kiri adalah penanda tipe notifikasi, bukan hiasan di atas kartu.
const accents = {
  success: 'border-l-status-success-strong',
  error: 'border-l-status-danger-strong',
  warning: 'border-l-status-warning-strong',
  info: 'border-l-status-info',
};

export default function Toast() {
  const { toasts, removeToast } = useNotificationStore();

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[300] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.type === 'error' ? 'alert' : 'status'}
          className={`pointer-events-auto flex w-[280px] items-start gap-3 rounded-xl border border-l-[3px] border-border-subtle bg-white px-3.5 py-3 shadow-panel animate-in slide-in-from-top-2 fade-in duration-300 ${accents[toast.type]}`}
        >
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-semibold text-slate-900">{toast.message}</p>
            {toast.description && (
              <p className="mt-0.5 text-[11.5px] leading-[1.5] text-slate-500">{toast.description}</p>
            )}
          </div>
          <button
            type="button"
            aria-label="Tutup notifikasi"
            className="-mr-1 shrink-0 cursor-pointer rounded-sm p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary-strong/40"
            onClick={() => removeToast(toast.id)}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
