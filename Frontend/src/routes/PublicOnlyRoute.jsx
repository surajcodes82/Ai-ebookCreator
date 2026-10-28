import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/ui/States';

export default function PublicOnlyRoute() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="One moment..." />
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
