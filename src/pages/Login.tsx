import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuthStore } from '../store/auth-store';
import Button from '../components/atoms/Button';
import Banner from '../components/ui/Banner';

const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: { username: '', password: '' },
  });

  const submitLogin = async ({ username, password }: LoginFormValues) => {
    clearError();
    const success = await login(username, password);
    if (success) {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-surface-base font-sans overflow-x-hidden p-6">
      {/* Background Subtle Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(#22d3ee 1px, transparent 1px), linear-gradient(90deg, #22d3ee 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      <div className="relative z-10 flex w-fit h-fit flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Logo & Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="size-14 flex items-center justify-center shrink-0 bg-transparent rounded-[10px]">
            <img src="/logo.png" alt="PLN Logo" className="w-14 h-14 object-contain" />
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <h1 className="text-text-primary font-display text-xl font-bold leading-normal tracking-[-0.5px] text-center">
              PLTA Monitoring
            </h1>
            <p className="text-text-muted font-sans text-[13px] leading-normal text-center">
              Telemetering · Forecasting · Reporting
            </p>
          </div>
        </div>

        {/* Card Form */}
        <form 
          onSubmit={handleSubmit(submitLogin)}
          className="flex h-fit w-full flex-col gap-5 rounded-2xl border border-border-subtle bg-surface-raised p-8 sm:w-[400px]"
        >
          <div className="flex flex-col gap-1.5">
            <h2 className="text-text-primary font-display text-xl font-semibold leading-normal tracking-[-0.5px]">
              Masuk ke akun Anda
            </h2>
            <p className="text-text-muted font-sans text-sm leading-normal">
              Gunakan kredensial operator yang terdaftar.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <Banner tone="danger">{error}</Banner>
          )}

          {/* Username Field */}
          <div className="flex w-full h-fit flex-col gap-2">
            <label htmlFor="username" className="text-text-secondary font-sans text-[13px] font-medium leading-normal">
              Username
            </label>
            <div className="flex w-full h-12 items-center bg-surface-base border border-border-subtle rounded-[10px] px-4 py-0 gap-3 focus-within:ring-[3px] focus-within:ring-brand-primary-strong/15 focus-within:border-brand-primary-strong transition-all duration-200">
              <User size={16} className="text-text-muted shrink-0" />
              <input
                id="username"
                type="text"
                placeholder="contoh: budi.santoso"
                {...register('username', { onChange: clearError })}
                aria-invalid={Boolean(errors.username)}
                className="w-full bg-transparent border-none outline-none text-text-primary placeholder:text-text-muted font-sans text-sm leading-normal"
                autoComplete="username"
              />
            </div>
            {errors.username && (
              <span className="text-xs font-medium text-status-danger">{errors.username.message}</span>
            )}
          </div>

          {/* Password Field */}
          <div className="flex w-full h-fit flex-col gap-2">
            <label htmlFor="password" className="text-text-secondary font-sans text-[13px] font-medium leading-normal">
              Password
            </label>
            <div className="flex w-full h-12 items-center bg-surface-base border border-border-subtle rounded-[10px] px-4 py-0 gap-3 focus-within:ring-[3px] focus-within:ring-brand-primary-strong/15 focus-within:border-brand-primary-strong transition-all duration-200">
              <Lock size={16} className="text-text-muted shrink-0" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password', { onChange: clearError })}
                aria-invalid={Boolean(errors.password)}
                className="w-full bg-transparent border-none outline-none text-text-primary placeholder:text-text-muted font-sans text-sm leading-normal tracking-[1.4px]"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-text-muted hover:text-text-secondary transition-colors focus:outline-none"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <span className="text-xs font-medium text-status-danger">{errors.password.message}</span>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={!isValid}
            className="h-12 w-full rounded-md text-[15px]"
          >
            Masuk
          </Button>
        </form>

        <footer className="mt-4 text-[11px] font-medium uppercase tracking-[0.14em] text-text-muted">
          PLN Indonesia Power © 2026
        </footer>
      </div>
    </div>
  );
}
