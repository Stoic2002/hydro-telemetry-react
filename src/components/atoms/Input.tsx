import React, { useId } from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** `md` = kontrol standar 44px, `sm` = kontrol filter kompak 36px */
  size?: 'md' | 'sm';
}

const SIZE_STYLES = {
  md: 'h-11 rounded-md px-3.5 text-[13px]',
  sm: 'h-9 rounded-sm px-3 text-xs',
} as const;

const ICON_PADDING = {
  md: { left: 'pl-10', right: 'pr-10' },
  sm: { left: 'pl-8.5', right: 'pr-8.5' },
} as const;

export default function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  size = 'md',
  className = '',
  id,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id || `input-${generatedId}`;

  return (
    <div className={`flex w-full min-w-0 flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="field-label">
          {label}
        </label>
      )}

      <div className="relative flex min-w-0 items-center">
        {leftIcon && (
          <div className={`pointer-events-none absolute text-slate-400 ${size === 'md' ? 'left-3.5' : 'left-3'}`}>
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          className={`
            w-full border bg-white py-0 text-slate-800
            outline-none transition-[border-color,box-shadow,background-color] duration-150
            placeholder:text-slate-400
            hover:border-slate-300
            focus:border-brand-primary-strong focus:ring-[3px] focus:ring-brand-primary-strong/15
            disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-slate-50 disabled:text-slate-400
            ${SIZE_STYLES[size]}
            ${leftIcon ? ICON_PADDING[size].left : ''}
            ${rightIcon ? ICON_PADDING[size].right : ''}
            ${error ? 'border-status-danger focus:border-status-danger-strong focus:ring-status-danger/20' : 'border-border-subtle'}
          `}
          {...props}
        />

        {rightIcon && (
          <div className={`absolute text-slate-400 ${size === 'md' ? 'right-3.5' : 'right-3'}`}>
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <span className="text-[11.5px] font-medium text-status-danger-strong">{error}</span>
      ) : helperText ? (
        <span className="text-[11.5px] text-slate-500">{helperText}</span>
      ) : null}
    </div>
  );
}
