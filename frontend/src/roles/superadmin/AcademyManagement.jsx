import React from 'react';
import AcademyTable from '../../shared/components/AcademyTable';

export default function AcademyManagement() {
  return (
    <div className="w-full h-full bg-gray-50/50">
      <AcademyTable role="superadmin" />
    </div>
  );
}
