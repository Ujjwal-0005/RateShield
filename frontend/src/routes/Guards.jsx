import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '../components/ui/States';

/** Redirects unauthenticated users to /login, preserving the return path */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, initDone } = useAuth();
  const location = useLocation();

  if (!initDone) return <PageLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

/** Redirects already-authenticated users away from public routes (e.g. /login) */
export function PublicRoute({ children }) {
  const { isAuthenticated, initDone } = useAuth();

  if (!initDone) return <PageLoader />;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
