import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  leadingIcon?: ReactNode;
  controlSize?: 'sm' | 'md';
  controlClassName?: string;
}

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

function optionIndexByValue(options: SelectOption[], value: string) {
  return options.findIndex((option) => String(option.value) === value);
}

function nextEnabledOption(
  options: SelectOption[],
  currentIndex: number,
  direction: 1 | -1,
) {
  if (options.length === 0) return -1;

  let nextIndex = currentIndex;
  for (let attempt = 0; attempt < options.length; attempt += 1) {
    nextIndex = (nextIndex + direction + options.length) % options.length;
    if (!options[nextIndex]?.disabled) return nextIndex;
  }

  return -1;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({
  label,
  error,
  helperText,
  options,
  leadingIcon,
  controlSize = 'md',
  controlClassName = '',
  className = '',
  id,
  disabled,
  value,
  defaultValue,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...props
}, forwardedRef) {
  const generatedId = useId();
  const selectId = id || `select-${generatedId}`;
  const triggerId = `${selectId}-trigger`;
  const listboxId = `${selectId}-listbox`;
  const messageId = `${selectId}-message`;
  const isCompact = controlSize === 'sm';
  const isControlled = value !== undefined;
  const initialValue = String(
    defaultValue
      ?? options.find((option) => !option.disabled)?.value
      ?? '',
  );
  const [uncontrolledValue, setUncontrolledValue] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const selectedValue = String(isControlled ? value ?? '' : uncontrolledValue);
  const selectedOption = options.find((option) => String(option.value) === selectedValue)
    ?? options.find((option) => !option.disabled);

  const setSelectRef = useCallback((node: HTMLSelectElement | null) => {
    selectRef.current = node;
    if (typeof forwardedRef === 'function') forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  }, [forwardedRef]);

  const updateDropdownPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
      maxHeight: Math.max(120, window.innerHeight - rect.bottom - 24),
    });
  }, []);

  const closeDropdown = useCallback((restoreFocus = false) => {
    setIsOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  const openDropdown = useCallback(() => {
    if (disabled || options.length === 0) return;
    updateDropdownPosition();
    setHighlightedIndex(Math.max(optionIndexByValue(options, selectedValue), 0));
    setIsOpen(true);
  }, [disabled, options, selectedValue, updateDropdownPosition]);

  const selectOption = useCallback((option: SelectOption) => {
    if (option.disabled) return;

    const nextValue = String(option.value);
    const select = selectRef.current;
    if (select) {
      select.value = nextValue;
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (!isControlled) setUncontrolledValue(nextValue);
    closeDropdown(true);
  }, [closeDropdown, isControlled]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !listboxRef.current?.contains(target)) {
        closeDropdown();
      }
    };

    window.addEventListener('resize', updateDropdownPosition);
    window.addEventListener('scroll', updateDropdownPosition, true);
    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, true);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [closeDropdown, isOpen, updateDropdownPosition]);

  useEffect(() => {
    const select = selectRef.current;
    const form = select?.form;
    if (!select || !form || isControlled) return undefined;

    const handleReset = () => {
      window.setTimeout(() => setUncontrolledValue(select.value), 0);
    };

    form.addEventListener('reset', handleReset);
    return () => form.removeEventListener('reset', handleReset);
  }, [isControlled]);

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      openDropdown();
    }
  };

  const handleListboxKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDropdown(true);
      return;
    }

    if (event.key === 'Tab') {
      closeDropdown();
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((currentIndex) => nextEnabledOption(
        options,
        currentIndex,
        event.key === 'ArrowDown' ? 1 : -1,
      ));
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const startIndex = event.key === 'Home' ? -1 : 0;
      const direction = event.key === 'Home' ? 1 : -1;
      setHighlightedIndex(nextEnabledOption(options, startIndex, direction));
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const option = options[highlightedIndex];
      if (option) selectOption(option);
    }
  };

  useEffect(() => {
    if (isOpen) listboxRef.current?.focus();
  }, [isOpen]);

  return (
    <div ref={rootRef} className={`group/select flex min-w-0 w-full flex-col gap-2 ${className}`}>
      {label && (
        <label htmlFor={triggerId} className="text-xs font-semibold text-slate-500">
          {label}
        </label>
      )}

      <div className="relative flex min-w-0 items-center">
        <select
          ref={setSelectRef}
          id={selectId}
          disabled={disabled}
          value={value}
          defaultValue={value === undefined ? defaultValue : undefined}
          hidden
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          ref={triggerRef}
          id={triggerId}
          type="button"
          role="combobox"
          aria-label={label ? undefined : ariaLabel}
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error || helperText ? messageId : ariaDescribedBy}
          disabled={disabled}
          onClick={() => (isOpen ? closeDropdown() : openDropdown())}
          onKeyDown={handleTriggerKeyDown}
          className={`peer flex min-w-0 w-full cursor-pointer items-center border bg-white font-semibold text-slate-800 outline-none transition-[border-color,box-shadow,background-color] duration-200 hover:border-slate-300 focus:border-brand-primary-strong focus:ring-2 focus:ring-brand-primary-strong/15 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 ${
            isCompact ? 'h-9 rounded-lg pr-10 text-xs' : 'h-11 rounded-xl pr-12 text-sm'
          } ${leadingIcon ? (isCompact ? 'pl-9' : 'pl-10') : isCompact ? 'pl-3' : 'pl-3.5'} ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
              : 'border-slate-200'
          } ${controlClassName}`}
        >
          {leadingIcon && (
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute left-3 text-slate-400 transition-colors group-focus-within/select:text-brand-primary-strong ${
                isCompact ? '[&>svg]:size-3.5' : '[&>svg]:size-4'
              }`}
            >
              {leadingIcon}
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-left">
            {selectedOption?.label ?? 'Pilih opsi'}
          </span>
        </button>

        <span
          aria-hidden="true"
          className={`pointer-events-none absolute right-2 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400 transition-colors peer-focus:border-cyan-200 peer-focus:bg-cyan-50 peer-focus:text-brand-primary-strong peer-disabled:bg-slate-100 ${
            isCompact ? 'size-6' : 'size-7'
          }`}
        >
          <ChevronDown
            className={`${isCompact ? 'size-3.5' : 'size-4'} transition-transform ${isOpen ? 'rotate-180' : ''}`}
            strokeWidth={2.2}
          />
        </span>
      </div>

      {isOpen && dropdownPosition && createPortal(
        <div
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-labelledby={label ? triggerId : undefined}
          tabIndex={-1}
          onKeyDown={handleListboxKeyDown}
          className="fixed z-[200] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_12px_32px_rgba(15,23,42,0.14)] outline-none"
          style={dropdownPosition}
        >
          {options.map((option, index) => {
            const optionValue = String(option.value);
            const isSelected = optionValue === selectedValue;
            const isHighlighted = index === highlightedIndex;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => selectOption(option)}
                className={`flex min-h-9 w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:text-slate-300 ${
                  isSelected
                    ? 'bg-cyan-50 font-semibold text-brand-primary-strong'
                    : isHighlighted
                      ? 'bg-slate-50 text-slate-900'
                      : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {isSelected && <Check className="size-4 shrink-0" strokeWidth={2.3} />}
              </button>
            );
          })}
        </div>,
        document.body,
      )}

      {(error || helperText) && (
        <span
          id={messageId}
          className={`text-xs font-medium ${error ? 'text-red-500' : 'text-slate-400'}`}
        >
          {error || helperText}
        </span>
      )}
    </div>
  );
});

export default Select;
