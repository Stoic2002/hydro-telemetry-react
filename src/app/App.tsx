import AppErrorBoundary from '../components/ui/AppErrorBoundary';
import Toast from '../components/ui/Toast';
import AppProviders from './providers';
import AppRouter from './router';

export default function App() {
  return (
    <AppProviders>
      <Toast />
      {/* Jaring terakhir: menangkap kegagalan di luar shell dashboard, mis. Login. */}
      <AppErrorBoundary scope="app-root" className="m-6">
        <AppRouter />
      </AppErrorBoundary>
    </AppProviders>
  );
}
