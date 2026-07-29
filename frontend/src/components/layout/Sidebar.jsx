import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Shield, Key, Settings, ChevronLeft,
  ChevronRight, BarChart2, Zap,
} from 'lucide-react';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: '/dashboard',  label: 'Dashboard', icon: LayoutDashboard },
  { to: '/policies',   label: 'Policies',  icon: Shield          },
  { to: '/api-keys',   label: 'API Keys',  icon: Key             },
  { to: '/analytics',  label: 'Analytics', icon: BarChart2, soon: true },
  { to: '/settings',   label: 'Settings',  icon: Settings        },
];

export function Sidebar({ collapsed, onToggle }) {
  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`} aria-label="Main navigation">
      {/* Logo */}
      <div className="sidebar__logo">
        <div className="sidebar__logo-icon" aria-hidden="true">
          <Zap size={18} />
        </div>
        {!collapsed && (
          <div className="sidebar__logo-text">
            <span className="sidebar__logo-name">RateShield</span>
            <span className="sidebar__logo-version">v1.0</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="sidebar__nav" role="navigation">
        <ul className="sidebar__nav-list" role="list">
          {NAV_ITEMS.map(({ to, label, icon: Icon, soon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''} ${soon ? 'sidebar__nav-item--soon' : ''}`
                }
                title={collapsed ? label : undefined}
                aria-label={label}
                onClick={soon ? (e) => e.preventDefault() : undefined}
                tabIndex={soon ? -1 : 0}
              >
                <Icon size={17} className="sidebar__nav-icon" aria-hidden="true" />
                {!collapsed && (
                  <span className="sidebar__nav-label">
                    {label}
                    {soon && <span className="sidebar__soon-badge">Soon</span>}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <button
        className="sidebar__toggle"
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        {!collapsed && <span>Collapse</span>}
      </button>
    </aside>
  );
}
