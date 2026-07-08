import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  FiActivity, FiAward, FiBarChart2, FiCalendar, FiChevronDown, 
  FiFolder, FiHome, FiLogOut, FiMenu, FiSearch, FiUserCheck, 
  FiUsers, FiX, FiBell, FiSettings, FiUser
} from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';

const NAV_LINKS = [
  { to: '/home', label: 'Dashboard', icon: <FiHome /> },
  { to: '/games', label: 'Games', icon: <FiAward /> },
  { to: '/coach', label: 'Coaches', icon: <FiUsers /> },
  { to: '/player', label: 'Players', icon: <FiUserCheck /> },
  { to: '/attendance', label: 'Attendance', icon: <FiCalendar /> },
  { to: '/payment', label: 'Payments', icon: <FaRupeeSign /> },
];

const REPORT_LINKS = [
  { to: '/reportgame', label: 'Game Reports', icon: <FiBarChart2 /> },
  { to: '/reportcoachs', label: 'Coach Reports', icon: <FiFolder /> },
  { to: '/reportplayers', label: 'Player Reports', icon: <FiBarChart2 /> },
  { to: '/transaction-report', label: 'Transaction Report', icon: <FiFolder /> },
  { to: '/audit', label: 'Audit Log', icon: <FiActivity /> },
];

const normalize = (value) => String(value ?? '').toLowerCase().trim();

export default function Navbar({ searchQuery = '', setSearchQuery = () => {} }) {
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const reportMenuRef = useRef(null);
  const notificationRef = useRef(null);
  const profileMenuRef = useRef(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reportMenuOpen, setReportMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  
  const [dataLoaded, setDataLoaded] = useState(false);
  const [gamesData, setGamesData] = useState([]);
  const [coachesData, setCoachesData] = useState([]);
  const [playersData, setPlayersData] = useState([]);
  const [paymentsData, setPaymentsData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  const [currentUser, setCurrentUser] = useState(null);

  const isReportPage = ['/reportgame', '/reportcoachs', '/reportplayers'].includes(location.pathname);
  const userRole = String(currentUser?.role || 'admin').toLowerCase();
  const canViewAudit = ['admin', 'superadmin', 'accountant'].includes(userRole);
  const canManageSettings = ['admin', 'superadmin'].includes(userRole);
  const isCoach = userRole === 'coach';

  const filteredNavLinks = NAV_LINKS.filter(link => {
    if (isCoach) {
      return ['/home', '/player', '/attendance', '/payment'].includes(link.to);
    }
    return true;
  }).map(link => {
    if (isCoach && link.to === '/player') {
      return { ...link, to: '/reportplayers' };
    }
    return link;
  });

  const filteredReportLinks = REPORT_LINKS.filter(link => {
    if (isCoach) {
      return ['/reportgame', '/transaction-report'].includes(link.to);
    }
    return link.to !== '/audit' || canViewAudit;
  });

  useEffect(() => {
    setMobileMenuOpen(false);
    setReportMenuOpen(false);
    setNotificationMenuOpen(false);
    setProfileMenuOpen(false);
    setSearchFocused(false);
  }, [location.pathname]);

  useEffect(() => {
    try {
      setCurrentUser(JSON.parse(localStorage.getItem('authUser') || 'null'));
    } catch (error) {
      setCurrentUser(null);
    }
  }, [location.pathname]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchFocused(false);
      }
      if (reportMenuRef.current && !reportMenuRef.current.contains(event.target)) {
        setReportMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Lookup Data
  useEffect(() => {
    const fetchSearchData = async () => {
      if (dataLoaded) return;
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const [gRes, cRes, pRes, payRes, attRes, notifRes] = await Promise.all([
          fetch('http://localhost:4005/games/report', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:4005/coach/report', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:4005/players/report', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:4005/payments/report', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:4005/attendance/report', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:4005/notifications', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const gJson = await gRes.json();
        const cJson = await cRes.json();
        const pJson = await pRes.json();
        const payJson = await payRes.json();
        const attJson = await attRes.json();
        const notifJson = await notifRes.json();

        if (gJson.success) setGamesData(gJson.data || []);
        if (cJson.success) setCoachesData(cJson.data || []);
        if (pJson.success) setPlayersData(pJson.data || []);
        if (payJson.success) setPaymentsData(payJson.data || []);
        if (attJson.success) setAttendanceData(attJson.data || []);
        if (notifJson.success) setNotifications(notifJson.data || []);
        
        setDataLoaded(true);
      } catch (error) {
        console.error('Error fetching navbar metadata:', error);
      }
    };

    fetchSearchData();
  }, [dataLoaded, location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authUser');
    navigate('/login');
  };

  const handleMarkNotifRead = async (id) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`http://localhost:4005/notifications/read/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  // Search filter matches
  const searchResults = useMemo(() => {
    const query = normalize(searchQuery);
    if (!query || !dataLoaded) return [];

    const mapMatches = (items, route, labelKey, fields, typeLabel) => {
      return items
        .filter((item) => fields.some((field) => normalize(item[field]).includes(query)))
        .slice(0, 3)
        .map((item) => ({
          route,
          label: item[labelKey] || item.name || item.fullName || item.gameName || 'Record',
          meta: `${typeLabel} • ` + fields.map((field) => item[field]).filter(Boolean).slice(0, 2).join(' • '),
        }));
    };

    return [
      ...mapMatches(gamesData, '/reportgame', 'gameName', ['gameName', 'gameId', 'category'], 'Game'),
      ...mapMatches(coachesData, '/reportcoachs', 'name', ['name', 'coachId', 'sportSpecialization'], 'Coach'),
      ...mapMatches(playersData, '/reportplayers', 'fullName', ['fullName', 'playerId', 'sportChosen'], 'Player'),
      ...mapMatches(paymentsData, '/reportplayers', 'playerName', ['playerName', 'playerId', 'paymentMethod', 'transactionId'], 'Payment'),
      ...mapMatches(attendanceData, '/attendance', 'playerName', ['playerName', 'playerId', 'status', 'attendanceDate'], 'Attendance'),
    ].slice(0, 8);
  }, [searchQuery, dataLoaded, gamesData, coachesData, playersData, paymentsData, attendanceData]);

  const navigateToResult = (route, value) => {
    setSearchQuery(value);
    setSearchFocused(false);
    setReportMenuOpen(false);
    setMobileMenuOpen(false);
    navigate(route);
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchQuery(value);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          
          {/* Logo Branding */}
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 shrink-0 text-left cursor-pointer"
            aria-label="Go to dashboard"
          >
            <span className="text-2xl">🏆</span>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-base text-gray-800">Sport Academy</span>
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Management System</span>
            </div>
          </button>

          {/* Desktop Nav Links */}
          <div className="hidden xl:flex items-center gap-1 flex-1 justify-center">
            {filteredNavLinks.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setSearchQuery('')}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-500/10' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`
                }
              >
                <span className="text-base shrink-0">{icon}</span>
                <span>{label}</span>
              </NavLink>
            ))}

            {/* Reports Dropdown */}
            <div className="relative" ref={reportMenuRef}>
              <button
                onClick={() => setReportMenuOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none select-none cursor-pointer ${
                  isReportPage ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-500/10' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-base shrink-0"><FiBarChart2 /></span>
                <span>Reports</span>
                <FiChevronDown className={`text-xs transition-transform duration-200 ${reportMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <div className={`absolute left-0 mt-1 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 ${reportMenuOpen ? 'block' : 'hidden'}`}>
                {filteredReportLinks.map(({ to, label, icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => {
                      setReportMenuOpen(false);
                      setSearchQuery('');
                    }}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${isActive ? 'bg-blue-50/50 text-blue-600 font-semibold' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'}`
                    }
                  >
                    <span className="text-sm">{icon}</span>
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div className="hidden md:flex relative items-center min-w-[200px] max-w-sm flex-1" ref={searchRef}>
            <span className="absolute left-3 text-gray-400 text-base pointer-events-none"><FiSearch /></span>
            <input
              type="text"
              placeholder={isReportPage ? 'Search reports...' : 'Search records...'}
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setSearchFocused(true)}
              className="w-full pl-9 pr-10 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                Clear
              </button>
            )}

            {searchFocused && searchQuery && searchResults.length > 0 && (
              <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden z-50">
                <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-50">
                  Search results
                </div>
                <div className="max-h-80 overflow-auto">
                  {searchResults.map((result, index) => (
                    <button
                      key={`${result.route}-${index}-${result.label}`}
                      onClick={() => navigateToResult(result.route, searchQuery)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                    >
                      <div className="text-sm font-semibold text-gray-700">{result.label}</div>
                      <div className="text-[11px] text-gray-400 truncate">{result.meta}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Area: Notifications bell + Profile dropdown */}
          <div className="flex items-center gap-3">
            
            {/* Bell Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
                className="p-2 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors cursor-pointer relative"
              >
                <FiBell className="text-xl" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 max-h-96 overflow-y-auto">
                  <div className="px-4 py-2 font-bold text-sm text-gray-700 border-b border-gray-100 flex justify-between items-center">
                    <span>Notifications</span>
                    {unreadCount > 0 && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-bold">{unreadCount} Alerts</span>}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-xs text-gray-400">No new alerts or notifications.</div>
                  ) : (
                    <div className="divide-y divide-gray-55">
                      {notifications.map((notif) => (
                        <div key={notif._id} className="p-4 hover:bg-slate-50 transition flex justify-between items-start gap-2">
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-gray-800">{notif.title}</h4>
                            <p className="text-[11px] text-gray-500">{notif.message}</p>
                            <span className="text-[9px] text-gray-400 block">{new Date(notif.createdAt).toLocaleDateString()}</span>
                          </div>
                          <button
                            onClick={() => handleMarkNotifRead(notif._id)}
                            className="text-[10px] font-semibold text-blue-600 hover:underline shrink-0"
                          >
                            Dismiss
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl border border-gray-200 bg-gray-50 text-left hover:border-gray-300 transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold uppercase flex items-center justify-center text-sm overflow-hidden">
                  {currentUser?.profileImage ? (
                    <img src={currentUser.profileImage} alt="profile" className="w-full h-full object-cover" />
                  ) : (
                    (currentUser?.name || 'U').slice(0, 1)
                  )}
                </div>
                <div className="hidden sm:block leading-tight pr-1">
                  <div className="text-xs font-semibold text-gray-800 truncate max-w-[100px]">{currentUser?.name || 'User'}</div>
                  <div className="text-[9px] text-gray-400 uppercase tracking-wider">{userRole}</div>
                </div>
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-50">
                    <p className="text-xs text-gray-400">Signed in as</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{currentUser?.email}</p>
                  </div>
                  <NavLink to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600">
                    <FiUser className="text-sm" />
                    <span>My Profile</span>
                  </NavLink>
                  {canManageSettings && (
                    <NavLink to="/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600">
                      <FiSettings className="text-sm" />
                      <span>Academy Settings</span>
                    </NavLink>
                  )}
                  <div className="border-t border-gray-50 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <FiLogOut className="text-sm" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Hamburger */}
            <div className="flex items-center xl:hidden ml-1">
              <button
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="p-2 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-gray-100 bg-white/95 backdrop-blur-md px-4 py-4 space-y-4">
          <div className="relative flex items-center w-full" ref={searchRef}>
            <span className="absolute left-3 text-gray-400 text-base pointer-events-none"><FiSearch /></span>
            <input
              type="text"
              placeholder={isReportPage ? 'Search reports...' : 'Search records...'}
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setSearchFocused(true)}
              className="w-full pl-9 pr-10 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 text-gray-400 hover:text-gray-600 text-xs font-bold">Clear</button>
            )}
          </div>

          {searchFocused && searchQuery && searchResults.length > 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white shadow-lg overflow-hidden">
              {searchResults.map((result, index) => (
                <button
                  key={`${result.route}-mobile-${index}-${result.label}`}
                  onClick={() => navigateToResult(result.route, searchQuery)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                >
                  <div className="text-sm font-semibold text-gray-700">{result.label}</div>
                  <div className="text-[11px] text-gray-400 truncate">{result.meta}</div>
                </button>
              ))}
            </div>
          )}

          <ul className="flex flex-col gap-1">
            {filteredNavLinks.map(({ to, label, icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setSearchQuery('');
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'}`
                  }
                >
                  <span className="text-lg shrink-0">{icon}</span>
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}

            <li className="pt-3 pb-1 px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Reports</li>
            {filteredReportLinks.map(({ to, label, icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setSearchQuery('');
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'}`
                  }
                >
                  <span className="text-lg shrink-0">{icon}</span>
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
