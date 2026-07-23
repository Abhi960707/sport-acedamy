import { Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../api';
import { getStoredToken, getStoredAuthUser } from './access';

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = getStoredToken();
  const location = useLocation();
  const [hasAcademy, setHasAcademy] = useState(null);

  useEffect(() => {
    const validToken = getStoredToken();
    if (!validToken) return;
    if (hasAcademy === true) return;

    const checkAcademy = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/check-academy`, {
          headers: { Authorization: `Bearer ${validToken}` },
          cache: 'no-store'
        });
        if (res.status === 401) {
          // Token is invalid/expired — clear storage and redirect
          localStorage.removeItem('token');
          localStorage.removeItem('authUser');
          setHasAcademy(false);
          return;
        }
        const data = await res.json();
        setHasAcademy(data.hasAcademy !== false); // default true unless explicitly false
      } catch {
        // Network error — assume academy exists to avoid false redirects
        setHasAcademy(true);
      }
    };
    checkAcademy();
  }, [token, location.pathname, hasAcademy]);

  // No token → go to login
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const user = getStoredAuthUser();
  const role = String(user?.role || '').toLowerCase();

  // Role-based access control (if allowedRoles passed explicitly)
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.map(v => String(v).toLowerCase()).includes(role)) {
      return <Navigate to="/home" replace />;
    }
  }

  // Still checking academy status → show spinner
  if (hasAcademy === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <span className="animate-spin inline-block w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full" />
      </div>
    );
  }

  // Admin with no academy → redirect to settings to configure
  if (
    role === 'admin' &&
    !hasAcademy &&
    location.pathname !== '/settings' &&
    location.pathname !== '/profile'
  ) {
    return <Navigate to="/settings" replace />;
  }

  return children;
}
