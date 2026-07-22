const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend/src');
const componentsDir = path.join(srcDir, 'Component');
const sharedComponentsDir = path.join(srcDir, 'shared/components');
const sharedFormsDir = path.join(srcDir, 'shared/forms');
const commonDir = path.join(srcDir, 'common');
const rolesDir = path.join(srcDir, 'roles');

// 1. Move common files
const commonFiles = ['Navbar.js', 'Navbar.jsx', 'ProtectedRoute.jsx', 'access.js', 'Toast.jsx', 'reportExport.js'];
commonFiles.forEach(f => {
  const p = path.join(componentsDir, f);
  if (fs.existsSync(p)) {
    fs.renameSync(p, path.join(commonDir, f));
  }
});

// 2. Move & rename forms
const formsMapping = {
  'Player.jsx': 'PlayerForm.jsx',
  'Coach.jsx': 'CoachForm.jsx',
  'Games.jsx': 'GameForm.jsx',
  'Attendance.jsx': 'AttendanceForm.jsx',
  'Payment.jsx': 'PaymentForm.jsx'
};

Object.entries(formsMapping).forEach(([src, dest]) => {
  const p = path.join(componentsDir, src);
  if (fs.existsSync(p)) {
    fs.renameSync(p, path.join(sharedFormsDir, dest));
  }
});

// 3. Move & rename tables/components
const tablesMapping = {
  'Reportplayers.jsx': 'PlayerTable.jsx',
  'Reportcoachs.jsx': 'CoachTable.jsx',
  'Reportgame.jsx': 'GameTable.jsx',
  'TransactionReport.jsx': 'ReportTable.jsx', // Use ReportTable for transaction
  'AuditLog.jsx': 'AuditLogTable.jsx',
  'ExportDropdown.jsx': 'ExportDropdown.jsx'
};

Object.entries(tablesMapping).forEach(([src, dest]) => {
  const p = path.join(componentsDir, src);
  if (fs.existsSync(p)) {
    fs.renameSync(p, path.join(sharedComponentsDir, dest));
  }
});

// Other files to move or leave? Settings, Profile, Login, Signup, Forgot, Home, CoachDashboard
const otherShared = {
  'Settings.jsx': path.join(sharedComponentsDir, 'SettingsShared.jsx'),
  'Profile.jsx': path.join(sharedComponentsDir, 'ProfileShared.jsx'),
  'Home.jsx': path.join(sharedComponentsDir, 'DashboardShared.jsx'),
  'CoachDashboard.jsx': path.join(sharedComponentsDir, 'CoachDashboardShared.jsx')
};
Object.entries(otherShared).forEach(([src, dest]) => {
  const p = path.join(componentsDir, src);
  if (fs.existsSync(p)) {
    fs.renameSync(p, dest);
  }
});

// 4. Create Role Wrappers
const roles = ['superadmin', 'admin', 'coach'];
const rolePages = {
  superadmin: ['Dashboard', 'AcademyManagement', 'AdminManagement', 'Players', 'Coaches', 'Games', 'Attendance', 'Payments', 'ReportPlayers', 'ReportCoaches', 'ReportGames', 'TransactionReport', 'Notifications', 'AuditLogs', 'Settings', 'Profile'],
  admin: ['Dashboard', 'Players', 'Coaches', 'Games', 'Attendance', 'Payments', 'ReportPlayers', 'ReportCoaches', 'ReportGames', 'TransactionReport', 'Settings', 'Profile'],
  coach: ['Dashboard', 'Players', 'Attendance', 'Payments', 'ReportPlayers', 'TransactionReport', 'Profile']
};

roles.forEach(role => {
  const dir = path.join(rolesDir, role);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  rolePages[role].forEach(page => {
    let content = `import React from 'react';\n`;
    
    // Determine imports based on page
    if (page === 'Players') {
      content += `import PlayerForm from '../../shared/forms/PlayerForm';\nexport default function ${page}() { return <PlayerForm role="${role}" />; }\n`;
    } else if (page === 'ReportPlayers') {
      content += `import PlayerTable from '../../shared/components/PlayerTable';\nexport default function ${page}() { return <PlayerTable role="${role}" />; }\n`;
    } else if (page === 'Coaches') {
      content += `import CoachForm from '../../shared/forms/CoachForm';\nexport default function ${page}() { return <CoachForm role="${role}" />; }\n`;
    } else if (page === 'ReportCoaches') {
      content += `import CoachTable from '../../shared/components/CoachTable';\nexport default function ${page}() { return <CoachTable role="${role}" />; }\n`;
    } else if (page === 'Games') {
      content += `import GameForm from '../../shared/forms/GameForm';\nexport default function ${page}() { return <GameForm role="${role}" />; }\n`;
    } else if (page === 'ReportGames') {
      content += `import GameTable from '../../shared/components/GameTable';\nexport default function ${page}() { return <GameTable role="${role}" />; }\n`;
    } else if (page === 'Attendance') {
      content += `import AttendanceForm from '../../shared/forms/AttendanceForm';\nexport default function ${page}() { return <AttendanceForm role="${role}" />; }\n`;
    } else if (page === 'Payments') {
      content += `import PaymentForm from '../../shared/forms/PaymentForm';\nexport default function ${page}() { return <PaymentForm role="${role}" />; }\n`;
    } else if (page === 'Dashboard') {
      content += `import DashboardShared from '../../shared/components/DashboardShared';\nexport default function ${page}() { return <DashboardShared role="${role}" />; }\n`;
    } else if (page === 'Settings') {
      content += `import SettingsShared from '../../shared/components/SettingsShared';\nexport default function ${page}() { return <SettingsShared role="${role}" />; }\n`;
    } else if (page === 'Profile') {
      content += `import ProfileShared from '../../shared/components/ProfileShared';\nexport default function ${page}() { return <ProfileShared role="${role}" />; }\n`;
    } else if (page === 'AuditLogs') {
      content += `import AuditLogTable from '../../shared/components/AuditLogTable';\nexport default function ${page}() { return <AuditLogTable role="${role}" />; }\n`;
    } else if (page === 'TransactionReport') {
      content += `import ReportTable from '../../shared/components/ReportTable';\nexport default function ${page}() { return <ReportTable role="${role}" />; }\n`;
    } else {
      content += `export default function ${page}() { return <div><h2>${role} ${page}</h2></div>; }\n`;
    }

    fs.writeFileSync(path.join(dir, page + '.jsx'), content);
  });
});

console.log('Frontend refactor mapping executed successfully.');
