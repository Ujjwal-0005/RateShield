import { useState, useRef, useEffect } from 'react';
import { useNavigate, useMatches } from 'react-router-dom';
import { LogOut, User, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

export function Navbar({ sidebarCollapsed }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const matches = useMatches();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Build breadcrumbs from route handles
  const crumbs = matches
    .filter((m) => m.handle?.crumb)
    .map((m, i, arr) => ({ label: m.handle.crumb, isLast: i === arr.length - 1 }));

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'A';

  return (
    <header
      className="navbar"
      style={{ left: sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)' }}
    >
      {/* Breadcrumbs */}
      <nav className="navbar__breadcrumbs" aria-label="Breadcrumb">
        {crumbs.length > 0 ? (
          crumbs.map(({ label, isLast }, i) => (
            <span key={i} className="navbar__crumb-wrap">
              {i > 0 && <ChevronRight size={13} className="navbar__crumb-sep" aria-hidden="true" />}
              <span className={`navbar__crumb ${isLast ? 'navbar__crumb--active' : ''}`}>
                {label}
              </span>
            </span>
          ))
        ) : (
          <span className="navbar__crumb navbar__crumb--active">Dashboard</span>
        )}
      </nav>

      {/* Right: user menu */}
      <div className="navbar__right">
        <div className="navbar__user-menu" ref={menuRef}>
          <button
            className="navbar__user-btn"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="true"
            aria-label="User menu"
          >
            <span className="navbar__avatar" aria-hidden="true">{initials}</span>
            <span className="navbar__user-info">
              <span className="navbar__user-name">{user?.name || 'Admin'}</span>
              <span className="navbar__user-role">{user?.role || 'admin'}</span>
            </span>
            <ChevronDown size={14} className={`navbar__chevron ${menuOpen ? 'navbar__chevron--open' : ''}`} aria-hidden="true" />
          </button>

          {menuOpen && (
            <div className="navbar__dropdown" role="menu" aria-label="User options">
              <div className="navbar__dropdown-header">
                <p className="navbar__dropdown-name">{user?.name}</p>
                <p className="navbar__dropdown-email">{user?.email}</p>
              </div>
              <div className="navbar__dropdown-divider" />
              <button
                className="navbar__dropdown-item"
                onClick={() => { setMenuOpen(false); navigate('/settings'); }}
                role="menuitem"
              >
                <User size={14} aria-hidden="true" />
                Profile &amp; Settings
              </button>
              <button
                className="navbar__dropdown-item navbar__dropdown-item--danger"
                onClick={handleLogout}
                role="menuitem"
              >
                <LogOut size={14} aria-hidden="true" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
