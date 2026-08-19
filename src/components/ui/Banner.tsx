import type { ReactNode } from 'react';

export type BannerTone = 'info' | 'warning' | 'danger' | 'success';

const TONE_CONFIG: Record<BannerTone, {
  container: string;
  marker: string;
  title: string;
  body: string;
}> = {
  info: {
    container: 'border-sky-200 bg-sky-50',
    marker: 'bg-sky-400 text-sky-950',
    title: 'text-sky-900',
    body: 'text-sky-800',
  },
  warning: {
    container: 'border-amber-200 bg-amber-50',
    marker: 'bg-status-warning text-amber-950',
    title: 'text-amber-900',
    body: 'text-amber-700',
  },
  danger: {
    container: 'border-red-200 bg-red-50',
    marker: 'bg-status-danger text-red-950',
    title: 'text-red-900',
    body: 'text-red-700',
  },
  success: {
    container: 'border-green-200 bg-green-50',
    marker: 'bg-status-success text-green-950',
    title: 'text-green-900',
    body: 'text-green-700',
  },
};

interface BannerProps {
  tone: BannerTone;
  /** Judul singkat; isi banner masuk ke `children` sebagai kalimat penjelas. */
  title?: string;
  children: ReactNode;
  /** Mengganti penanda bulat bawaan, misalnya dengan ikon lucide. */
  icon?: ReactNode;
  className?: string;
}

export default function Banner({ tone, title, children, icon, className = '' }: BannerProps) {
  const config = TONE_CONFIG[tone];

  return (
    <div
      role={tone === 'danger' ? 'alert' : undefined}
      className={`flex items-start gap-2.5 rounded-md border px-3.5 py-3 ${config.container} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`mt-px flex size-[18px] shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold ${config.marker}`}
      >
        {icon ?? '!'}
      </span>
      <div className="min-w-0 flex-1">
        {title && <p className={`text-[12.5px] font-semibold ${config.title}`}>{title}</p>}
        <div className={`${title ? 'mt-0.5' : ''} text-[11.5px] leading-[1.6] ${config.body}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
