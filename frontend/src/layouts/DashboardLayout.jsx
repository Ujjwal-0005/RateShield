import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar }  from '../components/layout/Navbar';
import { useSidebar } from '../hooks/useSidebar';
import './DashboardLayout.css';

export function DashboardLayout() {
  const { collapsed, toggle } = useSidebar();

  return (
    <div className={`dashboard-layout ${collapsed ? 'dashboard-layout--collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <Navbar sidebarCollapsed={collapsed} />
      <main
        className="dashboard-main"
        id="main-content"
        tabIndex={-1}
      >
        <div className="dashboard-content fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
