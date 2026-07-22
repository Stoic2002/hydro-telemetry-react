import React, { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id || `input-${generatedId}`;

  return (
    <div className={`flex w-full min-w-0 flex-col gap-2 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-slate-500">
          {label}
        </label>
      )}
      
      <div className="relative flex min-w-0 items-center">
        {leftIcon && (
          <div className="absolute left-3 text-slate-400 pointer-events-none">
            {leftIcon}
          </div>
        )}
        
        <input
          id={inputId}
          className={`
            h-11 w-full rounded-xl border bg-white px-3.5 py-0 text-sm text-slate-800
            outline-none transition-[border-color,box-shadow,background-color] duration-200
            placeholder:text-slate-400
            hover:border-slate-300 focus:border-brand-primary-strong focus:ring-2 focus:ring-brand-primary-strong/15
            disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-200'}
          `}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3 text-slate-400 pointer-events-none">
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <span className="text-xs text-red-500 font-medium">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-slate-500">{helperText}</span>
      ) : null}
    </div>
  );
}
