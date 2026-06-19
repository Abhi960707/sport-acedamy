import { NavLink, useNavigate } from 'react-router-dom';
import '../Style/Navbar.css';

const NAV_LINKS = [
  { to: '/home',          label: 'Dashboard',      icon: '⚡' },
  { to: '/games',         label: 'Games',           icon: '🎮' },
  { to: '/coach',         label: 'Coaches',         icon: '👤' },
  { to: '/player',        label: 'Players',         icon: '🏃' },
  { to: '/reportgame',    label: 'Game Reports',    icon: '📊' },
  { to: '/reportcoachs',  label: 'Coach Reports',   icon: '📋' },
  { to: '/reportplayers', label: 'Player Reports',  icon: '📁' },
];

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      {/* Brand */}
      <div className="navbar__brand">
        <span className="navbar__brand-icon">🏆</span>
        <div className="navbar__brand-text">
          <span className="navbar__brand-title">Sport Academy</span>
          <span className="navbar__brand-sub">Management System</span>
        </div>
      </div>

      {/* Links */}
      <ul className="navbar__links">
        {NAV_LINKS.map(({ to, label, icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `navbar__link${isActive ? ' navbar__link--active' : ''}`
              }
            >
              <span className="navbar__link-icon">{icon}</span>
              <span className="navbar__link-label">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Logout */}
      <button className="navbar__logout" onClick={handleLogout} id="logout-btn">
        <span>Logout</span>
        <span className="navbar__logout-icon">→</span>
      </button>
    </nav>
  );
}
