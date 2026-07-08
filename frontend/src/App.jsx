import React, { useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Home from './Component/Home';
import Login from './Component/Login';
import Signup from './Component/Signup';
import Games from './Component/Games';
import Coach from './Component/Coach';
import Player from './Component/Player';
import Reportgame from './Component/Reportgame';
import Reportcoachs from './Component/Reportcoachs';
import Reportplayers from './Component/Reportplayers';
import AuditLog from './Component/AuditLog';
import Attendance from './Component/Attendance';
import Payment from './Component/Payment';
import TransactionReport from './Component/TransactionReport';
import Navbar from './Component/Navbar';
import ProtectedRoute from './Component/ProtectedRoute';
import { ToastProvider } from './Component/Toast';
import Forgot from './Component/Forgot';
import Profile from './Component/Profile';
import Settings from './Component/Settings';

function AppLayout() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const authRoutes = ['/login', '/signup', '/forgot-password'];
  const showNavbar = !authRoutes.includes(location.pathname);

  // Clear search query when changing pages or parse from URL
  React.useEffect(() => {
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
          <Route path='/home' element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path='/games' element={<ProtectedRoute><Games /></ProtectedRoute>} />
          <Route path='/coach' element={<ProtectedRoute><Coach /></ProtectedRoute>} />
          <Route path='/player' element={<ProtectedRoute><Player /></ProtectedRoute>} />
          <Route path='/profile' element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path='/settings' element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path='/reportgame' element={<ProtectedRoute><Reportgame searchQuery={searchQuery} /></ProtectedRoute>} />
          <Route path='/reportcoachs' element={<ProtectedRoute><Reportcoachs searchQuery={searchQuery} /></ProtectedRoute>} />
          <Route path='/reportplayers' element={<ProtectedRoute><Reportplayers searchQuery={searchQuery} /></ProtectedRoute>} />
          <Route path='/transaction-report' element={<ProtectedRoute><TransactionReport /></ProtectedRoute>} />
          <Route path='/audit' element={<ProtectedRoute><AuditLog /></ProtectedRoute>} />
          <Route path='/attendance' element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
          <Route path='/payment' element={<ProtectedRoute><Payment /></ProtectedRoute>} />
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
