import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiAward, FiUsers, FiUserCheck, FiBarChart2, FiLogOut, FiSearch, FiMenu, FiX, FiFolder, FiChevronDown } from 'react-icons/fi';

const NAV_LINKS = [
  { to: '/home',          label: 'Dashboard',      icon: <FiHome /> },
  { to: '/games',         label: 'Games',          icon: <FiAward /> },
  { to: '/coach',         label: 'Coaches',        icon: <FiUsers /> },
  { to: '/player',        label: 'Players',        icon: <FiUserCheck /> },
];

export default function Navbar({ searchQuery, setSearchQuery }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // States to cache reports data for global search matching
  const [dataLoaded, setDataLoaded] = useState(false);
  const [gamesData, setGamesData] = useState([]);
  const [coachesData, setCoachesData] = useState([]);
  const [playersData, setPlayersData] = useState([]);

  const fetchSearchData = async () => {
    if (dataLoaded) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const [gRes, cRes, pRes] = await Promise.all([
        fetch('http://localhost:4005/games/report', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:4005/coach/report', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:4005/players/report', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const gJson = await gRes.json();
      const cJson = await cRes.json();
      const pJson = await pRes.json();
      
      if (gJson.success) setGamesData(gJson.data || []);
      if (cJson.success) setCoachesData(cJson.data || []);
      if (pJson.success) setPlayersData(pJson.data || []);
      setDataLoaded(true);
    } catch (err) {
      console.error('Error fetching search lookup data:', err);
    }
  };

  useEffect(() => {
    fetchSearchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const isReportsActive = ['/reportgame', '/reportcoachs', '/reportplayers'].includes(location.pathname);
  const isReportPage = isReportsActive;

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    
    const query = val.toLowerCase().trim();
    if (query === '') return;

    if (!dataLoaded) {
      // Fallback redirection if data hasn't loaded yet
      if (!isReportPage) {
        if (location.pathname === '/coach') navigate('/reportcoachs');
        else if (location.pathname === '/player') navigate('/reportplayers');
        else navigate('/reportgame');
      }
      return;
    }

    // Check matches in all datasets
    const matchesGame = gamesData.some(g =>
      (g.gameName && g.gameName.toLowerCase().includes(query)) ||
      (g.gameId && g.gameId.toLowerCase().includes(query)) ||
      (g.category && g.category.toLowerCase().includes(query)) ||
      (g.gameType && g.gameType.toLowerCase().includes(query))
    );

    const matchesCoach = coachesData.some(c =>
      (c.name && c.name.toLowerCase().includes(query)) ||
      (c.coachId && c.coachId.toLowerCase().includes(query)) ||
      (c.sportSpecialization && c.sportSpecialization.toLowerCase().includes(query)) ||
      (c.contact && c.contact.toLowerCase().includes(query))
    );

    const matchesPlayer = playersData.some(p =>
      (p.fullName && p.fullName.toLowerCase().includes(query)) ||
      (p.playerId && p.playerId.toLowerCase().includes(query)) ||
      (p.sportChosen && p.sportChosen.toLowerCase().includes(query)) ||
      (p.coachAssigned && p.coachAssigned.toLowerCase().includes(query)) ||
      (p.contactNumber && p.contactNumber.toLowerCase().includes(query)) ||
      (p.email && p.email.toLowerCase().includes(query))
    );

    if (isReportPage) {
      // Dynamic report-to-report redirection if current report doesn't match but another does
      if (location.pathname === '/reportgame') {
        if (!matchesGame) {
          if (matchesPlayer) navigate('/reportplayers');
          else if (matchesCoach) navigate('/reportcoachs');
        }
      } else if (location.pathname === '/reportcoachs') {
        if (!matchesCoach) {
          if (matchesPlayer) navigate('/reportplayers');
          else if (matchesGame) navigate('/reportgame');
        }
      } else if (location.pathname === '/reportplayers') {
        if (!matchesPlayer) {
          if (matchesCoach) navigate('/reportcoachs');
          else if (matchesGame) navigate('/reportgame');
        }
      }
    } else {
      // Direct navigation from non-reports page based on matching content
      if (matchesPlayer) {
        navigate('/reportplayers');
      } else if (matchesCoach) {
        navigate('/reportcoachs');
      } else if (matchesGame) {
        navigate('/reportgame');
      } else {
        // Fallback depending on path
        if (location.pathname === '/coach') navigate('/reportcoachs');
        else if (location.pathname === '/player') navigate('/reportplayers');
        else navigate('/reportgame');
      }
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-2xl animate-pulse">🏆</span>
            <div className="flex flex-col leading-tight">
              <span className="font-display font-bold text-base bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                Sport Academy
              </span>
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                Management System
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <ul className="hidden xl:flex items-center gap-1 flex-1 justify-center">
            {NAV_LINKS.map(({ to, label, icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={() => setSearchQuery('')}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-500/10'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                    }`
                  }
                >
                  <span className="text-base shrink-0">{icon}</span>
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}

            {/* Reports Dropdown Menu */}
            <li className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none select-none cursor-pointer ${
                  isReportsActive
                    ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-500/10'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-base shrink-0"><FiBarChart2 /></span>
                <span>Reports</span>
                <FiChevronDown className={`text-xs transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <div className={`absolute left-0 mt-1 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 animate-fadeIn z-50 ${dropdownOpen ? 'block' : 'hidden'}`}>
                <NavLink
                  to="/reportgame"
                  onClick={() => {
                    setDropdownOpen(false);
                    setSearchQuery('');
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-50/50 text-blue-600 font-semibold'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                    }`
                  }
                >
                  <FiBarChart2 className="text-sm" />
                  <span>Game Reports</span>
                </NavLink>
                <NavLink
                  to="/reportcoachs"
                  onClick={() => {
                    setDropdownOpen(false);
                    setSearchQuery('');
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-50/50 text-blue-600 font-semibold'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                    }`
                  }
                >
                  <FiFolder className="text-sm" />
                  <span>Coach Reports</span>
                </NavLink>
                <NavLink
                  to="/reportplayers"
                  onClick={() => {
                    setDropdownOpen(false);
                    setSearchQuery('');
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-50/50 text-blue-600 font-semibold'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                    }`
                  }
                >
                  <FiBarChart2 className="text-sm" />
                  <span>Player Reports</span>
                </NavLink>
              </div>
            </li>
          </ul>

          {/* Global Search Bar (Desktop/Tablet) */}
          <div className="hidden md:flex relative items-center max-w-xs flex-1">
            <span className="absolute left-3 text-gray-400 text-base pointer-events-none">
              <FiSearch />
            </span>
            <input
              type="text"
              placeholder={isReportPage ? "Search reports..." : "Search (Go to Reports)..."}
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={fetchSearchData}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Logout Button (Desktop) */}
          <button
            onClick={handleLogout}
            id="logout-btn"
            className="hidden md:flex items-center gap-2 px-4 py-2 border border-red-200 bg-red-50/50 hover:bg-red-50 text-red-600 hover:text-red-700 font-semibold text-sm rounded-xl transition-all duration-200 cursor-pointer"
          >
            <span>Logout</span>
            <FiLogOut />
          </button>

          {/* Mobile controls (Search icon + Hamburger) */}
          <div className="flex items-center gap-2 xl:hidden ml-auto">
            {/* Hamburger Icon */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer/Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-gray-100 bg-white/95 backdrop-blur-md px-4 py-4 space-y-4 animate-fadeIn">
          {/* Mobile Search */}
          <div className="relative flex items-center md:hidden w-full">
            <span className="absolute left-3 text-gray-400 text-base pointer-events-none">
              <FiSearch />
            </span>
            <input
              type="text"
              placeholder={isReportPage ? "Search reports..." : "Search..."}
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={fetchSearchData}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map(({ to, label, icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setSearchQuery('');
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                    }`
                  }
                >
                  <span className="text-lg shrink-0">{icon}</span>
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}

            {/* Reports Section header in Mobile */}
            <li className="pt-3 pb-1 px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
              Reports
            </li>

            <li>
              <NavLink
                to="/reportgame"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSearchQuery('');
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`
                }
              >
                <FiBarChart2 className="text-lg shrink-0" />
                <span>Game Reports</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/reportcoachs"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSearchQuery('');
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`
                }
              >
                <FiFolder className="text-lg shrink-0" />
                <span>Coach Reports</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/reportplayers"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSearchQuery('');
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`
                }
              >
                <FiBarChart2 className="text-lg shrink-0" />
                <span>Player Reports</span>
              </NavLink>
            </li>
          </ul>

          {/* Mobile Logout */}
          <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="flex items-center justify-center gap-2 w-full py-3 bg-red-50 hover:bg-red-100/80 text-red-600 font-semibold text-sm rounded-xl transition-all duration-200"
            >
              <FiLogOut />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
