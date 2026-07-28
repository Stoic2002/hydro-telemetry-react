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
    <div className="flex h-11 items-center justify-between gap-3 self-end rounded-xl border border-slate-200 px-4">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={isActive}
        aria-label={`${label}: ${statusLabel}`}
        disabled={disabled}
        onClick={() => onChange(!isActive)}
        className={`flex cursor-pointer items-center gap-2 rounded-full border px-2 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#0891b2]/40 disabled:cursor-not-allowed disabled:opacity-60 ${isActive ? 'border-[#0891b2] bg-[#0891b2] text-white' : 'border-slate-200 bg-slate-100 text-slate-500'}`}
      >
        <span className={`relative h-5 w-9 rounded-full ${isActive ? 'bg-white/35' : 'bg-slate-300'}`}>
          <span className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform ${isActive ? 'translate-x-4' : 'translate-x-0'}`} />
        </span>
        <span>{statusLabel}</span>
      </button>
    </div>
  );
}
