const MANAGE_ROLES = ['admin', 'superadmin'];

export const getStoredToken = () => {
  const token = localStorage.getItem('sa_token');
  if (!token || token === 'undefined' || token === 'null' || typeof token !== 'string' || !token.trim()) {
    return null;
  }
  return token;
};

export const getStoredAuthUser = () => {
  try {
    const userStr = localStorage.getItem('sa_authUser');
    if (!userStr || userStr === 'undefined' || userStr === 'null') return null;
    return JSON.parse(userStr);
  } catch (error) {
    return null;
  }
};

export const getStoredRole = () => {
  const user = getStoredAuthUser();
  return String(user?.role || '').toLowerCase();
};

export const canManageAcademyRecords = () => MANAGE_ROLES.includes(getStoredRole());

export const canMarkAttendanceAndPayments = () => ['admin', 'superadmin', 'coach'].includes(getStoredRole());

export const canEditPlayer = () => ['admin', 'superadmin', 'coach'].includes(getStoredRole());

