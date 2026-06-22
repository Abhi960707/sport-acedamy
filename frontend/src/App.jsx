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
import Navbar from './Component/Navbar';
import ProtectedRoute from './Component/ProtectedRoute';
import { ToastProvider } from './Component/Toast';

function AppLayout() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const authRoutes = ['/login', '/signup'];
  const showNavbar = !authRoutes.includes(location.pathname);

  // Clear search query when changing pages
  React.useEffect(() => {
    const isReport = ['/reportgame', '/reportcoachs', '/reportplayers'].includes(location.pathname);
    if (!isReport) {
      setSearchQuery('');
    }
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-slate-800">
      {showNavbar && <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path='/' element={<Navigate to="/login" replace />} />
          <Route path='/login' element={<Login />} />
          <Route path='/signup' element={<Signup />} />
          <Route path='/home' element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path='/games' element={<ProtectedRoute><Games /></ProtectedRoute>} />
          <Route path='/coach' element={<ProtectedRoute><Coach /></ProtectedRoute>} />
          <Route path='/player' element={<ProtectedRoute><Player /></ProtectedRoute>} />
          <Route path='/reportgame' element={<ProtectedRoute><Reportgame searchQuery={searchQuery} /></ProtectedRoute>} />
          <Route path='/reportcoachs' element={<ProtectedRoute><Reportcoachs searchQuery={searchQuery} /></ProtectedRoute>} />
          <Route path='/reportplayers' element={<ProtectedRoute><Reportplayers searchQuery={searchQuery} /></ProtectedRoute>} />
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
