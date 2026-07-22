import React from 'react';
import AdminTable from '../../shared/components/AdminTable';

export default function AdminManagement() {
  return (
    <div className="w-full h-full bg-gray-50/50">
      <AdminTable role="superadmin" />
    </div>
  );
}
