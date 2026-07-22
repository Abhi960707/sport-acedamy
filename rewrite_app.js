const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'frontend/src/App.jsx');

const newAppContent = `import React, { useState, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

// Common/Auth Pages
import Login from './Component/Login';
import Signup from './Component/Signup';
import Forgot from './Component/Forgot';
import Navbar from './common/Navbar';
import ProtectedRoute from './common/ProtectedRoute';
import { ToastProvider } from './common/Toast';

// Role-based dynamic loader
const RoleComponent = ({ page, ...props }) => {
  const user = JSON.parse(localStorage.getItem('authUser') || '{}');
  const role = user.role || 'admin';
  
  const Component = React.useMemo(() => React.lazy(() => import(\`./roles/\${role}/\${page}.jsx\`)), [role, page]);
  
  return (
    <React.Suspense fallback={<div className="flex justify-center py-20"><span className="animate-spin inline-block w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full" /></div>}>
      <Component {...props} />
    </React.Suspense>
  );
};

function AppLayout() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const authRoutes = ['/login', '/signup', '/forgot-password'];
  const showNavbar = !authRoutes.includes(location.pathname);

  // Clear search query when changing pages or parse from URL
  useEffect(() => {
    const isReport = ['/reportgame', '/reportcoachs', '/reportplayers'].includes(location.pathname);
    const params = new URLSearchParams(location.search);
    const query = params.get('query');
    if (query) {
      setSearchQuery(query);
    } else if (!isReport) {
      setSearchQuery('');
    }
  }, [location.pathname, location.search]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-slate-800">
      {showNavbar && <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path='/' element={<Navigate to="/login" replace />} />
          <Route path='/login' element={<Login />} />
          <Route path='/signup' element={<Signup />} />
          <Route path='/forgot-password' element={<Forgot />} />
          
          {/* Role Based Routes */}
          <Route path='/home' element={<ProtectedRoute><RoleComponent page="Dashboard" /></ProtectedRoute>} />
          <Route path='/games' element={<ProtectedRoute><RoleComponent page="Games" /></ProtectedRoute>} />
          <Route path='/coach' element={<ProtectedRoute><RoleComponent page="Coaches" /></ProtectedRoute>} />
          <Route path='/player' element={<ProtectedRoute><RoleComponent page="Players" /></ProtectedRoute>} />
          <Route path='/profile' element={<ProtectedRoute><RoleComponent page="Profile" /></ProtectedRoute>} />
          <Route path='/settings' element={<ProtectedRoute><RoleComponent page="Settings" /></ProtectedRoute>} />
          
          <Route path='/reportgame' element={<ProtectedRoute><RoleComponent page="ReportGames" searchQuery={searchQuery} /></ProtectedRoute>} />
          <Route path='/reportcoachs' element={<ProtectedRoute><RoleComponent page="ReportCoaches" searchQuery={searchQuery} /></ProtectedRoute>} />
          <Route path='/reportplayers' element={<ProtectedRoute><RoleComponent page="ReportPlayers" searchQuery={searchQuery} /></ProtectedRoute>} />
          
          <Route path='/transaction-report' element={<ProtectedRoute><RoleComponent page="TransactionReport" /></ProtectedRoute>} />
          <Route path='/audit' element={<ProtectedRoute><RoleComponent page="AuditLogs" /></ProtectedRoute>} />
          <Route path='/attendance' element={<ProtectedRoute><RoleComponent page="Attendance" /></ProtectedRoute>} />
          <Route path='/payment' element={<ProtectedRoute><RoleComponent page="Payments" /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppLayout />
    </ToastProvider>
  );
}

export default App;
`;

fs.writeFileSync(appPath, newAppContent);
console.log('App.jsx updated with dynamic RoleComponent.');
