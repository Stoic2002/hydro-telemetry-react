interface SegmentedControlOption<T extends string | number> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string | number> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedControlOption<T>[];
  ariaLabel: string;
}

export default function SegmentedControl<T extends string | number>({
  value,
  onChange,
  options,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex shrink-0 items-center gap-1 rounded-md bg-surface-overlay p-1"
    >
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.value)}
            className={`flex h-9 cursor-pointer items-center whitespace-nowrap rounded-sm px-3.5 text-[12.5px] transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary-strong/30 ${
              isActive
                ? 'border border-border-subtle bg-white font-semibold text-brand-primary-strong'
                : 'border border-transparent font-medium text-slate-600 hover:text-text-primary'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
