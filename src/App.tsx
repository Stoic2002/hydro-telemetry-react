import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth-store';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Overview from './pages/dashboard/Overview';
import Telemetering from './pages/dashboard/Telemetering';

import MachineLearning from './pages/dashboard/MachineLearning';
import Trends from './pages/dashboard/Trends';
import Reports from './pages/dashboard/Reports';
import DataInputGHW from './pages/dashboard/DataInputGHW';
import DataInputOperator from './pages/dashboard/DataInputOperator';
import UserAdmin from './pages/dashboard/UserAdmin';
import Toast from './components/ui/Toast';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Toast />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="telemetering" element={<Telemetering />} />

          <Route path="machine-learning" element={<MachineLearning />} />
          <Route path="trends" element={<Trends />} />
          <Route path="laporan" element={<Reports />} />
          <Route path="data-input-ghw" element={<DataInputGHW />} />
          <Route path="data-input-operator" element={<DataInputOperator />} />
          <Route path="user-admin" element={<UserAdmin />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
