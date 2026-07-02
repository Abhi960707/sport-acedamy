import { Navigate } from 'react-router-dom';

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('authUser') || 'null');
  } catch (error) {
    return null;
  }
};

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const user = getStoredUser();
    const role = String(user?.role || '').toLowerCase();
    if (!allowedRoles.map((value) => String(value).toLowerCase()).includes(role)) {
      return <Navigate to="/home" replace />;
    }
  }

  return children;
}
