import { Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('authUser') || 'null');
  } catch (error) {
    return null;
  }
};

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const location = useLocation();
  const [hasAcademy, setHasAcademy] = useState(null);

  useEffect(() => {
    if (!token) return;
    const checkAcademy = async () => {
      try {
        const res = await fetch('http://localhost:4005/auth/check-academy', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setHasAcademy(data.hasAcademy);
      } catch (e) {
        setHasAcademy(false);
      }
    };
    checkAcademy();
  }, [token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (hasAcademy === null) {
    return <div className="flex h-screen w-full items-center justify-center text-sm font-semibold text-gray-500">Loading...</div>;
  }

  const user = getStoredUser();
  const role = String(user?.role || '').toLowerCase();

  // If Admin has no academy and tries to access something other than settings/profile
  if (role === 'admin' && !hasAcademy && location.pathname !== '/settings' && location.pathname !== '/profile') {
    return <Navigate to="/settings" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.map((value) => String(value).toLowerCase()).includes(role)) {
      return <Navigate to="/home" replace />;
    }
  }

  return children;
}
