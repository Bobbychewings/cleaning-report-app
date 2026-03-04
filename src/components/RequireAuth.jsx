import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function RequireAuth({ allowedRoles }) {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect non-admins trying to access admin pages
    return <Navigate to={userRole === 'admin' ? "/admin" : "/staff"} replace />;
  }

  return <Outlet />;
}
