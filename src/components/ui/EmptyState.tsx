import type { ReactNode } from 'react';

interface EmptyStateProps {
  /** Ikon netral, ditempatkan di dalam lingkaran abu. */
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

/**
 * State kosong. Bedakan kalimatnya: "belum ada data" untuk daftar yang memang
 * masih kosong, "tidak ditemukan" untuk hasil pencarian.
 */
export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center px-4.5 py-6.5 text-center ${className}`}>
      <div className="flex size-11 items-center justify-center rounded-full bg-surface-overlay text-slate-400">
        {icon}
      </div>
      <p className="mt-3 text-[13px] font-semibold text-slate-900">{title}</p>
      <p className="mt-1 max-w-xs text-[11.5px] leading-[1.6] text-slate-500">{description}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
