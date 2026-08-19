interface StatusToggleProps {
  isActive: boolean;
  onChange: (isActive: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export default function StatusToggle({
  isActive,
  onChange,
  label = 'Status akun',
  disabled = false,
}: StatusToggleProps) {
  const statusLabel = isActive ? 'Aktif' : 'Nonaktif';

  return (
    <div className="flex h-11 items-center justify-between gap-3 self-end rounded-md border border-border-subtle px-3.5">
      <span className="text-[13px] font-medium text-text-secondary">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={isActive}
        aria-label={`${label}: ${statusLabel}`}
        disabled={disabled}
        onClick={() => onChange(!isActive)}
        className={`flex cursor-pointer items-center gap-2 rounded-full border px-2 py-1 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary-strong/40 disabled:cursor-not-allowed disabled:opacity-60 ${isActive ? 'border-brand-primary-strong bg-brand-primary-strong text-white' : 'border-border-subtle bg-surface-overlay text-text-muted'}`}
      >
        <span className={`relative h-[18px] w-[34px] rounded-full ${isActive ? 'bg-surface-raised/35' : 'bg-disabled'}`}>
          <span className={`absolute top-0.5 left-0.5 size-3.5 rounded-full bg-surface-raised transition-transform ${isActive ? 'translate-x-4' : 'translate-x-0'}`} />
        </span>
        <span>{statusLabel}</span>
      </button>
    </div>
  );
}
