import type { ReactNode } from 'react';

export type BadgeTone = 'cyan' | 'amber' | 'green' | 'red' | 'slate';

const TONE_CLASSES: Record<BadgeTone, string> = {
  cyan: 'bg-cyan-100 text-cyan-700',
  amber: 'bg-amber-100 text-amber-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  slate: 'bg-surface-overlay text-text-subtle',
};

const SPINNER_CLASSES: Record<BadgeTone, string> = {
  cyan: 'border-cyan-700/30 border-t-cyan-700',
  amber: 'border-amber-700/30 border-t-amber-700',
  green: 'border-green-700/30 border-t-green-700',
  red: 'border-red-700/30 border-t-red-700',
  slate: 'border-text-subtle/30 border-t-text-subtle',
};

interface BadgeProps {
  tone: BadgeTone;
  mono?: boolean;
  /** Menampilkan cincin berputar di depan label — dipakai untuk status "Diproses" */
  spinning?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function Badge({
  tone,
  mono = false,
  spinning = false,
  icon,
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex h-6 shrink-0 items-center gap-1.5 rounded-sm px-[9px] text-[11px] font-semibold leading-none ${mono ? 'font-mono text-[10.5px]' : 'font-sans'} ${TONE_CLASSES[tone]} ${className}`}
    >
      {spinning ? (
        <span
          aria-hidden="true"
          className={`size-[11px] shrink-0 animate-spin rounded-full border-[1.5px] ${SPINNER_CLASSES[tone]}`}
        />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
    </span>
  );
}
