import { Component, type ErrorInfo, type ReactNode } from 'react';
import ErrorState from './ErrorState';
import { reportError } from '../../shared/lib/report-error';

export interface ErrorDescription {
  title: string;
  /** Kalimat non-teknis untuk operator. Jangan masukkan pesan mentah server. */
  description: string;
}

interface AppErrorBoundaryProps {
  children: ReactNode;
  /** Asal kejadian yang ikut dilaporkan, mis. 'dashboard-page'. */
  scope: string;
  /**
   * Saat nilainya berubah, boundary pulih sendiri. Diisi dengan pathname supaya
   * operator bisa keluar dari halaman rusak lewat sidebar tanpa reload.
   */
  resetKey?: string;
  /** Mengenali error yang punya penjelasan khusus, mis. PLTA tidak tersedia. */
  describeError?: (error: unknown) => ErrorDescription | null;
  onReset?: () => void;
  className?: string;
}

interface AppErrorBoundaryState {
  error: unknown;
}

const FALLBACK_DESCRIPTION: ErrorDescription = {
  title: 'Halaman ini gagal ditampilkan',
  description:
    'Terjadi gangguan saat menyiapkan tampilan. Coba muat ulang bagian ini, atau pilih menu lain di sidebar.',
};

export default class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo): void {
    reportError(error, {
      scope: this.props.scope,
      severity: 'fatal',
      componentStack: errorInfo.componentStack,
    });
  }

  componentDidUpdate(previousProps: AppErrorBoundaryProps): void {
    if (this.state.error === null) return;
    if (previousProps.resetKey === this.props.resetKey) return;

    this.setState({ error: null });
  }

  private handleReset = (): void => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    const { error } = this.state;
    if (error === null) return this.props.children;

    const description = this.props.describeError?.(error) ?? FALLBACK_DESCRIPTION;

    return (
      <div className={`rounded-md border border-border-subtle bg-surface-raised ${this.props.className ?? ''}`}>
        <ErrorState
          title={description.title}
          description={description.description}
          onRetry={this.handleReset}
          className="py-10"
        />
      </div>
    );
  }
}
