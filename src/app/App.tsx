import Toast from '../components/ui/Toast';
import AppProviders from './providers';
import AppRouter from './router';

export default function App() {
  return (
    <AppProviders>
      <Toast />
      <AppRouter />
    </AppProviders>
  );
}
