const MANAGE_ROLES = ['admin', 'superadmin'];

export const getStoredAuthUser = () => {
  try {
    return JSON.parse(localStorage.getItem('authUser') || 'null');
  } catch (error) {
    return null;
  }
};

export const getStoredRole = () => {
  const user = getStoredAuthUser();
  return String(user?.role || '').toLowerCase();
};

export const canManageAcademyRecords = () => MANAGE_ROLES.includes(getStoredRole());
