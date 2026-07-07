import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import { useAuthStore } from '../store/auth-store';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const success = await login(username, password);
    if (success) {
      navigate('/dashboard/overview');
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
          onSubmit={handleSubmit} 
          className="flex w-full sm:w-[400px] h-fit flex-col bg-surface-raised border border-border-subtle rounded-2xl p-8 gap-5"
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
            <div className="p-3 bg-status-danger/10 border border-status-danger/20 rounded-md text-status-danger text-sm font-medium animate-in fade-in">
              {error}
            </div>
          )}

          {/* Username Field */}
          <div className="flex w-full h-fit flex-col gap-2">
            <label htmlFor="username" className="text-text-secondary font-sans text-[13px] font-medium leading-normal">
              Username
            </label>
            <div className="flex w-full h-12 items-center bg-surface-base border border-border-subtle rounded-[10px] px-4 py-0 gap-3 focus-within:ring-1 focus-within:ring-brand-primary/50 focus-within:border-brand-primary transition-all duration-200">
              <User size={16} className="text-text-muted shrink-0" />
              <input
                id="username"
                type="text"
                placeholder="contoh: budi.santoso"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-transparent border-none outline-none text-text-primary placeholder:text-text-muted font-sans text-sm leading-normal"
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="flex w-full h-fit flex-col gap-2">
            <label htmlFor="password" className="text-text-secondary font-sans text-[13px] font-medium leading-normal">
              Password
            </label>
            <div className="flex w-full h-12 items-center bg-surface-base border border-border-subtle rounded-[10px] px-4 py-0 gap-3 focus-within:ring-1 focus-within:ring-brand-primary/50 focus-within:border-brand-primary transition-all duration-200">
              <Lock size={16} className="text-text-muted shrink-0" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-transparent border-none outline-none text-text-primary placeholder:text-text-muted font-sans text-sm leading-normal tracking-[1.4px]"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-text-muted hover:text-text-secondary transition-colors focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !username || !password}
            className="flex w-full h-12 justify-center items-center bg-brand-primary-strong hover:bg-brand-primary disabled:bg-brand-primary-strong/50 text-white hover:text-surface-base font-sans text-[15px] font-semibold leading-normal rounded-[10px] cursor-pointer disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Masuk'
            )}
          </button>

          {/* Forgot Password */}
          <div className="flex justify-center items-center">
            <span className="text-brand-primary hover:text-brand-primary/80 font-sans text-[13px] font-medium leading-normal cursor-pointer transition-colors">
              Lupa password?
            </span>
          </div>
        </form>

        <footer className="text-xs font-bold text-text-muted uppercase tracking-widest mt-4">
          PLN Indonesia Power © 2026
        </footer>
      </div>
    </div>
  );
}
