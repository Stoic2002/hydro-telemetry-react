import Button from '../atoms/Button';

interface ErrorStateProps {
  title: string;
  /** Kalimat ramah non-teknis — jangan tampilkan pesan mentah dari server. */
  description: string;
  retryLabel?: string;
  isRetrying?: boolean;
  onRetry?: () => void;
  className?: string;
}

/**
 * State error total. Untuk error sebagian — sebagian data gagal tapi layar
 * tetap berguna — pakai `Banner` bertona warning, bukan komponen ini.
 */
export default function ErrorState({
  title,
  description,
  retryLabel = 'Coba lagi',
  isRetrying = false,
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center px-4.5 py-6.5 text-center ${className}`}>
      <div className="flex size-11 items-center justify-center rounded-full bg-red-100 font-mono text-[17px] font-semibold text-red-600">
        !
      </div>
      <p className="mt-3 text-[13px] font-semibold text-slate-900">{title}</p>
      <p className="mt-1 max-w-sm text-[11.5px] leading-[1.6] text-slate-500">{description}</p>
      {onRetry && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          isLoading={isRetrying}
          onClick={onRetry}
          className="mt-3 h-9 rounded-sm px-3.5 text-[12.5px]"
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
