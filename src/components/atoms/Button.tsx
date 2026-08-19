import React, { forwardRef } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = 'primary',
  size = 'md',
  isLoading,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}, ref) {
  // Tanpa bayangan: tombol dibedakan lewat isian dan border, bukan elevasi.
  const baseStyles =
    'inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap border font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50';

  const variants = {
    primary:
      'border-brand-primary-strong bg-brand-primary-strong text-white hover:border-brand-primary-pressed hover:bg-brand-primary-pressed focus-visible:ring-brand-primary-strong/40',
    secondary:
      'border-border-subtle bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-300/60',
    ghost:
      'border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-300/60',
    danger:
      'border-red-600 bg-red-600 text-white hover:border-red-700 hover:bg-red-700 focus-visible:ring-red-500/40',
    success:
      'border-green-600 bg-green-600 text-white hover:border-green-700 hover:bg-green-700 focus-visible:ring-green-500/40',
  };

  const sizes = {
    sm: 'h-8 rounded-sm px-3 text-[11.5px] gap-1.5',
    md: 'h-10 rounded-md px-4 text-[13px] gap-2',
    lg: 'h-11 rounded-md px-5 text-sm gap-2',
  };

  return (
    <button
      ref={ref}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span
            aria-hidden="true"
            className="size-[13px] shrink-0 animate-spin rounded-full border-2 border-current/30 border-t-current"
          />
          {children}
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
});

export default Button;
